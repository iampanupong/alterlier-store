import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumb } from "@/components/breadcrumb";
import { SectionHeading } from "@/components/section-heading";
import { getCategorySummaries } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse every category at Nord Alterlier.",
};

export default async function CategoriesPage() {
  const categories = await getCategorySummaries();

  return (
    <main id="main" className="pt-header">
      <div className="px-gutter pt-6">
        <Breadcrumb current="Categories" />
      </div>

      <section aria-labelledby="categories-title" className="pt-8 pb-section lg:pt-10">
        <SectionHeading as="h1" id="categories-title" eyebrow="Explore" title="All Categories" />
        {categories.length > 0 ? (
          <ul className="grid-products border-y border-line">
            {categories.map((category) => (
              <li key={category.id}>
                <Link href={category.href} className="group block">
                  <div className="media media-portrait">
                    <Image
                      src={category.image.src}
                      alt={category.image.alt}
                      fill
                      sizes="(min-width: 64rem) 25vw, (min-width: 48rem) 33vw, 50vw"
                      className="media-zoom"
                    />
                  </div>
                  <div className="flex flex-col gap-1 px-3 pt-4 pb-6 sm:px-4">
                    <h2 className="link-quiet inline-block self-start text-label uppercase group-hover:decoration-current">
                      {category.name}
                    </h2>
                    <p className="text-caption text-muted">
                      {category.productCount} {category.productCount === 1 ? "piece" : "pieces"}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-gutter text-body text-muted">New pieces are coming soon.</p>
        )}
      </section>
    </main>
  );
}
