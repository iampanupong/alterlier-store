import { Suspense } from "react";
import { AccountBreadcrumb, AccountNav } from "@/components/account/account-nav";
import { getSession } from "@/lib/session";

/** Shell for every /account page: breadcrumb, section nav, content column. */
export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return (
    <main id="main" className="pt-header">
      <div className="px-gutter pt-6">
        <AccountBreadcrumb />
      </div>

      <div className="px-gutter pt-8 pb-section lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-16 lg:pt-16">
        <aside className="lg:sticky lg:top-[calc(var(--header-h)+2rem)] lg:self-start">
          <Suspense fallback={<AccountNav />}>
            <NavWithRole />
          </Suspense>
        </aside>

        <div className="mt-10 max-w-2xl lg:mt-0">{children}</div>
      </div>
    </main>
  );
}

// The page itself enforces sign-in (requireUser); this only decides whether to show Admin.
async function NavWithRole() {
  const session = await getSession();
  return <AccountNav isAdmin={session?.user.role === "admin"} />;
}
