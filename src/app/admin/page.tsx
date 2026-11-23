import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { refreshCatalogAction } from "@/app/admin/actions";
import { AdminFallback, AdminHeading } from "@/components/admin/admin-page";
import { getCategorySummaries } from "@/lib/catalog";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Overview" };

export default function AdminPage() {
  return (
    <Suspense fallback={<AdminFallback />}>
      <AdminHome />
    </Suspense>
  );
}

async function AdminHome() {
  const user = await requireAdmin("/admin");
  const categories = await getCategorySummaries();
  const productCount = categories.reduce((sum, c) => sum + c.productCount, 0);

  return (
    <div className="max-w-md">
      <AdminHeading title="Admin" description={`Signed in as ${user.email}.`} />

      <dl className="mt-10 grid grid-cols-2 border-y border-line">
        <Stat term="Categories" value={categories.length} href="/admin/categories" />
        <Stat term="Products" value={productCount} href="/admin/products" />
      </dl>

      <form action={refreshCatalogAction} className="mt-10">
        <button type="submit" className="btn btn-secondary">
          Refresh catalogue cache
        </button>
      </form>
    </div>
  );
}

function Stat({ term, value, href }: { term: string; value: number; href: string }) {
  return (
    <div className="py-4 not-first:border-l not-first:border-line not-first:pl-4">
      <dt className="eyebrow text-muted">
        <Link href={href} className="link-quiet">
          {term}
        </Link>
      </dt>
      <dd className="mt-1 text-heading">{value}</dd>
    </div>
  );
}
