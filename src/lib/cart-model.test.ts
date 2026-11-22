import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  applyChange,
  MAX_LINE_QUANTITY,
  MAX_LINES,
  parseCart,
  parseQuantity,
  reconcile,
  serializeCart,
  subtotalCents,
  type StockInfo,
} from "./cart-model";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const C = "33333333-3333-4333-8333-333333333333";

const stock = (entries: [string, number, number][]) =>
  new Map<string, StockInfo>(entries.map(([id, stockQuantity, priceCents]) => [id, { stockQuantity, priceCents }]));

describe("parseCart", () => {
  test("round-trips serialised lines", () => {
    const lines = [{ id: A, q: 2 }, { id: B, q: 1 }];
    assert.deepEqual(parseCart(serializeCart(lines)), lines);
  });

  test("empty or malformed cookies give an empty cart", () => {
    for (const raw of [undefined, "", "not json", "{}", "null", '"x"', "42"]) {
      assert.deepEqual(parseCart(raw), [], String(raw));
    }
  });

  test("drops bad ids, bad quantities and duplicates", () => {
    const raw = JSON.stringify([
      { id: A, q: 2 },
      { id: "nope", q: 1 },
      { id: B, q: 0 },
      { id: B, q: -3 },
      { id: B, q: 1.5 },
      { id: B, q: "2" },
      { id: C, q: 1000 },
      { id: A.toUpperCase(), q: 5 },
      null,
      "x",
      { id: C, q: 3, price: 1 },
    ]);
    // The string "2" is accepted (form-style), the extra `price` field is ignored.
    assert.deepEqual(parseCart(raw), [
      { id: A, q: 2 },
      { id: B, q: 2 },
      { id: C, q: 3 },
    ]);
  });

  test("caps the number of lines", () => {
    const many = Array.from({ length: MAX_LINES + 10 }, (_, i) => ({
      id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
      q: 1,
    }));
    assert.equal(parseCart(JSON.stringify(many)).length, MAX_LINES);
  });
});

describe("parseQuantity", () => {
  test("accepts integers in range", () => {
    assert.equal(parseQuantity("0"), 0);
    assert.equal(parseQuantity("7"), 7);
    assert.equal(parseQuantity(MAX_LINE_QUANTITY), MAX_LINE_QUANTITY);
  });
  test("rejects everything else", () => {
    for (const v of ["", " ", "-1", "1.5", "abc", "1e3", String(MAX_LINE_QUANTITY + 1), null, undefined, NaN]) {
      assert.equal(parseQuantity(v), null, String(v));
    }
  });
});

describe("reconcile + subtotal", () => {
  test("uses live prices and computes the subtotal in cents", () => {
    const lines = reconcile([{ id: A, q: 2 }, { id: B, q: 1 }], stock([[A, 10, 129_500], [B, 5, 19_950]]));
    assert.deepEqual(lines.map((l) => l.lineTotalCents), [259_000, 19_950]);
    assert.equal(subtotalCents(lines), 278_950);
    assert.ok(lines.every((l) => l.issue === null));
  });

  test("clamps to stock and flags the line", () => {
    const [line] = reconcile([{ id: A, q: 5 }], stock([[A, 2, 1000]]));
    assert.equal(line.quantity, 2);
    assert.equal(line.requested, 5);
    assert.equal(line.issue, "reduced");
    assert.equal(line.lineTotalCents, 2000);
  });

  test("sold-out lines stay visible but don't count", () => {
    const lines = reconcile([{ id: A, q: 1 }, { id: B, q: 1 }], stock([[A, 0, 5000], [B, 3, 1000]]));
    assert.equal(lines[0].issue, "sold_out");
    assert.equal(lines[0].quantity, 0);
    assert.equal(subtotalCents(lines), 1000);
  });

  test("deleted products are dropped", () => {
    assert.deepEqual(reconcile([{ id: A, q: 1 }], stock([])), []);
  });
});

describe("applyChange", () => {
  const products = stock([[A, 3, 1000], [B, 0, 2000], [C, 10, 500]]);

  test("adds a new line and increments an existing one", () => {
    let r = applyChange([], { type: "add", id: A, quantity: 1 }, products);
    assert.deepEqual(r.lines, [{ id: A, q: 1 }]);
    r = applyChange(r.lines, { type: "add", id: A, quantity: 1 }, products);
    assert.deepEqual(r.lines, [{ id: A, q: 2 }]);
    assert.equal(r.limited, false);
  });

  test("adding past stock stops at stock and reports it", () => {
    const r = applyChange([{ id: A, q: 3 }], { type: "add", id: A, quantity: 1 }, products);
    assert.deepEqual(r.lines, [{ id: A, q: 3 }]);
    assert.equal(r.limited, true);
  });

  test("setting a quantity is clamped to stock", () => {
    const r = applyChange([{ id: A, q: 1 }], { type: "set", id: A, quantity: 99 }, products);
    assert.equal(r.quantity, 3);
    assert.equal(r.limited, true);
  });

  test("sold-out or unknown products can't be added", () => {
    for (const id of [B, "44444444-4444-4444-8444-444444444444"]) {
      const r = applyChange([], { type: "add", id, quantity: 1 }, products);
      assert.deepEqual(r.lines, []);
      assert.equal(r.unavailable, true);
    }
  });

  test("remove drops the line and keeps the others in order", () => {
    const r = applyChange([{ id: C, q: 2 }, { id: A, q: 1 }], { type: "remove", id: C }, products);
    assert.deepEqual(r.lines, [{ id: A, q: 1 }]);
    assert.equal(r.quantity, 0);
  });

  test("any write also normalises stale lines", () => {
    // A was stored at 5 but only 3 are left; B is sold out.
    const r = applyChange([{ id: A, q: 5 }, { id: B, q: 1 }], { type: "add", id: C, quantity: 1 }, products);
    assert.deepEqual(r.lines, [{ id: A, q: 3 }, { id: C, q: 1 }]);
  });

  test("a full cart refuses new products but still updates existing ones", () => {
    const ids = Array.from({ length: MAX_LINES }, (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`);
    const full = new Map<string, StockInfo>([...products, ...ids.map((id) => [id, { stockQuantity: 5, priceCents: 1 }] as const)]);
    const lines = ids.map((id) => ({ id, q: 1 }));
    const r = applyChange(lines, { type: "add", id: A, quantity: 1 }, full);
    assert.equal(r.full, true);
    assert.equal(r.lines.length, MAX_LINES);
    const r2 = applyChange(lines, { type: "set", id: ids[0], quantity: 4 }, full);
    assert.equal(r2.full, false);
    assert.equal(r2.lines[0].q, 4);
  });
});
