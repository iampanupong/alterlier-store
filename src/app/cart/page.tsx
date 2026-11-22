import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Breadcrumb } from "@/components/breadcrumb";
import { CartLine } from "@/components/cart/cart-line";
import { ArrowRightIcon, BagIcon } from "@/components/ui/icons";
import { formatPrice } from "@/lib/catalog";
import { getCart } from "@/lib/cart";

export const metadata: Metadata = {
  title: "Shopping bag",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <main id="main" className="pt-header">
      <div className="container-page pt-6 pb-section">
        <Breadcrumb current="Shopping bag" />
        <Suspense fallback={<CartFallback />}>
          <CartContents />
        </Suspense>
      </div>
    </main>
  );
}

async function CartContents() {
  const cart = await getCart();

  if (cart.lines.length === 0) {
    return (
      <>
        <CartHeading />
        <section aria-labelledby="empty-title" className="mt-10 bg-surface p-6 sm:p-8 lg:max-w-2xl">
          <BagIcon width={28} height={28} className="text-muted" />
          <h2 id="empty-title" className="mt-6 text-title">
            Your bag is empty
          </h2>
          <p className="mt-2 text-body text-muted">
            Pieces you add to your bag will appear here.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/new-arrivals" className="btn btn-primary">
              New arrivals
              <ArrowRightIcon width={16} height={16} />
            </Link>
            <Link href="/categories" className="btn btn-secondary">
              Shop by category
            </Link>
          </div>
        </section>
      </>
    );
  }

  const items = `${cart.itemCount} ${cart.itemCount === 1 ? "item" : "items"}`;

  return (
    <>
      <CartHeading count={items} />
      <div className="mt-8 lg:mt-10 lg:grid lg:grid-cols-12 lg:items-start lg:gap-12 xl:gap-16">
        <section aria-label="Items in your bag" className="lg:col-span-8">
          {cart.hasIssues && (
            <p role="alert" className="mb-4 border-l-2 border-danger bg-surface px-4 py-3 text-body">
              Some pieces changed since you added them. Please review the highlighted items.
            </p>
          )}
          <ul className="divide-y divide-line border-y border-line">
            {cart.lines.map((line, i) => (
              <CartLine key={line.product.id} line={line} eager={i === 0} />
            ))}
          </ul>
          <Link href="/new-arrivals" className="link mt-6 inline-block text-caption">
            Continue shopping
          </Link>
        </section>

        <aside
          aria-labelledby="summary-title"
          className="mt-10 bg-surface p-6 sm:p-8 lg:sticky lg:top-header lg:col-span-4 lg:mt-0"
        >
          <h2 id="summary-title" className="eyebrow">
            Order summary
          </h2>
          <dl className="mt-6 space-y-3 text-body">
            <div className="flex justify-between gap-4">
              <dt>Subtotal · {items}</dt>
              <dd className="font-bold tabular-nums" aria-live="polite">
                {formatPrice(cart.subtotal)}
              </dd>
            </div>
            <div className="flex justify-between gap-4 text-muted">
              <dt>Shipping</dt>
              <dd>Complimentary</dd>
            </div>
          </dl>
          <p className="mt-6 border-t border-line pt-4 text-caption text-muted">
            Prices and availability are confirmed each time you update your bag. Taxes are
            calculated at checkout.
          </p>
          <button type="button" className="btn btn-primary btn-block mt-6" disabled>
            Checkout coming soon
          </button>
        </aside>
      </div>
    </>
  );
}

function CartHeading({ count }: { count?: string }) {
  return (
    <div className="mt-8 flex items-baseline gap-3 lg:mt-10">
      <h1 className="text-heading lg:text-display">Shopping bag</h1>
      {count && <p className="text-caption text-muted">{count}</p>}
    </div>
  );
}

function CartFallback() {
  return (
    <>
      <CartHeading />
      <div aria-hidden="true" className="mt-8 lg:mt-10 lg:grid lg:grid-cols-12 lg:gap-12 xl:gap-16">
        <div className="space-y-6 lg:col-span-8">
          <div className="h-44 bg-surface" />
          <div className="h-44 bg-surface" />
        </div>
        <div className="mt-10 h-64 bg-surface lg:col-span-4 lg:mt-0" />
      </div>
    </>
  );
}
