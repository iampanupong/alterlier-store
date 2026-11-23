import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdjustStockForm } from "@/components/admin/adjust-stock-form";
import { AdminEmpty, AdminFallback, AdminHeading } from "@/components/admin/admin-page";
import { Availability } from "@/components/admin/availability";
import { StockForm } from "@/components/admin/stock-form";
import { listAdminProducts } from "@/lib/admin";
import { inventoryView, parseInventoryFilter, toStockState, type InventoryFilter } from "@/lib/stock";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Inventory" };

const FILTER_LABELS: Record<InventoryFilter, string> = {
  all: "All",
  out: "Sold out",
  low: "Low stock",
  in: "In stock",
};

const EMPTY: Record<InventoryFilter, string> = {
  all: "Create a product to start tracking stock.",
  out: "Nothing is sold out.",
  low: "Nothing is running low.",
  in: "No product is comfortably in stock.",
};

export default function AdminInventoryPage({ searchParams }: PageProps<"/admin/inventory">) {
  return (
    <Suspense fallback={<AdminFallback />}>
      <InventoryContent searchParams={searchParams} />
    </Suspense>
  );
}

async function InventoryContent({ searchParams }: Pick<PageProps<"/admin/inventory">, "searchParams">) {
  await requireAdmin("/admin/inventory");

  const [products, query] = await Promise.all([listAdminProducts(), searchParams]);
  const filter = parseInventoryFilter(query.status);
  const { rows, counts } = inventoryView(products, filter);

  return (
    <>
      <AdminHeading
        title="Inventory"
        description="Live stock, most urgent first. Set a counted total, or add and remove units as stock arrives or leaves."
      />

      <nav aria-label="Filter by availability" className="mt-10">
        <ul className="scroll-row gap-6">
          {Object.entries(FILTER_LABELS).map(([key, label]) => {
            const current = key === filter;
            return (
              <li key={key}>
                <Link
                  href={key === "all" ? "/admin/inventory" : `/admin/inventory?status=${key}`}
                  aria-current={current ? "page" : undefined}
                  className={`eyebrow inline-flex min-h-11 items-center gap-2 border-b ${
                    current ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink"
                  }`}
                >
                  {label}
                  <span className="tabular-nums">{counts[key as InventoryFilter]}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {rows.length === 0 ? (
        <AdminEmpty title={filter === "all" ? "No products yet" : `No ${FILTER_LABELS[filter].toLowerCase()} products`}>
          {EMPTY[filter]}
        </AdminEmpty>
      ) : (
        // Scrolls sideways on narrow screens instead of the whole page.
        <div className="mt-6 -mx-gutter overflow-x-auto px-gutter lg:mx-0 lg:px-0">
          <table className="w-full min-w-[52rem] border-collapse text-left text-body">
            <thead>
              <tr className="border-b border-line text-muted">
                <th scope="col" className="eyebrow py-3 pr-4 font-bold">Product</th>
                <th scope="col" className="eyebrow py-3 pr-4 font-bold">Availability</th>
                <th scope="col" className="eyebrow py-3 pr-4 font-bold">Set count</th>
                <th scope="col" className="eyebrow py-3 font-bold">Add or remove</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((product) => (
                <tr key={product.id} className="align-top">
                  <th scope="row" className="py-4 pr-4 font-normal">
                    <Link href={`/admin/products/${product.id}`} className="link-quiet font-bold">
                      {product.name}
                    </Link>
                    <span className="mt-1 block text-caption text-muted">
                      {product.sku} · {product.category.name}
                    </span>
                  </th>
                  <td className="py-4 pr-4">
                    <Availability stock={toStockState(product.stockQuantity, product.lowStockThreshold)} />
                    <span className="mt-1 block text-caption text-muted">
                      Low at ≤ {product.lowStockThreshold}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <StockForm
                      compact
                      productId={product.id}
                      productName={product.name}
                      quantity={product.stockQuantity}
                    />
                  </td>
                  <td className="py-3">
                    <AdjustStockForm productId={product.id} productName={product.name} />
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
