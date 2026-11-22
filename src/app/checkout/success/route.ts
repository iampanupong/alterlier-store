// Stripe's success_url. Arriving here confirms nothing and changes no order: payment
// state is written only by the signature-verified webhook (/api/stripe/webhook). This
// handler just checks the session belongs to the signed-in customer, empties the bag
// once Stripe reports the session complete, and shows the confirmation page, which reads its
// status from the database. A route handler (not a page) so it can clear the cookie.

import { notFound, redirect } from "next/navigation";
import { NextResponse, type NextRequest } from "next/server";
import { CART_COOKIE } from "@/lib/cart";
import { orderForSession } from "@/lib/orders";
import { getSession, signInHref } from "@/lib/session";
import { getStripe } from "@/lib/stripe";

const SESSION_ID = /^cs_(test|live)_[A-Za-z0-9]+$/;

export async function GET(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const auth = await getSession();
  if (!auth) redirect(signInHref(pathname + search));

  // From the browser, so only used as a lookup key into Stripe.
  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (!sessionId || !SESSION_ID.test(sessionId)) notFound();

  let session;
  try {
    session = await getStripe().checkout.sessions.retrieve(sessionId);
  } catch (error) {
    // Stripe unreachable or an unknown id. Don't show a paying customer a 404: their
    // orders page shows the status the webhook records.
    console.error(`[checkout] could not retrieve session ${sessionId}`, error);
    redirect("/account/orders");
  }

  const order = await orderForSession(session);
  // Not one of ours, or someone else's order.
  if (!order || order.userId !== auth.user.id) notFound();

  const response = NextResponse.redirect(new URL(`/checkout/confirmation/${order.id}`, request.url));
  // The shopper finished Checkout, so the bag is done with. Whether the payment
  // succeeded is still up to the webhook.
  if (session.status === "complete") response.cookies.delete(CART_COOKIE);
  return response;
}
