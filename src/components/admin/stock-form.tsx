"use client";

import { useActionState } from "react";
import { updateStockAction, type StockFormState } from "@/app/admin/products/actions";
import { LIMITS } from "@/lib/admin-model";

/**
 * Sets a product's stock. Sends the quantity this page showed (`expected`) so the
 * server refuses the write if a checkout reserved or released stock in the meantime.
 */
export function StockForm({
  productId,
  productName,
  quantity,
  compact = false,
}: {
  productId: string;
  productName: string;
  /** Stock as rendered by the server. */
  quantity: number;
  compact?: boolean;
}) {
  const [state, formAction, pending] = useActionState<StockFormState, FormData>(updateStockAction, {
    status: "idle",
  });
  // After a save or a conflict, the server's latest quantity is the new baseline.
  const expected = state.current ?? quantity;
  const inputId = `stock-${productId}`;
  const messageId = `${inputId}-message`;

  return (
    <form action={formAction} aria-busy={pending} className={compact ? "min-w-48" : undefined}>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="expected" value={expected} />
      <label htmlFor={inputId} className={compact ? "sr-only" : "eyebrow"}>
        {compact ? `Stock for ${productName}` : "Units in stock"}
      </label>
      <div className="flex items-end gap-3">
        <input
          // Show the server's latest value after each response.
          key={expected}
          id={inputId}
          name="quantity"
          type="number"
          inputMode="numeric"
          min={0}
          max={LIMITS.stock}
          step={1}
          required
          defaultValue={expected}
          readOnly={pending}
          aria-invalid={state.status === "error" || state.status === "conflict" ? true : undefined}
          aria-describedby={state.message ? messageId : undefined}
          className={`field tabular-nums ${compact ? "w-20 min-h-10 py-1.5" : "w-32"}`}
        />
        <button
          type="submit"
          disabled={pending}
          className={`btn btn-secondary ${compact ? "min-h-10 px-3 py-2" : ""}`}
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
      <p
        id={messageId}
        aria-live="polite"
        className={`text-caption ${state.message ? "mt-2" : ""} ${
          state.status === "ok" ? "text-muted" : "text-danger"
        }`}
      >
        {state.message}
      </p>
    </form>
  );
}
