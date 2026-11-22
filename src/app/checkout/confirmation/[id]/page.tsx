import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DetailList } from "@/components/account/detail-list";
import { Breadcrumb } from "@/components/breadcrumb";
import {
  AddressLines,
  OrderItems,
  orderDate,
  orderNumber,
  OrderTotals,
} from "@/components/order/order-parts";
import { OrderStatusRefresh } from "@/components/order/order-status-refresh";
import { PaymentSteps } from "@/components/order/payment-steps";
import { ArrowRightIcon } from "@/components/ui/icons";
import type { OrderStatus } from "@/lib/order-model";
import { getUserOrder } from "@/lib/orders";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Order confirmation",
  robots: { index: false, follow: false },
};

// Private, per-customer, and the id is only known at request time.
export const instant = false;

export default function ConfirmationPage({ params }: PageProps<"/checkout/confirmation/[id]">) {
  return (
    <main id="main" className="pt-header">
      <div className="container-page pt-6 pb-section">
        <Breadcrumb current="Order confirmation" />
        <Suspense fallback={<ConfirmationFallback />}>
          <Confirmation params={params} />
        </Suspense>
      </div>
    </main>
  );
}

// Everything shown here comes from the order row, which only the Stripe webhook moves
// to paid. Arriving from Checkout confirms nothing: a pending order says so and this
// page re-checks the database until the webhook lands.
async function Confirmation({ params }: Pick<PageProps<"/checkout/confirmation/[id]">, "params">) {
  const { id } = await params;
  const user = await requireUser(`/checkout/confirmation/${id}`);
  const order = await getUserOrder(user.id, id);
  if (!order) notFound();

  const firstName = user.name.split(/\s+/)[0] || user.name;
  const copy = COPY[order.status](firstName);
  const confirmed = order.status === "paid";
  const unsuccessful = order.status === "failed" || order.status === "expired" || order.status === "canceled";

  return (
    <div className="mt-8 lg:mt-10 lg:grid lg:grid-cols-12 lg:items-start lg:gap-12 xl:gap-16">
      <section aria-labelledby="confirmation-title" className="lg:col-span-7">
        <h1 id="confirmation-title" className="text-heading lg:text-display">
          {copy.title}
        </h1>
        <p role="status" aria-live="polite" className="mt-4 max-w-xl text-body text-muted">
          {copy.body}
        </p>
        {order.status === "pending" && <OrderStatusRefresh />}

        <div className="mt-10">
          <PaymentSteps status={order.status} />
        </div>

        <div className="mt-12">
          <DetailList
            items={[
              { term: "Order number", value: <span className="tabular-nums">{orderNumber(order.id)}</span> },
              { term: "Placed", value: orderDate.format(order.createdAt) },
              ...(order.email ? [{ term: "Email", value: order.email }] : []),
              ...(order.shippingAddress
                ? [{ term: "Ship to", value: <AddressLines address={order.shippingAddress} /> }]
                : []),
              { term: "Delivery", value: confirmed || order.status === "processing" ? "Complimentary shipping. Ships within 1–2 business days of payment." : "Complimentary shipping" },
            ]}
          />
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
          {order.status === "expired" || order.status === "canceled" ? (
            <Link href="/cart" className="btn btn-primary">
              Return to your bag
              <ArrowRightIcon width={16} height={16} />
            </Link>
          ) : (
            <Link href="/new-arrivals" className={unsuccessful ? "btn btn-primary" : "btn btn-secondary"}>
              Continue shopping
              <ArrowRightIcon width={16} height={16} />
            </Link>
          )}
          <Link href={`/account/orders/${order.id}`} className="link text-caption">
            View in your account
          </Link>
        </div>
      </section>

      <aside
        aria-labelledby="summary-title"
        className="mt-12 bg-surface p-6 sm:p-8 lg:sticky lg:top-header lg:col-span-5 lg:mt-0"
      >
        <h2 id="summary-title" className="eyebrow">
          Order summary
        </h2>
        <div className="mt-6">
          <OrderItems items={order.items} />
        </div>
        <div className="mt-6">
          <OrderTotals order={order} />
        </div>
        <p className="mt-2 text-caption text-muted">In USD, at the prices you checked out with.</p>
      </aside>
    </div>
  );
}

const COPY: Record<OrderStatus, (firstName: string) => { title: string; body: string }> = {
  pending: () => ({
    title: "Confirming your payment",
    body: "Thank you. We’re waiting for Stripe to confirm your payment, which usually takes a few seconds. This page updates on its own, so there’s no need to pay again.",
  }),
  processing: () => ({
    title: "Payment processing",
    body: "Your payment method takes a little longer to confirm, often a few business days. Your pieces are reserved for you, and this order updates as soon as the payment clears.",
  }),
  paid: (firstName) => ({
    title: `Thank you, ${firstName}`,
    body: "Your payment is confirmed and your order is being prepared.",
  }),
  failed: () => ({
    title: "Payment didn’t go through",
    body: "Nothing was charged and the pieces were released. You can add them to your bag again from the summary.",
  }),
  expired: () => ({
    title: "Checkout not completed",
    body: "This checkout timed out before payment, so nothing was charged. Your bag is still saved.",
  }),
  canceled: () => ({
    title: "Checkout not completed",
    body: "This checkout was canceled, so nothing was charged. Your bag is still saved.",
  }),
};

function ConfirmationFallback() {
  return (
    <div aria-hidden="true" className="mt-8 lg:mt-10 lg:grid lg:grid-cols-12 lg:gap-12 xl:gap-16">
      <div className="space-y-4 lg:col-span-7">
        <div className="h-4 w-32 bg-surface" />
        <div className="h-12 w-3/4 bg-surface" />
        <div className="h-5 w-2/3 bg-surface" />
        <div className="mt-10 h-16 bg-surface" />
      </div>
      <div className="mt-12 h-80 bg-surface lg:col-span-5 lg:mt-0" />
    </div>
  );
}
