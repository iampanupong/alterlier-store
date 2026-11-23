import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminEmpty, AdminFallback, AdminHeading } from "@/components/admin/admin-page";
import { isUuid } from "@/lib/order-model";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Order" };

// Id known only at request time: render on request (the nav reads usePathname).
export const instant = false;

export default function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  return (
    <Suspense fallback={<AdminFallback />}>
      <OrderContent params={params} />
    </Suspense>
  );
}

async function OrderContent({ params }: Pick<PageProps<"/admin/orders/[id]">, "params">) {
  const { id } = await params;
  // Authorize before looking at the id, so non-admins can't probe for valid ones.
  await requireAdmin(`/admin/orders/${id}`);
  if (!isUuid(id)) notFound();

  return (
    <>
      <AdminHeading title="Order" />
      <AdminEmpty title="Order detail">The read-only order view is the next step.</AdminEmpty>
    </>
  );
}
