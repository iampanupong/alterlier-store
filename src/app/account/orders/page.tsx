import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DetailListFallback } from "@/components/account/detail-list";
import { formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABEL } from "@/lib/order-model";
import { getUserOrders } from "@/lib/orders";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Orders",
  robots: { index: false, follow: false },
};

const orderDate = new Intl.DateTimeFormat("en", { dateStyle: "medium" });

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
            <Link
              href={`/account/orders/${order.id}`}
              className="grid gap-1 py-4 hover:text-muted sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4"
            >
              <span>
                <span className="eyebrow block">{ORDER_STATUS_LABEL[order.status]}</span>
                <span className="text-body">
                  {orderDate.format(order.createdAt)} · {count} {count === 1 ? "item" : "items"}
                </span>
              </span>
              <span className="text-body font-bold tabular-nums">
                {formatPrice(order.totalCents / 100)}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
