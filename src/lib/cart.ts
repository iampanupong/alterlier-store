// Server-side cart reads and cookie writes. The cookie holds only product ids and
// quantities (see cart-model.ts); every read joins live prices and stock from the DB.
// Reading uses request data (cookies), so callers sit inside <Suspense>, never inside
// "use cache". Writing is only possible from server actions.

import { cookies } from "next/headers";
import { getLiveProducts, type LiveProduct } from "@/lib/catalog";
import {
  parseCart,
  reconcile,
  serializeCart,
  subtotalCents,
  type StoredLine,
} from "@/lib/cart-model";

const CART_COOKIE = "cart";
const CART_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type CartLine = {
  product: LiveProduct;
  /** Purchasable quantity right now (already clamped to stock). */
  quantity: number;
  /** What the shopper originally asked for, if stock has since dropped below it. */
  requested: number;
  maxQuantity: number;
  unitPrice: number;
  lineTotal: number;
  issue: "reduced" | "sold_out" | null;
};

export type Cart = {
  lines: CartLine[];
  subtotal: number;
  /** Sum of purchasable quantities. */
  itemCount: number;
  /** Some line was reduced or sold out since it was added. */
  hasIssues: boolean;
};

export async function readStoredCart(): Promise<StoredLine[]> {
  return parseCart((await cookies()).get(CART_COOKIE)?.value);
}

/** Server actions only: cookies can't be set during rendering. */
export async function writeStoredCart(lines: StoredLine[]) {
  const store = await cookies();
  if (lines.length === 0) {
    store.delete(CART_COOKIE);
    return;
  }
  store.set(CART_COOKIE, serializeCart(lines), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CART_MAX_AGE,
  });
}

/** The current cart, priced and stock-checked against live product data. */
export async function getCart(): Promise<Cart> {
  const stored = await readStoredCart();
  const products = await getLiveProducts(stored.map((line) => line.id));
  const reconciled = reconcile(stored, products);

  const lines = reconciled.map((line) => ({
    product: products.get(line.id)!,
    quantity: line.quantity,
    requested: line.requested,
    maxQuantity: line.maxQuantity,
    unitPrice: line.unitPriceCents / 100,
    lineTotal: line.lineTotalCents / 100,
    issue: line.issue,
  }));

  return {
    lines,
    subtotal: subtotalCents(reconciled) / 100,
    itemCount: reconciled.reduce((sum, line) => sum + line.quantity, 0),
    hasIssues: reconciled.some((line) => line.issue !== null),
  };
}

/** Item count for the header badge. Cookie-only, so it costs no database query. */
export async function getCartCount(): Promise<number> {
  return (await readStoredCart()).reduce((sum, line) => sum + line.q, 0);
}
