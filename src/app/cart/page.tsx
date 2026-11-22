import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Breadcrumb } from "@/components/breadcrumb";
import { AcceptChangesButton } from "@/components/cart/accept-changes-button";
import { CartLine } from "@/components/cart/cart-line";
import { CheckoutButton } from "@/components/cart/checkout-button";
import { ArrowRightIcon, BagIcon } from "@/components/ui/icons";
import { formatPrice } from "@/lib/catalog";
import { getCart } from "@/lib/cart";
import { getSession, signInHref } from "@/lib/session";

export const metadata: Metadata = {
  title: "Shopping bag",
  robots: { index: false, follow: false },
};

export default function CartPage({ searchParams }: PageProps<"/cart">) {
  return (
    <main id="main" className="pt-header">
      <div className="container-page pt-6 pb-section">
        <Breadcrumb current="Shopping bag" />
        <Suspense fallback={<CartFallback />}>
          <CartContents searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function CartContents({ searchParams }: Pick<PageProps<"/cart">, "searchParams">) {
  const [cart, session, params] = await Promise.all([getCart(), getSession(), searchParams]);
  const canceled = params.checkout === "canceled";

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
          {canceled && (
            <div role="status" className="mb-4 border-l-2 border-ink bg-surface px-4 py-3 text-body">
              <p className="font-bold">Checkout canceled</p>
              <p className="mt-1 text-muted">
                Nothing was charged and your bag is just as you left it. Check out again
                whenever you&rsquo;re ready.
              </p>
            </div>
          )}
          {cart.hasIssues && (
            <div role="alert" className="mb-4 border-l-2 border-danger bg-surface px-4 py-3 text-body">
              <p className="font-bold">Some pieces changed since you added them</p>
              <p className="mt-1 text-muted">
                Review the highlighted items, then update your bag to continue to checkout.
              </p>
              <AcceptChangesButton />
            </div>
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
              <dd className="tabular-nums">{formatPrice(cart.subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Shipping</dt>
              <dd className="text-muted">Complimentary</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-t border-line pt-4">
              <dt className="font-bold">Total</dt>
              <dd className="text-title tabular-nums" aria-live="polite">
                {formatPrice(cart.subtotal)}
                <span className="sr-only"> US dollars</span>
              </dd>
            </div>
          </dl>
          <p className="mt-2 text-caption text-muted">
            In USD. Prices and availability are confirmed again when you check out.
          </p>
          {session ? (
            <CheckoutButton blocked={cart.hasIssues || cart.itemCount === 0} />
          ) : (
            <div className="mt-6">
              <Link href={signInHref("/cart")} className="btn btn-primary btn-block">
                Sign in to check out
              </Link>
              <p className="mt-3 text-caption text-muted">
                Your bag is saved while you sign in.{" "}
                <Link href={`/sign-up?next=${encodeURIComponent("/cart")}`} className="link text-ink">
                  Create an account
                </Link>
              </p>
            </div>
          )}
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
