// Order reads and writes. The only place the app touches the orders tables.
// neon-http has no interactive transactions, so every write is either a db.batch
// (one non-interactive transaction) or a single statement with a conditional WHERE,
// which makes each one safe to retry and safe against concurrent webhooks.
// No next/cache imports: callers revalidate CATALOG_TAG when stock changes, so the
// sweep script can use this module outside Next.

import { and, desc, eq, inArray, isNotNull, lt, sql } from "drizzle-orm";
import type Stripe from "stripe";
import { db } from "@/db";
import { orderItems, orders, stripeEvents, type OrderStatus as DbOrderStatus, type ShippingAddress } from "@/db/orders";
import { products } from "@/db/catalog";
import { CHECK_VIOLATION, FK_VIOLATION, pgCode } from "@/lib/pg-errors";
import {
  decidePayment,
  isUuid,
  sourcesOf,
  type OrderDraft,
  type OrderStatus,
} from "@/lib/order-model";

// The pure model and the pgEnum must list the same statuses.
const _sameStatuses: [OrderStatus, DbOrderStatus] extends [DbOrderStatus, OrderStatus] ? true : never = true;
void _sameStatuses;

export type Order = typeof orders.$inferSelect;
export type OrderWithItems = Order & {
  items: (typeof orderItems.$inferSelect & { product: { slug: string } })[];
};

/** Line snapshots plus the product slug, so order pages can link back to the piece. */
const withItems = { items: { with: { product: { columns: { slug: true } } } } } as const;

/**
 * Inserts the order and its line snapshots and reserves stock, all or nothing. The
 * decrement is one UPDATE over every line; `products_stock_quantity_check (>= 0)`
 * aborts the whole batch if any line would oversell, and row locks serialise
 * concurrent checkouts for the same product.
 */
export async function createPendingOrder(input: {
  id: string;
  userId: string;
  draft: Extract<OrderDraft, { ok: true }>;
  currency: string;
  expiresAt: Date;
}): Promise<"ok" | "out_of_stock"> {
  const { id, userId, draft, currency, expiresAt } = input;
  const requested = sql.join(
    draft.lines.map((l) => sql`(${l.productId}::uuid, ${l.quantity}::int)`),
    sql`, `,
  );

  try {
    await db.batch([
      db.insert(orders).values({
        id,
        userId,
        currency,
        subtotalCents: draft.subtotalCents,
        totalCents: draft.totalCents,
        expiresAt,
      }),
      db.insert(orderItems).values(draft.lines.map((line) => ({ orderId: id, ...line }))),
      db.execute(sql`
        UPDATE ${products} p
        SET stock_quantity = p.stock_quantity - r.q, updated_at = now()
        FROM (VALUES ${requested}) AS r(id, q)
        WHERE p.id = r.id`),
    ]);
    return "ok";
  } catch (error) {
    const code = pgCode(error);
    // Not enough stock, or a product was deleted since the cart was read.
    if (code === CHECK_VIOLATION || code === FK_VIOLATION) return "out_of_stock";
    throw error;
  }
}

export async function attachCheckoutSession(orderId: string, sessionId: string) {
  await db
    .update(orders)
    .set({ stripeCheckoutSessionId: sessionId })
    .where(and(eq(orders.id, orderId), eq(orders.status, "pending")));
}

/**
 * Moves an order to a terminal non-paid status and gives its stock back, in one
 * statement, so the two can't come apart. Only orders in a status that may reach `to`
 * and that haven't released yet match, so repeats and races are no-ops.
 * Returns whether this call released anything (callers then revalidate the catalogue).
 */
export async function releaseOrder(
  orderId: string,
  to: Extract<OrderStatus, "expired" | "failed" | "canceled">,
): Promise<boolean> {
  const from = sql.join(sourcesOf(to).map((s) => sql`${s}`), sql`, `);
  const result = await db.execute(sql`
    WITH o AS (
      UPDATE ${orders} SET status = ${to}, stock_released_at = now(), updated_at = now()
      WHERE id = ${orderId} AND status IN (${from}) AND stock_released_at IS NULL
      RETURNING id
    )
    UPDATE ${products} p
    SET stock_quantity = p.stock_quantity + oi.quantity, updated_at = now()
    FROM ${orderItems} oi JOIN o ON oi.order_id = o.id
    WHERE p.id = oi.product_id`);
  return (result.rowCount ?? 0) > 0;
}

/** The order a Checkout Session belongs to, or null if it isn't one of ours. */
export async function orderForSession(session: Stripe.Checkout.Session): Promise<Order | null> {
  const orderId = session.metadata?.order_id;
  if (!isUuid(orderId)) return null;
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order || order.stripeCheckoutSessionId !== session.id) return null;
  return order;
}

function shippingFrom(session: Stripe.Checkout.Session): ShippingAddress | null {
  const details = session.collected_information?.shipping_details;
  if (!details) return null;
  const a = details.address;
  return {
    name: details.name,
    line1: a.line1 ?? "",
    line2: a.line2,
    city: a.city ?? "",
    state: a.state,
    postalCode: a.postal_code ?? "",
    country: a.country ?? "",
  };
}

export type ApplyResult = { order: Order | null; outcome: ReturnType<typeof decidePayment> };

/**
 * Applies the Checkout Session from a signature-verified webhook event
 * (`checkout.session.completed` / `async_payment_succeeded`). This is the only path to
 * `paid` or `processing`: call it from the webhook alone, never from a redirect or
 * anything the browser sent. Idempotent: the conditional updates only move an order
 * forward, so redeliveries and out-of-order events are no-ops.
 */
export async function applyCheckoutSession(session: Stripe.Checkout.Session): Promise<ApplyResult> {
  const order = await orderForSession(session);
  if (!order) return { order: null, outcome: "none" };

  const outcome = decidePayment(
    {
      status: session.status,
      paymentStatus: session.payment_status,
      amountTotal: session.amount_total,
      currency: session.currency,
    },
    order,
  );
  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  const contact = { email: session.customer_details?.email ?? null, shippingAddress: shippingFrom(session) };

  if (outcome === "paid" && paymentIntentId) {
    const [updated] = await db
      .update(orders)
      .set({ status: "paid", paidAt: new Date(), stripePaymentIntentId: paymentIntentId, ...contact })
      .where(and(eq(orders.id, order.id), inArray(orders.status, sourcesOf("paid"))))
      .returning();
    if (!updated && order.status !== "paid") {
      // Paid at Stripe but the order already gave its stock back. Needs a human (refund or re-reserve).
      console.error(`[orders] order ${order.id} is ${order.status} but session ${session.id} is paid`);
    }
    return { order: updated ?? order, outcome };
  }

  if (outcome === "mismatch") {
    console.error(
      `[orders] amount mismatch on order ${order.id}: charged ${session.amount_total} ${session.currency}, expected ${order.totalCents} ${order.currency}`,
    );
    return { order, outcome };
  }

  if (outcome === "processing") {
    const [updated] = await db
      .update(orders)
      .set({ status: "processing", ...contact })
      .where(and(eq(orders.id, order.id), inArray(orders.status, sourcesOf("processing"))))
      .returning();
    return { order: updated ?? order, outcome };
  }

  return { order, outcome };
}

/** The customer's pending orders that have a Checkout Session to expire. */
export async function openCheckoutsForUser(userId: string) {
  return db.query.orders.findMany({
    columns: { id: true, stripeCheckoutSessionId: true },
    where: and(eq(orders.userId, userId), eq(orders.status, "pending"), isNotNull(orders.stripeCheckoutSessionId)),
  });
}

/** Pending orders whose reservation lapsed before `cutoff` (missed-webhook safety net). */
export async function stalePendingOrders(cutoff: Date) {
  return db.query.orders.findMany({
    columns: { id: true, stripeCheckoutSessionId: true },
    where: and(eq(orders.status, "pending"), lt(orders.expiresAt, cutoff)),
  });
}

export async function getUserOrders(userId: string): Promise<OrderWithItems[]> {
  return db.query.orders.findMany({
    where: eq(orders.userId, userId),
    with: withItems,
    orderBy: desc(orders.createdAt),
  });
}

/** One of the customer's orders, or undefined (also for someone else's order). */
export async function getUserOrder(userId: string, orderId: string): Promise<OrderWithItems | undefined> {
  if (!isUuid(orderId)) return undefined;
  return db.query.orders.findFirst({
    where: and(eq(orders.id, orderId), eq(orders.userId, userId)),
    with: withItems,
  });
}

// ---- Webhook ledger ----------------------------------------------------------------

/** Records an event. Returns false if it was already processed (a redelivery). */
export async function beginEvent(id: string, type: string): Promise<boolean> {
  await db.insert(stripeEvents).values({ id, type }).onConflictDoNothing();
  const row = await db.query.stripeEvents.findFirst({ where: eq(stripeEvents.id, id) });
  return !row?.processedAt;
}

export async function finishEvent(id: string) {
  await db.update(stripeEvents).set({ processedAt: new Date() }).where(eq(stripeEvents.id, id));
}
