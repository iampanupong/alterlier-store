"use server";

// Inventory actions. Server actions are public POST endpoints: each one authorizes
// itself first (enforced by src/lib/admin-guard.test.ts), then validates every field
// server-side through admin-model. Setting an absolute count reuses
// updateStockAction (products/actions.ts); this file adds relative adjustments.

import { refresh, updateTag } from "next/cache";
import { adjustStock } from "@/lib/admin";
import { parseAdjustStockForm } from "@/lib/admin-model";
import { CATALOG_TAG } from "@/lib/catalog";
import { requireAdmin } from "@/lib/session";

export type AdjustStockFormState = {
  status: "idle" | "ok" | "error";
  message?: string;
  /** Changes on every response so repeated identical messages are re-announced. */
  at?: number;
};

export async function adjustStockAction(
  _prev: AdjustStockFormState,
  formData: FormData,
): Promise<AdjustStockFormState> {
  await requireAdmin("/admin/inventory");

  const parsed = parseAdjustStockForm(formData);
  if (!parsed.ok) {
    const message =
      "invalid" in parsed ? "Something went wrong. Reload and try again." : parsed.fieldErrors.amount;
    return { status: "error", message, at: Date.now() };
  }

  const { delta } = parsed.value;
  const result = await adjustStock(parsed.value);
  if (!result.ok) {
    if (result.reason === "not_found") {
      return { status: "error", message: "This product no longer exists.", at: Date.now() };
    }
    const message =
      delta < 0
        ? `Only ${result.current} in stock. Can't remove ${-delta}.`
        : `Stock is ${result.current}. Adding ${delta} would pass the limit.`;
    return { status: "error", message, at: Date.now() };
  }

  updateTag(CATALOG_TAG);
  refresh();
  const change = delta > 0 ? `Added ${delta}.` : `Removed ${-delta}.`;
  return {
    status: "ok",
    message: result.quantity === 0 ? `${change} Now sold out.` : `${change} ${result.quantity} in stock.`,
    at: Date.now(),
  };
}
