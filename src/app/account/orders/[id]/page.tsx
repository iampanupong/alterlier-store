import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DetailList, DetailListFallback } from "@/components/account/detail-list";
import { AddressLines, OrderItems, orderDate, orderNumber, OrderTotals } from "@/components/order/order-parts";
import { PaymentSteps } from "@/components/order/payment-steps";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/order-model";
import { getUserOrder } from "@/lib/orders";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Order",
  robots: { index: false, follow: false },
};

// A private, per-customer page with an id only known at request time: render it on
// request instead of prerendering a shell (the shared header and account nav read
// usePathname, which can't resolve for an unknown param).
export const instant = false;

export default function OrderPage({ params }: PageProps<"/account/orders/[id]">) {
  return (
    <Suspense fallback={<DetailListFallback rows={4} />}>
      <OrderDetail params={params} />
    </Suspense>
  );
}

// Status is read from the database only; the Stripe webhook is what changes it.
// The post-checkout view lives at /checkout/confirmation/[id].
async function OrderDetail({ params }: Pick<PageProps<"/account/orders/[id]">, "params">) {
  const { id } = await params;
  const user = await requireUser(`/account/orders/${id}`);
  const order = await getUserOrder(user.id, id);
  if (!order) notFound();

  return (
    <>
      <p className="eyebrow text-muted">Order {orderNumber(order.id)}</p>
      <h1 className="mt-3 text-display">{ORDER_STATUS_LABEL[order.status]}</h1>
      <p className="mt-3 text-body text-muted">{statusMessage(order.status)}</p>

      <div className="mt-10">
        <PaymentSteps status={order.status} />
      </div>

      <section aria-labelledby="order-items" className="mt-12">
        <h2 id="order-items" className="eyebrow mb-4">
          Items
        </h2>
        <OrderItems items={order.items} />
        <div className="mt-6">
          <OrderTotals order={order} />
        </div>
      </section>

      <section aria-labelledby="order-details" className="mt-12">
        <h2 id="order-details" className="eyebrow mb-4">
          Details
        </h2>
        <DetailList
          items={[
            { term: "Placed", value: orderDate.format(order.createdAt) },
            ...(order.email ? [{ term: "Email", value: order.email }] : []),
            ...(order.shippingAddress
              ? [{ term: "Ship to", value: <AddressLines address={order.shippingAddress} /> }]
              : []),
          ]}
        />
      </section>

      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
        {/* An expired or canceled checkout left the bag intact; a failed payment emptied it. */}
        {order.status === "expired" || order.status === "canceled" ? (
          <Link href="/cart" className="btn btn-primary">
            Go to your bag
          </Link>
        ) : (
          <Link href="/new-arrivals" className="btn btn-secondary">
            Continue shopping
          </Link>
        )}
        <Link href="/account/orders" className="link text-caption">
          All orders
        </Link>
      </div>
    </>
  );
}

function statusMessage(status: OrderStatus) {
  switch (status) {
    case "paid":
      return "Payment confirmed. Your order is being prepared.";
    case "processing":
      return "Your payment is being processed. We'll confirm your order once it clears.";
    case "pending":
      return "We haven't received payment confirmation for this order yet. If you just paid, it usually arrives within a few seconds.";
    case "failed":
      return "The payment didn't go through, so nothing was charged and the pieces were released. Open a piece above to add it to your bag again.";
    case "expired":
    case "canceled":
      return "This checkout wasn't completed. No payment was taken.";
  }
}
