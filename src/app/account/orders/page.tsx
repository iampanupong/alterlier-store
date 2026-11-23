import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DetailListFallback } from "@/components/account/detail-list";
import { orderDate, orderNumber, price } from "@/components/order/order-parts";
import { ArrowRightIcon } from "@/components/ui/icons";
import { ORDER_STATUS_LABEL } from "@/lib/order-model";
import { getUserOrders } from "@/lib/orders";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Orders",
  robots: { index: false, follow: false },
};

export default function OrdersPage() {
  return (
    <>
      <h1 className="text-display">Orders</h1>
      <div className="mt-12">
        <Suspense fallback={<DetailListFallback rows={3} />}>
          <OrderList />
        </Suspense>
      </div>
    </>
  );
}

async function OrderList() {
  const user = await requireUser("/account/orders");
  // Abandoned or canceled checkouts aren't orders from the customer's point of view.
  const orders = (await getUserOrders(user.id)).filter(
    (order) => order.status !== "expired" && order.status !== "canceled",
  );

  if (orders.length === 0) {
    return (
      <section className="bg-surface p-6 sm:p-8">
        <h2 className="text-title">No orders yet</h2>
        <p className="mt-2 text-body text-muted">Pieces you buy will appear here.</p>
        <Link href="/new-arrivals" className="btn btn-secondary mt-6">
          New arrivals
        </Link>
      </section>
    );
  }

  return (
    <ul className="divide-y divide-line border-y border-line">
      {orders.map((order) => {
        const count = order.items.reduce((sum, item) => sum + item.quantity, 0);
        return (
          <li key={order.id}>
            {/* One row per order: two lines on phones, a single row from `sm` up. */}
            <Link
              href={`/account/orders/${order.id}`}
              className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 py-5 sm:grid-cols-[minmax(0,1fr)_10rem_6rem_1rem] sm:gap-x-6"
            >
              <span className="min-w-0">
                <span className="block text-body font-bold group-hover:underline group-hover:underline-offset-4">
                  Order {orderNumber(order.id)}
                </span>
                <span className="mt-1 block text-caption text-muted">
                  <time dateTime={order.createdAt.toISOString()}>
                    {orderDate.format(order.createdAt)}
                  </time>{" "}
                  · {count} {count === 1 ? "item" : "items"}
                </span>
              </span>
              <span className="col-start-1 row-start-2 sm:col-start-2 sm:row-start-1">
                <span className="sr-only">Payment status: </span>
                <span className={`eyebrow ${order.status === "paid" ? "text-ink" : "text-muted"}`}>
                  {ORDER_STATUS_LABEL[order.status]}
                </span>
              </span>
              <span className="col-start-2 row-start-1 text-right text-body font-bold tabular-nums sm:col-start-3">
                <span className="sr-only">Total: </span>
                {price(order.totalCents)}
              </span>
              <ArrowRightIcon
                width={16}
                height={16}
                className="col-start-2 row-start-2 justify-self-end text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-ink sm:col-start-4 sm:row-start-1"
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
