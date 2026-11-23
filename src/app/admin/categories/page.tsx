import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminEmpty, AdminFallback, AdminHeading } from "@/components/admin/admin-page";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Categories" };

export default function AdminCategoriesPage() {
  return (
    <Suspense fallback={<AdminFallback />}>
      <CategoriesContent />
    </Suspense>
  );
}

async function CategoriesContent() {
  await requireAdmin("/admin/categories");

  return (
    <>
      <AdminHeading title="Categories" description="Create, rename, reorder and remove categories." />
      <AdminEmpty title="Category list">Category management is the next step.</AdminEmpty>
    </>
  );
}
