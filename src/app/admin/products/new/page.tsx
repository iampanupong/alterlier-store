import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminEmpty, AdminFallback, AdminHeading } from "@/components/admin/admin-page";
import { EMPTY_PRODUCT, ProductForm } from "@/components/admin/product-form";
import { listCategoryOptions } from "@/lib/admin";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "New product" };

export default function NewProductPage() {
  return (
    <Suspense fallback={<AdminFallback />}>
      <NewProductContent />
    </Suspense>
  );
}

async function NewProductContent() {
  await requireAdmin("/admin/products/new");
  const categories = await listCategoryOptions();

  return (
    <div className="max-w-2xl">
      <AdminHeading title="New product" />
      {categories.length === 0 ? (
        <AdminEmpty title="No categories yet">
          Every product needs a category.{" "}
          <Link href="/admin/categories" className="link text-ink">
            Create one first
          </Link>
          .
        </AdminEmpty>
      ) : (
        <div className="mt-10">
          <ProductForm mode="create" categories={categories} initial={EMPTY_PRODUCT} />
        </div>
      )}
    </div>
  );
}
