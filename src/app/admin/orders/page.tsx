import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminEmpty, AdminFallback, AdminHeading } from "@/components/admin/admin-page";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Orders" };

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<AdminFallback />}>
      <OrdersContent />
    </Suspense>
  );
}

async function OrdersContent() {
  await requireAdmin("/admin/orders");

  return (
    <>
      <AdminHeading title="Orders" description="Every customer's orders, newest first." />
      <AdminEmpty title="Order list">The order list is the next step.</AdminEmpty>
    </>
  );
}
