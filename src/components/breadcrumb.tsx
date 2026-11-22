import Link from "next/link";
import { Fragment } from "react";

type BreadcrumbProps = {
  /** Ancestor pages, outermost first. "Home" is added automatically. */
  links?: { label: string; href: string }[];
  current: string;
};

export function Breadcrumb({ links = [], current }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap gap-1.5 text-caption text-muted">
        {[{ label: "Home", href: "/" }, ...links].map((link) => (
          <Fragment key={link.href}>
            <li>
              <Link href={link.href} className="link-quiet">
                {link.label}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
          </Fragment>
        ))}
        <li aria-current="page" className="text-ink">
          {current}
        </li>
      </ol>
    </nav>
  );
}
