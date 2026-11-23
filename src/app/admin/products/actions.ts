"use server";

// Product admin actions. Server actions are public POST endpoints: each one authorizes
// itself first (enforced by src/lib/admin-guard.test.ts), then validates every field
// server-side through admin-model. Client-side checks are only a convenience.

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import {
  parseNewProductForm,
  parseProductForm,
  parseStockForm,
  PRODUCT_FIELDS,
  text,
  type FieldErrors,
} from "@/lib/admin-model";
import { insertProduct, setStock, updateProduct, type ProductWriteError } from "@/lib/admin";
import { CATALOG_TAG } from "@/lib/catalog";
import { isUuid } from "@/lib/order-model";
import { requireAdmin } from "@/lib/session";

export type ProductFormState = {
  status: "idle" | "ok" | "error";
  message?: string;
  fieldErrors?: FieldErrors;
  /** The submitted values, so a failed submit keeps what the admin typed. */
  values?: Partial<Record<(typeof PRODUCT_FIELDS)[number], string>>;
  /** Changes on every response so repeated identical messages are re-announced. */
  at?: number;
};

const WRITE_ERRORS: Record<ProductWriteError, { message: string; fieldErrors?: FieldErrors }> = {
  slug_taken: {
    message: "Another product already uses this URL slug.",
    fieldErrors: { slug: "Already in use by another product." },
  },
  sku_taken: {
    message: "Another product already uses this SKU.",
    fieldErrors: { sku: "Already in use by another product." },
  },
  category_missing: {
    message: "That category no longer exists.",
    fieldErrors: { categoryId: "Choose another category." },
  },
  not_found: { message: "This product no longer exists." },
};

function echo(formData: FormData): ProductFormState["values"] {
  return Object.fromEntries(PRODUCT_FIELDS.map((name) => [name, text(formData, name)]));
}

function invalid(formData: FormData, fieldErrors: FieldErrors): ProductFormState {
  return {
    status: "error",
    message: "Check the highlighted fields.",
    fieldErrors,
    values: echo(formData),
    at: Date.now(),
  };
}

function writeFailed(formData: FormData, reason: ProductWriteError): ProductFormState {
  return { status: "error", ...WRITE_ERRORS[reason], values: echo(formData), at: Date.now() };
}

export async function createProductAction(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin("/admin/products/new");

  const parsed = parseNewProductForm(formData);
  if (!parsed.ok) return invalid(formData, parsed.fieldErrors);

  const result = await insertProduct(parsed.value);
  if (!result.ok) return writeFailed(formData, result.reason);

  updateTag(CATALOG_TAG);
  redirect(`/admin/products/${result.id}?created=1`);
}

export async function updateProductAction(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdmin("/admin/products");

  const id = text(formData, "productId");
  if (!isUuid(id)) return { status: "error", message: "Something went wrong. Reload and try again.", at: Date.now() };

  const parsed = parseProductForm(formData);
  if (!parsed.ok) return invalid(formData, parsed.fieldErrors);

  const result = await updateProduct(id, parsed.value);
  if (!result.ok) return writeFailed(formData, result.reason);

  updateTag(CATALOG_TAG);
  refresh();
  return { status: "ok", message: "Product saved.", at: Date.now() };
}

export type StockFormState = {
  status: "idle" | "ok" | "conflict" | "error";
  message?: string;
  /** Latest quantity known to the server; becomes the form's next `expected`. */
  current?: number;
  at?: number;
};

export async function updateStockAction(
  _prev: StockFormState,
  formData: FormData,
): Promise<StockFormState> {
  await requireAdmin("/admin/products");

  const parsed = parseStockForm(formData);
  if (!parsed.ok) {
    const message =
      "invalid" in parsed ? "Something went wrong. Reload and try again." : parsed.fieldErrors.quantity;
    return { status: "error", message, at: Date.now() };
  }

  const result = await setStock(parsed.value);
  if (!result.ok) {
    if (result.reason === "not_found") {
      return { status: "error", message: "This product no longer exists.", at: Date.now() };
    }
    return {
      status: "conflict",
      message: `Stock changed to ${result.current} since this page loaded (checkouts reserve and release stock). Check it and save again.`,
      current: result.current,
      at: Date.now(),
    };
  }

  updateTag(CATALOG_TAG);
  refresh();
  return {
    status: "ok",
    message: result.quantity === 0 ? "Saved. Now sold out." : `Saved. ${result.quantity} in stock.`,
    current: result.quantity,
    at: Date.now(),
  };
}
