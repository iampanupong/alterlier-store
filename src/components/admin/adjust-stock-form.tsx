"use client";

import { useActionState } from "react";
import { adjustStockAction, type AdjustStockFormState } from "@/app/admin/inventory/actions";
import { LIMITS } from "@/lib/admin-model";

/**
 * Adds or removes units relative to current stock ("received 5"). Unlike StockForm it
 * sends no `expected` value: the server applies the change atomically, so concurrent
 * checkout reservations don't cause a conflict.
 */
export function AdjustStockForm({ productId, productName }: { productId: string; productName: string }) {
  const [state, formAction, pending] = useActionState<AdjustStockFormState, FormData>(adjustStockAction, {
    status: "idle",
  });
  const inputId = `adjust-${productId}`;
  const messageId = `${inputId}-message`;

  return (
    <form action={formAction} aria-busy={pending} className="min-w-56">
      <input type="hidden" name="productId" value={productId} />
      <label htmlFor={inputId} className="sr-only">
        Units to add to or remove from {productName}
      </label>
      <div className="flex items-end gap-2">
        <input
          // Clear the amount after each successful change.
          key={state.status === "ok" ? state.at : "draft"}
          id={inputId}
          name="amount"
          type="number"
          inputMode="numeric"
          min={1}
          max={LIMITS.stock}
          step={1}
          required
          placeholder="Qty"
          readOnly={pending}
          aria-invalid={state.status === "error" ? true : undefined}
          aria-describedby={state.message ? messageId : undefined}
          className="field w-20 min-h-10 py-1.5 tabular-nums"
        />
        <button
          type="submit"
          name="op"
          value="add"
          disabled={pending}
          className="btn btn-secondary min-h-10 px-3 py-2"
        >
          Add
        </button>
        <button
          type="submit"
          name="op"
          value="remove"
          disabled={pending}
          className="btn btn-secondary min-h-10 px-3 py-2"
        >
          Remove
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
