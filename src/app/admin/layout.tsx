import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminBreadcrumb, AdminNav } from "@/components/admin/admin-nav";
import { getAdmin } from "@/lib/session";

export const metadata: Metadata = {
  title: { template: "%s · Admin", default: "Admin" },
  robots: { index: false, follow: false },
};

/**
 * Shell for every /admin page. This layout does NOT authorize: layouts aren't
 * re-run on client navigation and don't cover server actions. Every page calls
 * `requireAdmin()` itself. The nav renders only for admins so a customer who
 * reaches a 404 here doesn't see the admin sections.
 */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <main id="main" className="pt-header">
      <div className="px-gutter pt-8 pb-section lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-16 lg:pt-16">
        <aside className="lg:sticky lg:top-[calc(var(--header-h)+2rem)] lg:self-start">
          <Suspense fallback={null}>
            <AdminChrome />
          </Suspense>
        </aside>

        <div className="mt-10 min-w-0 lg:mt-0">{children}</div>
      </div>
    </main>
  );
}

async function AdminChrome() {
  if (!(await getAdmin())) return null;
  return (
    <div className="space-y-6 lg:space-y-10">
      <AdminBreadcrumb />
      <AdminNav />
    </div>
  );
}
