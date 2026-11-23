"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Breadcrumb } from "@/components/breadcrumb";

/** Admin sections, in nav order. Add new admin areas here. */
export const ADMIN_SECTIONS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/orders", label: "Orders" },
] as const;

const ROOT = ADMIN_SECTIONS[0];

function currentSection(pathname: string) {
  // Nested pages (a product under /admin/products) belong to their section.
  return (
    ADMIN_SECTIONS.find((section) => section.href === pathname) ??
    ADMIN_SECTIONS.find((section) => section !== ROOT && pathname.startsWith(`${section.href}/`))
  );
}

/** Home / Admin / <section>, derived from the URL so pages don't repeat it. */
export function AdminBreadcrumb() {
  const section = currentSection(usePathname());
  if (!section || section === ROOT) return <Breadcrumb current="Admin" />;
  return <Breadcrumb links={[{ label: "Admin", href: ROOT.href }]} current={section.label} />;
}

/**
 * Horizontal, scrollable tabs on small screens; a vertical list from `lg` up.
 * Rendered only for admins (see the admin layout). Hiding it is cosmetic: every
 * admin page and action checks the role itself.
 */
export function AdminNav() {
  const section = currentSection(usePathname());

  return (
    <nav aria-label="Admin">
      {/* Inset-shadow rule, as in AccountNav, so the active underline isn't clipped. */}
      <ul className="scroll-row -mx-gutter gap-6 px-gutter shadow-[inset_0_-1px_0_var(--line)] lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:px-0 lg:shadow-none">
        {ADMIN_SECTIONS.map((item) => {
          const current = item === section;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={`eyebrow inline-flex min-h-11 items-center border-b lg:min-h-10 lg:border-b-0 ${
                  current
                    ? "border-ink text-ink lg:underline lg:decoration-1 lg:underline-offset-[0.4em]"
                    : "border-transparent text-muted hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
