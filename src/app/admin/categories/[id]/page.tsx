import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminEmpty, AdminFallback, AdminHeading } from "@/components/admin/admin-page";
import { isUuid } from "@/lib/order-model";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Edit category" };

// Id known only at request time: render on request (the nav reads usePathname).
export const instant = false;

export default function EditCategoryPage({ params }: PageProps<"/admin/categories/[id]">) {
  return (
    <Suspense fallback={<AdminFallback />}>
      <EditCategoryContent params={params} />
    </Suspense>
  );
}

async function EditCategoryContent({ params }: Pick<PageProps<"/admin/categories/[id]">, "params">) {
  const { id } = await params;
  // Authorize before looking at the id, so non-admins can't probe for valid ones.
  await requireAdmin(`/admin/categories/${id}`);
  if (!isUuid(id)) notFound();

  return (
    <>
      <AdminHeading title="Edit category" />
      <AdminEmpty title="Category form">The edit form is the next step.</AdminEmpty>
    </>
  );
}
