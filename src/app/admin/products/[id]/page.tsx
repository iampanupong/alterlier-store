import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminFallback, AdminHeading } from "@/components/admin/admin-page";
import { Availability } from "@/components/admin/availability";
import { ProductForm, type ProductFormValues } from "@/components/admin/product-form";
import { StockForm } from "@/components/admin/stock-form";
import { getAdminProduct, listCategoryOptions, type AdminProduct } from "@/lib/admin";
import { galleryText } from "@/lib/admin-model";
import { toStockState } from "@/lib/catalog";
import { isUuid } from "@/lib/order-model";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Edit product" };

// Id known only at request time: render on request (the nav reads usePathname).
export const instant = false;

export default function EditProductPage({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  return (
    <Suspense fallback={<AdminFallback />}>
      <EditProductContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function EditProductContent({
  params,
  searchParams,
}: Pick<PageProps<"/admin/products/[id]">, "params" | "searchParams">) {
  const { id } = await params;
  // Authorize before looking at the id, so non-admins can't probe for valid ones.
  await requireAdmin(`/admin/products/${id}`);
  if (!isUuid(id)) notFound();

  const [product, categories, query] = await Promise.all([
    getAdminProduct(id),
    listCategoryOptions(),
    searchParams,
  ]);
  if (!product) notFound();

  return (
    <div className="max-w-2xl">
      <p className="eyebrow text-muted">{product.sku}</p>
      <div className="mt-2">
        <AdminHeading
          title={product.name}
          actions={
            <Link href={`/products/${product.slug}`} className="btn btn-secondary" target="_blank">
              View in store
            </Link>
          }
        />
      </div>

      {query.created ? (
        <p role="status" className="mt-6 border-l-2 border-ink bg-surface px-4 py-3 text-body">
          Product created. It&apos;s live in the store now.
        </p>
      ) : null}

      <section aria-labelledby="availability" className="mt-12 border-t border-line pt-6">
        <h2 id="availability" className="eyebrow text-muted">
          Availability
        </h2>
        <div className="mt-6 flex flex-wrap items-start gap-x-12 gap-y-6">
          <StockForm productId={product.id} productName={product.name} quantity={product.stockQuantity} />
          <div className="pt-6">
            <Availability stock={toStockState(product.stockQuantity, product.lowStockThreshold)} />
            <p className="mt-1 text-caption text-muted">
              Low stock at {product.lowStockThreshold} or fewer. Set 0 to mark it sold out.
            </p>
          </div>
        </div>
      </section>

      <div className="mt-12">
        <ProductForm mode="edit" productId={product.id} categories={categories} initial={toFormValues(product)} />
      </div>
    </div>
  );
}

function toFormValues(product: AdminProduct): ProductFormValues {
  return {
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    categoryId: product.categoryId,
    price: (product.priceCents / 100).toFixed(2),
    badge: product.badge ?? "",
    description: product.description,
    details: product.details.join("\n"),
    imageSrc: product.image.src,
    imageAlt: product.image.alt,
    gallery: galleryText(product.gallery),
    stockQuantity: String(product.stockQuantity),
    lowStockThreshold: String(product.lowStockThreshold),
  };
}
