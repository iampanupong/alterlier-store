import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { products, type Image } from "./catalog";

// Checkout tables: orders, their line-item snapshots, and the Stripe webhook ledger.
// Orders are created server-side (stock reserved) before the Stripe Checkout Session
// exists; only a server-verified Stripe object may move them to paid.

/**
 * Order lifecycle (payment state is the order state):
 * - pending:    stock reserved, awaiting payment in Stripe Checkout
 * - processing: session completed, delayed payment method not yet settled (stock still reserved)
 * - paid:       payment confirmed by Stripe (terminal)
 * - expired:    Checkout Session expired / abandoned (terminal, stock restored)
 * - failed:     delayed payment failed (terminal, stock restored)
 * - canceled:   session never created or cancelled by us (terminal, stock restored)
 */
export const orderStatus = pgEnum("order_status", [
  "pending",
  "processing",
  "paid",
  "expired",
  "failed",
  "canceled",
]);

export type OrderStatus = (typeof orderStatus.enumValues)[number];

/** Shipping address as collected by Stripe Checkout. */
export type ShippingAddress = {
  name: string;
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  postalCode: string;
  /** ISO 3166-1 alpha-2. */
  country: string;
};

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Checkout requires sign-in, so every order belongs to a customer. */
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    status: orderStatus("status").notNull().default("pending"),
    /** Lowercase ISO 4217, as Stripe reports it. */
    currency: text("currency").notNull().default("usd"),
    subtotalCents: integer("subtotal_cents").notNull(),
    /** What Stripe must charge; compared against the session's `amount_total`. */
    totalCents: integer("total_cents").notNull(),
    /** Set once the Checkout Session is created (cs_…). */
    stripeCheckoutSessionId: text("stripe_checkout_session_id").unique(),
    /** Set from the verified session when the order is paid (pi_…). */
    stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
    /** Receipt email and shipping address, copied from the verified session. */
    email: text("email"),
    shippingAddress: jsonb("shipping_address").$type<ShippingAddress>(),
    /** When the stock reservation lapses (mirrors the session's `expires_at`). */
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    /** Set in the same statement that restores stock, so it can only happen once. */
    stockReleasedAt: timestamp("stock_released_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("orders_user_id_idx").on(t.userId),
    // Finds stale pending orders for the expiry sweep.
    index("orders_status_expires_at_idx").on(t.status, t.expiresAt),
    check("orders_subtotal_cents_check", sql`${t.subtotalCents} >= 0`),
    check("orders_total_cents_check", sql`${t.totalCents} >= 0`),
    check("orders_currency_check", sql`${t.currency} ~ '^[a-z]{3}$'`),
    // A paid order always has a confirmed Stripe payment behind it.
    check(
      "orders_paid_check",
      sql`${t.status} <> 'paid' OR (${t.paidAt} IS NOT NULL AND ${t.stripeCheckoutSessionId} IS NOT NULL AND ${t.stripePaymentIntentId} IS NOT NULL)`,
    ),
    // Terminal non-paid orders must have given their stock back.
    check(
      "orders_released_check",
      sql`${t.status} NOT IN ('expired', 'failed', 'canceled') OR ${t.stockReleasedAt} IS NOT NULL`,
    ),
  ],
);

/** Immutable snapshot of what was bought, at the price charged. */
export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "restrict" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    productName: text("product_name").notNull(),
    sku: text("sku").notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
    quantity: integer("quantity").notNull(),
    image: jsonb("image").$type<Image>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Also serves as the order_id FK index (leading column).
    unique("order_items_order_id_product_id_key").on(t.orderId, t.productId),
    index("order_items_product_id_idx").on(t.productId),
    check("order_items_unit_price_cents_check", sql`${t.unitPriceCents} >= 0`),
    check("order_items_quantity_check", sql`${t.quantity} BETWEEN 1 AND 99`),
  ],
);

/**
 * Stripe webhook ledger. A row is inserted when an event arrives and `processed_at`
 * is set after its handler succeeds, so redelivered events are skipped while failed
 * ones are retried. Handlers stay idempotent regardless.
 */
export const stripeEvents = pgTable("stripe_events", {
  /** Stripe event id (evt_…). */
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
});

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(user, { fields: [orders.userId], references: [user.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));
