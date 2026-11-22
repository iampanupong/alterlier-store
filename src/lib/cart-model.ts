// Pure cart logic: no Next.js or database imports, so it can be unit-tested directly.
// The cart cookie only ever holds product ids and quantities. Prices and stock always
// come from the database at read time, so the client can't influence them.

/** One line as stored in the cookie. */
export type StoredLine = { id: string; q: number };

/** Quantity cap per line, independent of stock. */
export const MAX_LINE_QUANTITY = 99;
/** Distinct products per cart. Keeps the cookie well under the 4 KB limit. */
export const MAX_LINES = 50;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isProductId(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

/** Integer in 0..MAX_LINE_QUANTITY, or null. Accepts form strings like "3". */
export function parseQuantity(value: unknown): number | null {
  const n = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isInteger(n) || n < 0 || n > MAX_LINE_QUANTITY) {
    return null;
  }
  return n;
}

/**
 * Reads the cookie value. The cookie is user-controlled, so anything malformed is
 * dropped rather than trusted: bad JSON gives an empty cart, and bad ids, bad
 * quantities and duplicate ids are skipped.
 */
export function parseCart(raw: string | undefined): StoredLine[] {
  if (!raw) return [];
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];

  const seen = new Set<string>();
  const lines: StoredLine[] = [];
  for (const item of data) {
    if (lines.length >= MAX_LINES) break;
    if (typeof item !== "object" || item === null) continue;
    const { id, q } = item as Record<string, unknown>;
    const quantity = parseQuantity(q);
    if (!isProductId(id) || !quantity) continue;
    const key = id.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    lines.push({ id: key, q: quantity });
  }
  return lines;
}

export function serializeCart(lines: StoredLine[]): string {
  return JSON.stringify(lines.map(({ id, q }) => ({ id, q })));
}

/** The live product data reconciliation needs. */
export type StockInfo = { stockQuantity: number; priceCents: number };

export type ReconciledLine = {
  id: string;
  /** What the cart asked for. */
  requested: number;
  /** What can actually be bought now: min(requested, stock). 0 when sold out. */
  quantity: number;
  /** Most the shopper can choose for this line right now. */
  maxQuantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  issue: "reduced" | "sold_out" | null;
};

/**
 * Clamps each stored line to current stock, using current prices. Lines for products
 * that no longer exist are dropped. Sold-out lines are kept (so the shopper sees what
 * happened) but contribute nothing to the subtotal.
 */
export function reconcile(
  lines: StoredLine[],
  products: ReadonlyMap<string, StockInfo>,
): ReconciledLine[] {
  const result: ReconciledLine[] = [];
  for (const line of lines) {
    const product = products.get(line.id);
    if (!product) continue;
    const maxQuantity = Math.max(0, Math.min(product.stockQuantity, MAX_LINE_QUANTITY));
    const quantity = Math.min(line.q, maxQuantity);
    result.push({
      id: line.id,
      requested: line.q,
      quantity,
      maxQuantity,
      unitPriceCents: product.priceCents,
      lineTotalCents: quantity * product.priceCents,
      issue: maxQuantity === 0 ? "sold_out" : quantity < line.q ? "reduced" : null,
    });
  }
  return result;
}

export function subtotalCents(lines: Pick<ReconciledLine, "lineTotalCents">[]): number {
  return lines.reduce((sum, line) => sum + line.lineTotalCents, 0);
}

/** The lines worth keeping in the cookie after reconciliation. */
export function toStored(lines: ReconciledLine[]): StoredLine[] {
  return lines.filter((line) => line.quantity > 0).map((line) => ({ id: line.id, q: line.quantity }));
}

export type CartChange =
  | { type: "add"; id: string; quantity: number }
  | { type: "set"; id: string; quantity: number }
  | { type: "remove"; id: string };

export type ChangeResult = {
  lines: StoredLine[];
  /** Final quantity of the changed product (0 if not in the cart). */
  quantity: number;
  /** The requested quantity was cut down to available stock. */
  limited: boolean;
  /** The product is unavailable (sold out or no longer exists). */
  unavailable: boolean;
  /** The cart is full and a new product couldn't be added. */
  full: boolean;
};

/**
 * Applies one change against live stock and returns the new stored cart. Every other
 * line is also normalised against stock, so stale lines get corrected on any write.
 * `products` must contain every id in `lines` plus `change.id`, as far as they exist.
 */
export function applyChange(
  lines: StoredLine[],
  change: CartChange,
  products: ReadonlyMap<string, StockInfo>,
): ChangeResult {
  const id = change.id.toLowerCase();
  const existing = lines.find((line) => line.id === id)?.q ?? 0;
  const product = products.get(id);
  const max = product ? Math.max(0, Math.min(product.stockQuantity, MAX_LINE_QUANTITY)) : 0;

  const wanted =
    change.type === "remove" ? 0 : change.type === "add" ? existing + change.quantity : change.quantity;
  const target = Math.min(wanted, max);

  const others = toStored(reconcile(lines.filter((line) => line.id !== id), products));
  const isNew = existing === 0;
  const full = target > 0 && isNew && others.length >= MAX_LINES;
  const finalQuantity = full ? 0 : target;

  // Keep the shopper's line order; a new product goes at the end.
  const normalised = new Map(others.map((line) => [line.id, line.q]));
  const next: StoredLine[] = [];
  for (const line of lines) {
    const q = line.id === id ? finalQuantity : normalised.get(line.id);
    if (q) next.push({ id: line.id, q });
  }
  if (isNew && finalQuantity > 0) next.push({ id, q: finalQuantity });

  return {
    lines: next,
    quantity: finalQuantity,
    limited: wanted > max && max > 0,
    unavailable: change.type !== "remove" && max === 0,
    full,
  };
}
