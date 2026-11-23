// Admin reads and writes. Deliberately uncached: admins must see live prices and
// stock, unlike the storefront's `"use cache"` queries in catalog.ts. Only admin pages
// and admin server actions import this, and they authorize with requireAdmin() first.
// Callers invalidate CATALOG_TAG after a successful write.

import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, products } from "@/db/catalog";
import type { NewProductInput, ProductInput, StockInput } from "@/lib/admin-model";
import { isUuid } from "@/lib/order-model";
import { FK_VIOLATION, pgCode, pgConstraint, UNIQUE_VIOLATION } from "@/lib/pg-errors";

// ---- Reads --------------------------------------------------------------------------

/** Every product with the columns the admin table shows, A–Z. */
export async function listAdminProducts() {
  return db.query.products.findMany({
    columns: {
      id: true,
      slug: true,
      sku: true,
      name: true,
      priceCents: true,
      stockQuantity: true,
      lowStockThreshold: true,
      badge: true,
    },
    with: { category: { columns: { id: true, name: true } } },
    orderBy: [asc(products.name)],
  });
}

export type AdminProductRow = Awaited<ReturnType<typeof listAdminProducts>>[number];

/** One product with every editable column, or undefined. */
export async function getAdminProduct(id: string) {
  if (!isUuid(id)) return undefined;
  return db.query.products.findFirst({
    where: eq(products.id, id),
    with: { category: { columns: { id: true, name: true } } },
  });
}

export type AdminProduct = NonNullable<Awaited<ReturnType<typeof getAdminProduct>>>;

/** Categories for the product form's select, in rail order. */
export async function listCategoryOptions() {
  return db.query.categories.findMany({
    columns: { id: true, name: true },
    orderBy: [asc(categories.sortOrder), asc(categories.name)],
  });
}

// ---- Writes -------------------------------------------------------------------------
// Single statements (neon-http has no interactive transactions). Constraint
// violations become typed results; anything else is a real error and is rethrown.

export type ProductWriteError = "slug_taken" | "sku_taken" | "category_missing" | "not_found";
export type ProductWriteResult = { ok: true; id: string } | { ok: false; reason: ProductWriteError };

function productWriteError(error: unknown): ProductWriteResult {
  const code = pgCode(error);
  if (code === UNIQUE_VIOLATION) {
    const constraint = pgConstraint(error);
    if (constraint === "products_slug_unique") return { ok: false, reason: "slug_taken" };
    if (constraint === "products_sku_unique") return { ok: false, reason: "sku_taken" };
  }
  // The only FK on products is category_id: the category was deleted meanwhile.
  if (code === FK_VIOLATION) return { ok: false, reason: "category_missing" };
  throw error;
}

export async function insertProduct(input: NewProductInput): Promise<ProductWriteResult> {
  try {
    const [row] = await db.insert(products).values(input).returning({ id: products.id });
    return { ok: true, id: row.id };
  } catch (error) {
    return productWriteError(error);
  }
}

/** Details, category, price, images and low-stock threshold. Never stock (see setStock). */
export async function updateProduct(id: string, input: ProductInput): Promise<ProductWriteResult> {
  try {
    const rows = await db
      .update(products)
      .set(input)
      .where(eq(products.id, id))
      .returning({ id: products.id });
    return rows[0] ? { ok: true, id: rows[0].id } : { ok: false, reason: "not_found" };
  } catch (error) {
    return productWriteError(error);
  }
}

export type StockResult =
  | { ok: true; quantity: number }
  | { ok: false; reason: "changed"; current: number }
  | { ok: false; reason: "not_found" };

/**
 * Sets stock only if it still equals what the admin saw. Checkout reserves and
 * releases stock concurrently (createPendingOrder / releaseOrder), and a blind
 * overwrite would undo those changes. On a mismatch nothing is written and the
 * current quantity comes back so the admin can decide again.
 */
export async function setStock({ productId, expected, quantity }: StockInput): Promise<StockResult> {
  const rows = await db
    .update(products)
    .set({ stockQuantity: quantity })
    .where(and(eq(products.id, productId), eq(products.stockQuantity, expected)))
    .returning({ quantity: products.stockQuantity });
  if (rows[0]) return { ok: true, quantity: rows[0].quantity };

  const current = await db.query.products.findFirst({
    where: eq(products.id, productId),
    columns: { stockQuantity: true },
  });
  return current
    ? { ok: false, reason: "changed", current: current.stockQuantity }
    : { ok: false, reason: "not_found" };
}
