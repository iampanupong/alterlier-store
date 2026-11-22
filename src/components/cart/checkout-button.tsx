"use client";

import { useActionState, useEffect, useRef } from "react";
import { startCheckoutAction, type CheckoutState } from "@/app/checkout/actions";
import { ArrowRightIcon } from "@/components/ui/icons";
import { Spinner } from "@/components/ui/spinner";

// Submits nothing but the intent: the server reads the cart cookie, reprices it from
// the database, reserves stock and redirects to Stripe Checkout. While that happens the
// button stays busy (the page is about to navigate away), so it can't be sent twice.
export function CheckoutButton({ blocked = false }: { blocked?: boolean }) {
  const [state, action, pending] = useActionState<CheckoutState>(startCheckoutAction, {});
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.error) alertRef.current?.focus();
  }, [state]);

  return (
    <form action={action} className="mt-6" aria-busy={pending}>
      {state.error && !pending ? (
        <div
          key={state.at}
          ref={alertRef}
          role="alert"
          tabIndex={-1}
          className="mb-4 border-l-2 border-danger bg-paper px-4 py-3 text-body focus:outline-none"
        >
          {state.error}
        </div>
      ) : null}

      <button
        type="submit"
        className="btn btn-primary btn-block"
        disabled={blocked || pending}
        aria-describedby="checkout-note"
      >
        {pending ? (
          <>
            <Spinner />
            Preparing secure checkout…
          </>
        ) : (
          <>
            Checkout
            <ArrowRightIcon width={16} height={16} />
          </>
        )}
      </button>

      <p id="checkout-note" className="mt-3 text-caption text-muted">
        {blocked
          ? "Update your bag above to continue."
          : "You’ll pay on Stripe’s secure checkout. Your pieces are held for 30 minutes while you do."}
      </p>
    </form>
  );
}
