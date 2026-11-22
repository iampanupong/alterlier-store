// Safety net for missed expiry webhooks. Finds pending orders whose checkout window
// closed more than GRACE ago and asks Stripe what happened to each session: expired
// ones release their stock and any still open are expired. Completed sessions are only
// reported, because payment state comes from webhook events alone; Stripe keeps retrying
// those for days, or resend one with `stripe events resend <evt_id>`.
// Safe to re-run; every write is a conditional transition.
// Run with `pnpm orders:sweep` (by hand or from a cron job).
// Product pages are cached for hours, so stock released here shows on them on the next
// catalogue revalidation; the cart and checkout always read live stock.

import "dotenv/config";
import Stripe from "stripe";
import { endCheckout } from "@/lib/checkout";
import { releaseOrder, stalePendingOrders } from "@/lib/orders";

const GRACE_MS = 15 * 60 * 1000;

async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  const stripe = new Stripe(key, { apiVersion: "2026-11-18.endive" });

  const stale = await stalePendingOrders(new Date(Date.now() - GRACE_MS));
  console.log(`${stale.length} stale pending order(s)`);

  for (const order of stale) {
    let result: string;
    if (!order.stripeCheckoutSessionId) {
      result = (await releaseOrder(order.id, "canceled")) ? "canceled, stock released" : "unchanged";
    } else {
      const session = await stripe.checkout.sessions.retrieve(order.stripeCheckoutSessionId);
      if (session.status === "complete") {
        result = `complete at Stripe (${session.payment_status}); waiting for its webhook`;
      } else if (session.status === "expired") {
        result = (await releaseOrder(order.id, "expired")) ? "expired, stock released" : "unchanged";
      } else {
        result = (await endCheckout(stripe, order, "expired")) ? "expired now, stock released" : "unchanged";
      }
    }
    console.log(`  ${order.id}: ${result}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
