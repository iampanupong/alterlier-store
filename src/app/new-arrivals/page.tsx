import type { Metadata } from "next";
import { Breadcrumb } from "@/components/breadcrumb";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import { getNewArrivals } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "New Arrivals",
  description: "The latest pieces to arrive at Nord Alterlier.",
};

/** How many of the most recently added products the page shows. */
const NEW_ARRIVALS_LIMIT = 48;

export default async function NewArrivalsPage() {
  const products = await getNewArrivals(NEW_ARRIVALS_LIMIT);

  return (
    <main id="main" className="pt-header">
      <div className="px-gutter pt-6">
        <Breadcrumb current="New Arrivals" />
      </div>

      <section aria-labelledby="new-title" className="pt-8 pb-section lg:pt-10">
        <SectionHeading as="h1" id="new-title" eyebrow="Just landed" title="New Arrivals" />
        {products.length > 0 ? (
          <div className="grid-products border-y border-line">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="px-gutter text-body text-muted">New pieces are coming soon.</p>
        )}
      </section>
    </main>
  );
}
