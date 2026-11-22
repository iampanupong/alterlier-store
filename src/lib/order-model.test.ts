import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { reconcile, type StockInfo } from "./cart-model";
import {
  buildOrderDraft,
  decidePayment,
  sourcesOf,
  TRANSITIONS,
  type OrderProduct,
  type OrderStatus,
} from "./order-model";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";

type Live = StockInfo & OrderProduct;
const live = (entries: [string, number, number][]) =>
  new Map<string, Live>(
    entries.map(([id, stockQuantity, priceCents]) => [
      id,
      { stockQuantity, priceCents, name: `Product ${id[0]}`, sku: `SKU-${id[0]}`, image: { src: `https://img/${id[0]}`, alt: "" } },
    ]),
  );

describe("buildOrderDraft", () => {
  test("prices every line from live product data and totals in cents", () => {
    const products = live([[A, 5, 12_500], [B, 2, 4_999]]);
    const draft = buildOrderDraft(reconcile([{ id: A, q: 2 }, { id: B, q: 1 }], products), products);
    assert.ok(draft.ok);
    assert.equal(draft.subtotalCents, 2 * 12_500 + 4_999);
    assert.equal(draft.totalCents, draft.subtotalCents);
    assert.deepEqual(draft.lines[0], {
      productId: A,
      productName: "Product 1",
      sku: "SKU-1",
      unitPriceCents: 12_500,
      quantity: 2,
      image: { src: "https://img/1", alt: "" },
    });
  });

  test("a stored line carries no price: a price change since adding is charged at the new price", () => {
    // The cookie holds only { id, q }; checkout reconciles against current rows.
    const now = live([[A, 5, 15_000]]);
    const draft = buildOrderDraft(reconcile([{ id: A, q: 1 }], now), now);
    assert.ok(draft.ok);
    assert.equal(draft.totalCents, 15_000);
  });

  test("refuses a bag whose stock dropped since it was reviewed", () => {
    const products = live([[A, 1, 100]]);
    assert.deepEqual(buildOrderDraft(reconcile([{ id: A, q: 3 }], products), products), {
      ok: false,
      reason: "changed",
    });
  });

  test("refuses a bag with a sold-out line", () => {
    const products = live([[A, 0, 100], [B, 3, 100]]);
    const draft = buildOrderDraft(reconcile([{ id: A, q: 1 }, { id: B, q: 1 }], products), products);
    assert.deepEqual(draft, { ok: false, reason: "changed" });
  });

  test("refuses an empty bag (including products that no longer exist)", () => {
    const products = live([]);
    assert.deepEqual(buildOrderDraft(reconcile([{ id: A, q: 1 }], products), products), {
      ok: false,
      reason: "empty",
    });
  });
});

describe("decidePayment", () => {
  const order = { totalCents: 25_000, currency: "usd" };
  const session = (over: Partial<Parameters<typeof decidePayment>[0]>) => ({
    status: "complete",
    paymentStatus: "paid",
    amountTotal: 25_000,
    currency: "usd",
    ...over,
  });

  test("paid only when Stripe says paid for exactly the order total", () => {
    assert.equal(decidePayment(session({}), order), "paid");
  });

  test("a paid session for a different amount or currency is a mismatch, not paid", () => {
    assert.equal(decidePayment(session({ amountTotal: 1 }), order), "mismatch");
    assert.equal(decidePayment(session({ amountTotal: null }), order), "mismatch");
    assert.equal(decidePayment(session({ currency: "eur" }), order), "mismatch");
  });

  test("complete but unpaid is a delayed payment still settling", () => {
    assert.equal(decidePayment(session({ paymentStatus: "unpaid" }), order), "processing");
  });

  test("open or expired unpaid sessions change nothing", () => {
    assert.equal(decidePayment(session({ status: "open", paymentStatus: "unpaid" }), order), "none");
    assert.equal(decidePayment(session({ status: "expired", paymentStatus: "unpaid" }), order), "none");
    assert.equal(decidePayment(session({ paymentStatus: "no_payment_required" }), order), "none");
  });
});

describe("order transitions", () => {
  test("terminal statuses never move", () => {
    for (const status of ["paid", "expired", "failed", "canceled"] as OrderStatus[]) {
      assert.deepEqual(TRANSITIONS[status], [], status);
    }
  });

  test("conditional updates only match the allowed source statuses", () => {
    assert.deepEqual(sourcesOf("paid"), ["pending", "processing"]);
    assert.deepEqual(sourcesOf("processing"), ["pending"]);
    assert.deepEqual(sourcesOf("failed"), ["pending", "processing"]);
    // A delayed payment in flight keeps its reservation until it settles.
    assert.deepEqual(sourcesOf("expired"), ["pending"]);
    assert.deepEqual(sourcesOf("canceled"), ["pending"]);
  });
});
