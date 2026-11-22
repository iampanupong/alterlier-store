import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Breadcrumb } from "@/components/breadcrumb";
import { ProductCard } from "@/components/product-card";
import { SearchForm } from "@/components/search-form";
import { getCategorySummaries, searchProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Search",
  description: "Search the Nord Alterlier collection.",
  // Result pages are endless query permutations; keep them out of the index.
  robots: { index: false, follow: true },
};

type SearchParams = PageProps<"/search">["searchParams"];

async function readQuery(searchParams: SearchParams) {
  const { q } = await searchParams;
  return (Array.isArray(q) ? q[0] : q)?.trim() ?? "";
}

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <main id="main" className="pt-header">
      <div className="px-gutter pt-6">
        <Breadcrumb current="Search" />
      </div>

      <div className="px-gutter pt-8 pb-8 lg:pt-10 lg:pb-12">
        <h1 className="eyebrow text-muted">Search</h1>
        <div className="mt-2 max-w-4xl">
          {/* Keyed on the query so back/forward navigation resets the input. */}
          <Suspense fallback={<SearchForm />}>
            {readQuery(searchParams).then((query) => (
              <SearchForm key={query} query={query} />
            ))}
          </Suspense>
        </div>
      </div>

      <Suspense fallback={<ResultsFallback />}>
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function SearchResults({ searchParams }: { searchParams: SearchParams }) {
  const query = await readQuery(searchParams);
  if (!query) return <CategorySuggestions title="Browse by category" />;

  const products = await searchProducts(query);

  return (
    <section aria-labelledby="results-title" className="pb-section">
      <h2
        id="results-title"
        role="status"
        className="px-gutter pb-4 text-caption text-muted"
      >
        {products.length === 0
          ? "No results"
          : `${products.length} ${products.length === 1 ? "result" : "results"}`}{" "}
        for &ldquo;<span className="text-ink">{query}</span>&rdquo;
      </h2>

      {products.length > 0 ? (
        <div className="grid-products border-y border-line">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <>
          <p className="px-gutter text-body">
            Check the spelling, try a more general word, or browse a category.
          </p>
          <CategorySuggestions title="Try a category" />
        </>
      )}
    </section>
  );
}

async function CategorySuggestions({ title }: { title: string }) {
  const categories = await getCategorySummaries();
  if (categories.length === 0) return null;

  return (
    <nav aria-labelledby="suggestions-title" className="px-gutter pt-8 pb-section">
      <h2 id="suggestions-title" className="eyebrow">
        {title}
      </h2>
      <ul className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
        {categories.map((category) => (
          <li key={category.id}>
            <Link href={category.href} className="link-quiet text-title">
              {category.name}
              <span className="ml-1.5 text-caption text-muted">{category.productCount}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function ResultsFallback() {
  return (
    <div aria-hidden="true" className="pb-section">
      <div className="mx-gutter mb-4 h-4 w-32 bg-surface-strong" />
      <div className="grid-products border-y border-line">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i}>
            <div className="media media-square" />
            <div className="space-y-2 px-3 pt-4 pb-6 sm:px-4">
              <div className="h-3 w-16 bg-surface-strong" />
              <div className="h-4 w-3/4 bg-surface-strong" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
