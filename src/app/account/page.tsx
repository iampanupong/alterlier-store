import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { signOutAction } from "@/app/(auth)/actions";
import { Breadcrumb } from "@/components/breadcrumb";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "My account",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <main id="main" className="pt-header">
      <div className="px-gutter pt-6">
        <Breadcrumb current="My account" />
      </div>

      <div className="px-gutter pt-10 pb-section lg:pt-16">
        <div className="max-w-md">
          <h1 className="text-display">My account</h1>
          <Suspense fallback={<DetailsFallback />}>
            <AccountDetails />
          </Suspense>
        </div>
      </div>
    </main>
  );
}

const memberSince = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" });

async function AccountDetails() {
  const user = await requireUser("/account");

  return (
    <>
      <dl className="mt-10 divide-y divide-line border-y border-line">
        <Detail term="Name">{user.name}</Detail>
        <Detail term="Email">{user.email}</Detail>
        <Detail term="Member since">{memberSince.format(user.createdAt)}</Detail>
      </dl>

      <div className="mt-10 flex flex-wrap gap-3">
        <form action={signOutAction}>
          <button type="submit" className="btn btn-secondary">
            Sign out
          </button>
        </form>
        {user.role === "admin" ? (
          <Link href="/admin" className="btn btn-primary">
            Admin
          </Link>
        ) : null}
      </div>
    </>
  );
}

function Detail({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-4 py-4">
      <dt className="eyebrow text-muted">{term}</dt>
      <dd className="text-body break-words">{children}</dd>
    </div>
  );
}

function DetailsFallback() {
  return (
    <div aria-hidden="true" className="mt-10 divide-y divide-line border-y border-line">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="py-4">
          <div className="h-4 w-2/3 bg-surface-strong" />
        </div>
      ))}
    </div>
  );
}
