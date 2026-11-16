"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BagIcon,
  CloseIcon,
  MenuIcon,
  SearchIcon,
  UserIcon,
} from "@/components/ui/icons";
import { mainNav } from "@/lib/sample-data";

/** Routes whose first section is a full-bleed hero the header floats over. */
const OVERLAY_ROUTES = new Set(["/"]);

export function SiteHeader() {
  const pathname = usePathname();
  const overlayRoute = OVERLAY_ROUTES.has(pathname);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!overlayRoute) return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overlayRoute]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const transparent = overlayRoute && !scrolled && !menuOpen;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-colors duration-500 ease-luxe ${
          transparent
            ? "bg-transparent text-white"
            : "border-b border-line bg-paper text-ink"
        }`}
      >
        <div className="grid h-header grid-cols-[1fr_auto_1fr] items-center px-gutter">
          <div className="flex items-center">
            <Link
              href="/contact"
              className="link-quiet hidden text-label lg:inline"
            >
              + Contact us
            </Link>
          </div>

          <Link
            href="/"
            aria-label="Nord Alterlier, home"
            className="text-center text-lg font-light tracking-[0.35em] uppercase whitespace-nowrap max-lg:col-start-1 max-lg:row-start-1 max-lg:text-left lg:text-xl"
          >
            Nord Alterlier
          </Link>

          <nav aria-label="Account and cart" className="col-start-3 flex items-center justify-end">
            <Link href="/cart" className="btn-icon" aria-label="Shopping bag">
              <BagIcon />
            </Link>
            <Link
              href="/account"
              className="btn-icon max-sm:hidden"
              aria-label="My account"
            >
              <UserIcon />
            </Link>
            <Link href="/search" className="btn-icon" aria-label="Search">
              <SearchIcon />
            </Link>
            <button
              type="button"
              className="btn-icon w-auto gap-2 pl-2 text-label uppercase"
              aria-expanded={menuOpen}
              aria-controls="site-menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <CloseIcon /> : <MenuIcon />}
              <span className="max-sm:sr-only">{menuOpen ? "Close" : "Menu"}</span>
            </button>
          </nav>
        </div>
      </header>

      <div
        id="site-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Main menu"
        hidden={!menuOpen}
        className="fixed inset-x-0 top-header bottom-0 z-30 overflow-y-auto bg-paper"
      >
        <nav aria-label="Main" className="container-page py-10">
          <ul className="space-y-5">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="link-quiet text-display"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="mt-12 space-y-3 border-t border-line pt-8 text-caption">
            <li>
              <Link href="/account" className="link-quiet" onClick={() => setMenuOpen(false)}>
                My account
              </Link>
            </li>
            <li>
              <Link href="/contact" className="link-quiet" onClick={() => setMenuOpen(false)}>
                Contact us
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
}
