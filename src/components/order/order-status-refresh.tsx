"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Re-renders the page every few seconds for a short while, so an order that the
 * webhook confirms moments after the shopper returns from Checkout updates in place.
 * The status still only ever comes from the database. If it hasn't changed by the
 * last refresh, it says so instead of spinning forever.
 */
export function OrderStatusRefresh({ everyMs = 2500, times = 12 }: { everyMs?: number; times?: number }) {
  const router = useRouter();
  const [gaveUp, setGaveUp] = useState(false);
  useEffect(() => {
    let count = 0;
    const id = setInterval(() => {
      count += 1;
      router.refresh();
      if (count >= times) {
        clearInterval(id);
        setGaveUp(true);
      }
    }, everyMs);
    return () => clearInterval(id);
  }, [router, everyMs, times]);

  if (!gaveUp) return null;
  return (
    <p role="status" className="mt-4 border-l-2 border-ink bg-surface px-4 py-3 text-body">
      This is taking longer than usual. You don&rsquo;t need to pay again: if your payment went
      through, this order updates on its own. Refresh this page or check{" "}
      <Link href="/account/orders" className="link">
        your orders
      </Link>{" "}
      in a few minutes.
    </p>
  );
}
