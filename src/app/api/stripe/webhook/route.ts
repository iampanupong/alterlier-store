// Stripe webhook: the only writer of order payment state.
//
// - Authenticity: the `stripe-signature` header is verified against the raw body
//   before anything is read from it. Unsigned or tampered requests get 400.
// - Duplicates: `stripe_events` records each event id; one already processed is
//   acknowledged and skipped. Every handler is also a conditional transition, so a
//   concurrent redelivery or an out-of-order event can't move an order backwards.
// - Failures: a throwing handler returns 500 and leaves the event unprocessed, so
//   Stripe's retry runs it again.
//
// Subscribe the endpoint to exactly the events the checkout flow needs:
//   checkout.session.completed               paid, or processing for delayed methods
//   checkout.session.async_payment_succeeded delayed method settled: paid
//   checkout.session.async_payment_failed    delayed method failed: release stock
//   checkout.session.expired                 abandoned: release stock

import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import type Stripe from "stripe";
import { CATALOG_TAG } from "@/lib/catalog";
import { applyCheckoutSession, beginEvent, finishEvent, orderForSession, releaseOrder } from "@/lib/orders";
import { getStripe } from "@/lib/stripe";

const HANDLED = new Set<Stripe.Event.Type>([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "checkout.session.expired",
]);

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe] STRIPE_WEBHOOK_SECRET is not set");
    return new Response("Webhook not configured", { status: 500 });
  }

  // The signature covers the exact raw bytes, so read the body as text, unparsed.
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  let event: Stripe.Event;
  try {
    if (!signature) throw new Error("missing stripe-signature header");
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch (error) {
    console.warn("[stripe] rejected webhook:", (error as Error).message);
    return new Response("Invalid signature", { status: 400 });
  }

  // Anything else the endpoint is subscribed to is acknowledged and not stored.
  if (!HANDLED.has(event.type)) return Response.json({ received: true, ignored: true });

  if (!(await beginEvent(event.id, event.type))) {
    return Response.json({ received: true, duplicate: true });
  }

  try {
    await handle(event);
  } catch (error) {
    console.error(`[stripe] failed to handle ${event.type} ${event.id}`, error);
    return new Response("Handler failed", { status: 500 });
  }

  await finishEvent(event.id);
  return Response.json({ received: true });
}

async function handle(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      // Paid only if Stripe says paid for exactly the order's total (see decidePayment).
      await applyCheckoutSession(event.data.object);
      return;
    case "checkout.session.async_payment_failed":
      await release(event.data.object, "failed");
      return;
    case "checkout.session.expired":
      await release(event.data.object, "expired");
      return;
  }
}

async function release(session: Stripe.Checkout.Session, to: "failed" | "expired") {
  const order = await orderForSession(session);
  if (order && (await releaseOrder(order.id, to))) revalidateTag(CATALOG_TAG, "max");
}
