import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import { getCategoryBySlug, getCategorySlugs, getProductsByCategory } from "@/lib/catalog";

export async function generateStaticParams() {
  return (await getCategorySlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/categories/[slug]">): Promise<Metadata> {
  const category = await getCategoryBySlug((await params).slug);
  return category ? { title: category.name } : {};
}

export default async function CategoryPage({ params }: PageProps<"/categories/[slug]">) {
  const category = await getCategoryBySlug((await params).slug);
  if (!category) notFound();

  const products = await getProductsByCategory(category.id);

  return (
    <main id="main" className="pt-header">
      <section aria-labelledby="category-title" className="section">
        <SectionHeading id="category-title" eyebrow="Shop" title={category.name} />
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
