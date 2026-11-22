"use client";

import { useFormStatus } from "react-dom";
import { acceptCartChangesAction } from "@/app/cart/actions";
import { Spinner } from "@/components/ui/spinner";

/** Accepts reduced and sold-out lines so the bag can go to checkout. */
export function AcceptChangesButton() {
  return (
    <form action={acceptCartChangesAction} className="mt-3">
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-secondary min-h-11 px-4 py-2" disabled={pending}>
      {pending ? (
        <>
          <Spinner />
          Updating…
        </>
      ) : (
        "Update bag"
      )}
    </button>
  );
}
