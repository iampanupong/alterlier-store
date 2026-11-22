import type { Metadata } from "next";
import { Suspense } from "react";
import { refreshCatalogAction } from "@/app/admin/actions";
import { getCategorySummaries } from "@/lib/catalog";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <main id="main" className="pt-header">
      <div className="px-gutter pt-10 pb-section lg:pt-16">
        <Suspense fallback={<div aria-hidden="true" className="h-10 w-40 bg-surface-strong" />}>
          <AdminHome />
        </Suspense>
      </div>
    </main>
  );
}

async function AdminHome() {
  const user = await requireAdmin();
  const categories = await getCategorySummaries();
  const productCount = categories.reduce((sum, c) => sum + c.productCount, 0);

  return (
    <div className="max-w-md">
      <p className="eyebrow text-muted">Admin</p>
      <h1 className="mt-2 text-display">Catalogue</h1>
      <p className="mt-3 text-body text-muted">Signed in as {user.email}.</p>

      <dl className="mt-10 grid grid-cols-2 border-y border-line">
        <Stat term="Categories" value={categories.length} />
        <Stat term="Products" value={productCount} />
      </dl>

      <form action={refreshCatalogAction} className="mt-10">
        <button type="submit" className="btn btn-secondary">
          Refresh catalogue cache
        </button>
      </form>
    </div>
  );
}

function Stat({ term, value }: { term: string; value: number }) {
  return (
    <div className="py-4 not-first:border-l not-first:border-line not-first:pl-4">
      <dt className="eyebrow text-muted">{term}</dt>
      <dd className="mt-1 text-heading">{value}</dd>
    </div>
  );
}
