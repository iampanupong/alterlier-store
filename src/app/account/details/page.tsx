import type { Metadata } from "next";
import { Suspense } from "react";
import { DetailList, DetailListFallback, memberSince } from "@/components/account/detail-list";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Account details",
  robots: { index: false, follow: false },
};

export default function AccountDetailsPage() {
  return (
    <>
      <h1 className="text-display">Account details</h1>
      <p className="mt-3 text-body text-muted">The information we hold for your account.</p>

      <div className="mt-12">
        <Suspense fallback={<DetailListFallback rows={3} />}>
          <Details />
        </Suspense>
      </div>

      <p className="mt-6 text-caption text-muted">
        Changing your name, email or password online isn&rsquo;t available yet.
      </p>
    </>
  );
}

async function Details() {
  const user = await requireUser("/account/details");

  return (
    <DetailList
      items={[
        { term: "Name", value: user.name },
        { term: "Email", value: user.email },
        { term: "Member since", value: memberSince.format(user.createdAt) },
      ]}
    />
  );
}
