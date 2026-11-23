import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminEmpty, AdminFallback, AdminHeading } from "@/components/admin/admin-page";
import { Availability } from "@/components/admin/availability";
import { StockForm } from "@/components/admin/stock-form";
import { price } from "@/components/order/order-parts";
import { listAdminProducts } from "@/lib/admin";
import { toStockState } from "@/lib/catalog";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Products" };

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<AdminFallback />}>
      <ProductsContent />
    </Suspense>
  );
}

async function ProductsContent() {
  await requireAdmin("/admin/products");
  const products = await listAdminProducts();

  return (
    <>
      <AdminHeading
        title="Products"
        description={`${products.length} ${products.length === 1 ? "product" : "products"}. Live prices and stock.`}
        actions={
          <Link href="/admin/products/new" className="btn btn-primary">
            New product
          </Link>
        }
      />

      {products.length === 0 ? (
        <AdminEmpty title="No products yet">Create the first one to list it in the store.</AdminEmpty>
      ) : (
        // Scrolls sideways on narrow screens instead of the whole page.
        <div className="mt-10 -mx-gutter overflow-x-auto px-gutter lg:mx-0 lg:px-0">
          <table className="w-full min-w-[46rem] border-collapse text-left text-body">
            <thead>
              <tr className="border-b border-line text-muted">
                <th scope="col" className="eyebrow py-3 pr-4 font-bold">Product</th>
                <th scope="col" className="eyebrow py-3 pr-4 font-bold">Category</th>
                <th scope="col" className="eyebrow py-3 pr-4 text-right font-bold">Price</th>
                <th scope="col" className="eyebrow py-3 pr-4 font-bold">Availability</th>
                <th scope="col" className="eyebrow py-3 font-bold">Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {products.map((product) => (
                <tr key={product.id} className="align-top">
                  <th scope="row" className="py-4 pr-4 font-normal">
                    <Link href={`/admin/products/${product.id}`} className="link-quiet font-bold">
                      {product.name}
                    </Link>
                    <span className="mt-1 block text-caption text-muted">
                      {product.sku}
                      {product.badge ? ` · ${product.badge}` : ""}
                    </span>
                  </th>
                  <td className="py-4 pr-4">{product.category.name}</td>
                  <td className="py-4 pr-4 text-right tabular-nums">{price(product.priceCents)}</td>
                  <td className="py-4 pr-4">
                    <Availability stock={toStockState(product.stockQuantity, product.lowStockThreshold)} />
                    <span className="mt-1 block text-caption text-muted">
                      Low at ≤ {product.lowStockThreshold}
                    </span>
                  </td>
                  <td className="py-3">
                    <StockForm
                      compact
                      productId={product.id}
                      productName={product.name}
                      quantity={product.stockQuantity}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
