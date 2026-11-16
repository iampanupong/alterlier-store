import Link from "next/link";
import { NewsletterForm } from "@/components/layout/newsletter-form";
import { footerNav } from "@/lib/sample-data";

export function SiteFooter() {
  return (
    <footer className="theme-inverse">
      <div className="container-page grid gap-12 py-16 lg:grid-cols-12 lg:gap-gutter lg:py-24">
        <nav aria-label="Footer" className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-7">
          {footerNav.map((group) => (
            <div key={group.title}>
              <h2 className="eyebrow text-muted">{group.title}</h2>
              <ul className="mt-5 space-y-3 text-caption">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="link">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="lg:col-span-5">
          <h2 className="eyebrow text-muted">Newsletter</h2>
          <p className="mt-5 max-w-sm text-caption">
            Early access to new collections, private sales and stories from the
            ateliers.
          </p>
          <NewsletterForm />
        </div>
      </div>

      <div className="container-page flex flex-col gap-6 border-t border-line py-8 sm:flex-row sm:items-end sm:justify-between">
        <p className="text-[clamp(1.5rem,6.5vw,6rem)] leading-none font-extralight tracking-[0.2em] whitespace-nowrap uppercase">
          Nord Alterlier
        </p>
        <p className="shrink-0 text-caption text-muted">© 2026 Nord Alterlier</p>
      </div>
    </footer>
  );
}
