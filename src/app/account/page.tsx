import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DetailList, DetailListFallback } from "@/components/account/detail-list";
import { ArrowRightIcon } from "@/components/ui/icons";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "My account",
  robots: { index: false, follow: false },
};

export default function AccountOverviewPage() {
  return (
    <>
      <h1 className="text-display">My account</h1>
      <Suspense fallback={<OverviewFallback />}>
        <Overview />
      </Suspense>
    </>
  );
}

async function Overview() {
  const user = await requireUser("/account");
  const firstName = user.name.split(/\s+/)[0] || user.name;

  return (
    <>
      <p className="mt-3 text-body text-muted">Welcome back, {firstName}.</p>

      <section aria-labelledby="overview-details" className="mt-12">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 id="overview-details" className="eyebrow">
            Your details
          </h2>
          <Link href="/account/details" className="link text-caption">
            View all
          </Link>
        </div>
        <DetailList
          items={[
            { term: "Name", value: user.name },
            { term: "Email", value: user.email },
          ]}
        />
      </section>

      <section aria-labelledby="overview-shop" className="mt-12 bg-surface p-6 sm:p-8">
        <h2 id="overview-shop" className="text-title">
          Discover what&rsquo;s new
        </h2>
        <p className="mt-2 text-body text-muted">
          See the latest additions to the collection.
        </p>
        <Link href="/new-arrivals" className="btn btn-secondary mt-6">
          New arrivals
          <ArrowRightIcon width={16} height={16} />
        </Link>
      </section>
    </>
  );
}

function OverviewFallback() {
  return (
    <>
      <div aria-hidden="true" className="mt-3 h-5 w-40 bg-surface-strong" />
      <div className="mt-12">
        <div aria-hidden="true" className="mb-4 h-4 w-24 bg-surface-strong" />
        <DetailListFallback rows={2} />
      </div>
    </>
  );
}
