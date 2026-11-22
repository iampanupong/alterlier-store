"use server";

// Starts Stripe Checkout. The request carries nothing but the shopper's cart cookie and
// session: prices, names and stock are read from PostgreSQL here, stock is reserved
// atomically with the order, and the Checkout Session is built from that order.

import { randomUUID } from "node:crypto";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { CATALOG_TAG, getLiveProducts } from "@/lib/catalog";
import { readStoredCart, writeStoredCart } from "@/lib/cart";
import { reconcile, toStored } from "@/lib/cart-model";
import {
  buildOrderDraft,
  CHECKOUT_TTL_MS,
  ORDER_CURRENCY,
  SHIPPING_COUNTRIES,
} from "@/lib/order-model";
import { attachCheckoutSession, createPendingOrder, releaseOrder } from "@/lib/orders";
import { expireOpenCheckouts } from "@/lib/checkout";
import { withinLimits } from "@/lib/rate-limit";
import { requireUser } from "@/lib/session";
import { appUrl, getStripe } from "@/lib/stripe";

export type CheckoutState = { error?: string; at?: number };

const CHECKOUT_PER_USER = { max: 10, windowSeconds: 10 * 60 };

/** Tags these sessions in the Stripe Dashboard. */
const INTEGRATION_ID = "storefront-checkout-hqvzmtkw";

function fail(error: string): CheckoutState {
  return { error, at: Date.now() };
}

export async function startCheckoutAction(): Promise<CheckoutState> {
  const user = await requireUser("/cart");

  if (!(await withinLimits([[`checkout:user:${user.id}`, CHECKOUT_PER_USER]]))) {
    return fail("Too many checkout attempts. Please wait a few minutes and try again.");
  }

  // A previous checkout the shopper backed out of (browser back) still holds stock.
  // Give it back first so it can't block this one. Best effort: if Stripe can't be
  // reached that session expires on its own, and the reservation below still guards stock.
  try {
    if (await expireOpenCheckouts(getStripe(), user.id)) updateTag(CATALOG_TAG);
  } catch (error) {
    console.error(`[checkout] could not end open checkouts for user ${user.id}`, error);
  }

  // Revalidate the bag against live prices and stock.
  const stored = await readStoredCart();
  const live = await getLiveProducts(stored.map((line) => line.id));
  const reconciled = reconcile(stored, live);
  const draft = buildOrderDraft(reconciled, live);

  if (!draft.ok) {
    // Writing the corrected cart re-renders the page with the changes highlighted.
    await writeStoredCart(toStored(reconciled));
    return fail(
      draft.reason === "empty"
        ? "Your bag is empty."
        : "Some pieces changed since you added them. Please review your bag and try again.",
    );
  }

  const orderId = randomUUID();
  const expiresAt = new Date(Date.now() + CHECKOUT_TTL_MS);
  const reserved = await createPendingOrder({
    id: orderId,
    userId: user.id,
    draft,
    currency: ORDER_CURRENCY,
    expiresAt,
  });
  if (reserved === "out_of_stock") {
    // Someone else got there first. Re-read so the bag shows what's left.
    const fresh = await getLiveProducts(stored.map((line) => line.id));
    await writeStoredCart(toStored(reconcile(stored, fresh)));
    return fail("Some pieces just sold out. Please review your bag and try again.");
  }
  updateTag(CATALOG_TAG);

  let checkoutUrl: string;
  try {
    const session = await getStripe().checkout.sessions.create(
      {
        mode: "payment",
        line_items: draft.lines.map((line) => ({
          quantity: line.quantity,
          price_data: {
            currency: ORDER_CURRENCY,
            unit_amount: line.unitPriceCents,
            product_data: {
              name: line.productName,
              images: line.image.src.startsWith("https://") ? [line.image.src] : undefined,
              metadata: { product_id: line.productId, sku: line.sku },
            },
          },
        })),
        customer_email: user.email,
        client_reference_id: orderId,
        metadata: { order_id: orderId },
        payment_intent_data: { metadata: { order_id: orderId } },
        shipping_address_collection: { allowed_countries: [...SHIPPING_COUNTRIES] },
        shipping_options: [
          {
            shipping_rate_data: {
              type: "fixed_amount",
              display_name: "Complimentary shipping",
              fixed_amount: { amount: 0, currency: ORDER_CURRENCY },
            },
          },
        ],
        expires_at: Math.floor(expiresAt.getTime() / 1000),
        success_url: `${appUrl("/checkout/success")}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl("/checkout/cancel")}?order=${orderId}`,
        integration_identifier: INTEGRATION_ID,
      },
      { idempotencyKey: `checkout-${orderId}` },
    );
    if (!session.url) throw new Error("Checkout Session has no URL");
    await attachCheckoutSession(orderId, session.id);
    checkoutUrl = session.url;
  } catch (error) {
    console.error(`[checkout] could not start checkout for order ${orderId}`, error);
    // shortcut: if Stripe created the session but attach failed, that session stays
    // open until it expires; it can't be paid into a paid order (no session id match).
    if (await releaseOrder(orderId, "canceled")) updateTag(CATALOG_TAG);
    return fail("We couldn't start checkout. Please try again.");
  }

  redirect(checkoutUrl);
}
