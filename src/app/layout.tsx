import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import { Suspense } from "react";
import { CartCount } from "@/components/cart/cart-count";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import "./globals.css";

const brandSans = Outfit({
  variable: "--font-brand-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Nord Alterlier", template: "%s | Nord Alterlier" },
  description: "Nord Alterlier store",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${brandSans.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only z-50 bg-ink px-4 py-3 text-label text-paper focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          Skip to content
        </a>
        <SiteHeader
          cartCount={
            <Suspense fallback={null}>
              <CartCount />
            </Suspense>
          }
        />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
