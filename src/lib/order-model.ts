// Pure checkout and order logic: no Next.js, database or Stripe imports, so it can be
// unit-tested directly. Prices always come from live product rows read on the server;
// nothing here accepts a price or a payment status from the client.

import type { ReconciledLine } from "@/lib/cart-model";

export type OrderStatus = "pending" | "processing" | "paid" | "expired" | "failed" | "canceled";

export const ORDER_CURRENCY = "usd";

/**
 * How long a Checkout Session (and its stock reservation) lives. Stripe requires 30
 * minutes to 24 hours from session creation; the margin covers the time between
 * computing this and Stripe creating the session.
 */
export const CHECKOUT_TTL_MS = 32 * 60 * 1000;

/** Where Checkout collects shipping addresses. Shipping is free to all of them. */
export const SHIPPING_COUNTRIES = [
  "US", "CA", "GB", "IE", "AU", "NZ", "JP", "SG", "CH", "NO",
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU",
  "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
] as const;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

/** Live product fields an order line snapshots. */
export type OrderProduct = { name: string; sku: string; image: { src: string; alt: string } };

export type OrderLine = {
  productId: string;
  productName: string;
  sku: string;
  unitPriceCents: number;
  quantity: number;
  image: { src: string; alt: string };
};

export type OrderDraft =
  | { ok: true; lines: OrderLine[]; subtotalCents: number; totalCents: number }
  | { ok: false; reason: "empty" | "changed" };

/**
 * Turns a reconciled cart into order lines. Refuses when anything changed since the
 * shopper last saw their bag (reduced or sold-out lines), so they never pay for a
 * different bag than the one they reviewed. Shipping is free and tax is off, so the
 * total equals the subtotal.
 */
export function buildOrderDraft(
  reconciled: ReconciledLine[],
  products: ReadonlyMap<string, OrderProduct>,
): OrderDraft {
  if (reconciled.some((line) => line.issue !== null)) return { ok: false, reason: "changed" };

  const lines: OrderLine[] = [];
  for (const line of reconciled) {
    const product = products.get(line.id);
    if (!product || line.quantity < 1) return { ok: false, reason: "changed" };
    lines.push({
      productId: line.id,
      productName: product.name,
      sku: product.sku,
      unitPriceCents: line.unitPriceCents,
      quantity: line.quantity,
      image: { src: product.image.src, alt: product.image.alt },
    });
  }
  if (lines.length === 0) return { ok: false, reason: "empty" };

  const subtotalCents = lines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0);
  return { ok: true, lines, subtotalCents, totalCents: subtotalCents };
}

/** The Checkout Session fields that decide an order's payment state. */
export type SessionPayment = {
  status: string | null;
  paymentStatus: string;
  amountTotal: number | null;
  currency: string | null;
};

export type PaymentDecision = "paid" | "processing" | "mismatch" | "none";

/**
 * What a server-retrieved (or signature-verified) Checkout Session means for the order.
 * Paid only when Stripe says `paid` AND it charged exactly the order's total in the
 * order's currency. A complete-but-unpaid session is a delayed payment method that
 * hasn't settled yet.
 */
export function decidePayment(
  session: SessionPayment,
  order: { totalCents: number; currency: string },
): PaymentDecision {
  if (session.paymentStatus === "paid") {
    const matches = session.amountTotal === order.totalCents && session.currency === order.currency;
    return matches ? "paid" : "mismatch";
  }
  if (session.status === "complete" && session.paymentStatus === "unpaid") return "processing";
  return "none";
}

/** Statuses an order may move to from each status. Terminal statuses have none. */
export const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ["processing", "paid", "expired", "failed", "canceled"],
  processing: ["paid", "failed"],
  paid: [],
  expired: [],
  failed: [],
  canceled: [],
};

/** The statuses `to` can be reached from, for conditional `WHERE status IN (…)` updates. */
export function sourcesOf(to: OrderStatus): OrderStatus[] {
  return (Object.keys(TRANSITIONS) as OrderStatus[]).filter((from) => TRANSITIONS[from].includes(to));
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Awaiting payment",
  processing: "Payment processing",
  paid: "Confirmed",
  expired: "Expired",
  failed: "Payment failed",
  canceled: "Canceled",
};
