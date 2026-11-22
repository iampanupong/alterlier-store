import { SectionHeading } from "@/components/section-heading";
import { ProductCard } from "@/components/product-card";
import { getNewArrivals } from "@/lib/catalog";

export async function NewArrivals() {
  const newArrivals = await getNewArrivals();

  return (
    <section aria-labelledby="new-arrivals-title" className="section">
      <SectionHeading
        id="new-arrivals-title"
        eyebrow="Just landed"
        title="New Arrivals"
        action={{ label: "View all", href: "/new-arrivals" }}
      />
      <div className="grid-products border-y border-line">
        {newArrivals.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
