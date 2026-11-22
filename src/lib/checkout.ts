// Ending Checkout Sessions early. Kept apart from orders.ts because it calls Stripe.

import type Stripe from "stripe";
import { openCheckoutsForUser, releaseOrder } from "@/lib/orders";

/**
 * Expires an open Checkout Session and gives the order's stock back. Stock is released
 * only once Stripe confirms the session is expired. If Stripe refuses because the
 * session already completed (the shopper paid in another tab), the order is left
 * alone: its webhook marks it paid or processing.
 * Returns whether stock was released.
 */
export async function endCheckout(
  stripe: Stripe,
  order: { id: string; stripeCheckoutSessionId: string | null },
  to: "expired" | "canceled",
): Promise<boolean> {
  if (!order.stripeCheckoutSessionId) return releaseOrder(order.id, "canceled");

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.expire(order.stripeCheckoutSessionId);
  } catch {
    session = await stripe.checkout.sessions.retrieve(order.stripeCheckoutSessionId);
  }

  if (session.status === "expired") return releaseOrder(order.id, to);
  return false;
}

/** Ends every checkout the customer left open. Returns whether any stock was released. */
export async function expireOpenCheckouts(stripe: Stripe, userId: string): Promise<boolean> {
  const open = await openCheckoutsForUser(userId);
  const results = await Promise.all(open.map((order) => endCheckout(stripe, order, "canceled")));
  return results.some(Boolean);
}
