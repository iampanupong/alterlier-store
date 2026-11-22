"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFormStatus } from "react-dom";
import { signOutAction } from "@/app/(auth)/actions";
import { Breadcrumb } from "@/components/breadcrumb";

/** Account sections, in nav order. Add new account pages here. */
export const ACCOUNT_SECTIONS = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/details", label: "Account details" },
] as const;

const ROOT = ACCOUNT_SECTIONS[0];

function currentSection(pathname: string) {
  // Nested pages (an order under /account/orders) belong to their section.
  return (
    ACCOUNT_SECTIONS.find((section) => section.href === pathname) ??
    ACCOUNT_SECTIONS.find((section) => section !== ROOT && pathname.startsWith(`${section.href}/`))
  );
}

/** Home / My account / <section>, derived from the URL so pages don't repeat it. */
export function AccountBreadcrumb() {
  const section = currentSection(usePathname());
  if (!section || section === ROOT) return <Breadcrumb current="My account" />;
  return <Breadcrumb links={[{ label: "My account", href: ROOT.href }]} current={section.label} />;
}

/**
 * Horizontal, scrollable tabs on small screens; a vertical list from `lg` up.
 * `isAdmin` arrives after the session streams in; the fallback renders without it.
 */
export function AccountNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Account">
      {/* The rule is an inset shadow, not a border, so the active tab's underline can
          sit on top of it without being clipped by the scroll container. */}
      <ul className="scroll-row -mx-gutter gap-6 px-gutter shadow-[inset_0_-1px_0_var(--line)] lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:px-0 lg:shadow-none">
        {ACCOUNT_SECTIONS.map((section) => (
          <li key={section.href}>
            <NavLink href={section.href} current={pathname === section.href}>
              {section.label}
            </NavLink>
          </li>
        ))}
        {isAdmin ? (
          <li>
            <NavLink href="/admin" current={false}>
              Admin
            </NavLink>
          </li>
        ) : null}
        <li className="lg:mt-6 lg:border-t lg:border-line lg:pt-6">
          <form action={signOutAction}>
            <SignOutButton />
          </form>
        </li>
      </ul>
    </nav>
  );
}

const ITEM =
  "eyebrow inline-flex min-h-11 items-center border-b lg:min-h-10 lg:border-b-0";

function NavLink({
  href,
  current,
  children,
}: {
  href: string;
  current: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={`${ITEM} ${
        current
          ? "border-ink text-ink lg:underline lg:decoration-1 lg:underline-offset-[0.4em]"
          : "border-transparent text-muted hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

function SignOutButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${ITEM} cursor-pointer border-transparent text-muted hover:text-ink disabled:opacity-40`}
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
