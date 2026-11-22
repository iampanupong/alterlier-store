// Stripe's cancel_url: the shopper chose "back" on the Checkout page. End their
// session now so the reserved stock comes back immediately instead of after expiry,
// then return them to their bag, which is untouched.

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { CATALOG_TAG } from "@/lib/catalog";
import { endCheckout } from "@/lib/checkout";
import { getUserOrder } from "@/lib/orders";
import { getSession, signInHref } from "@/lib/session";
import { getStripe } from "@/lib/stripe";

export async function GET(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const auth = await getSession();
  if (!auth) redirect(signInHref(pathname + search));

  const orderId = request.nextUrl.searchParams.get("order") ?? "";
  // Scoped to the signed-in customer, so nobody can cancel someone else's checkout.
  const order = await getUserOrder(auth.user.id, orderId);

  if (order?.status === "pending") {
    try {
      if (await endCheckout(getStripe(), order, "canceled")) revalidateTag(CATALOG_TAG, "max");
    } catch (error) {
      // The session still expires on its own and the webhook releases the stock.
      console.error(`[checkout] could not cancel order ${order.id}`, error);
    }
  }

  redirect("/cart?checkout=canceled");
}
