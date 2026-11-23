// Pure stock logic shared by the storefront and admin: no database or Next.js imports,
// so it's unit-tested directly (stock.test.ts). Availability is always derived from
// `stock_quantity` and `low_stock_threshold`, never stored.

export type StockState =
  | { status: "in_stock" }
  | { status: "low_stock"; quantity: number }
  | { status: "out_of_stock" };

/** Availability derived from stock (never stored). Shared by the storefront and admin. */
export function toStockState(quantity: number, lowStockThreshold: number): StockState {
  if (quantity <= 0) return { status: "out_of_stock" };
  if (quantity <= lowStockThreshold) return { status: "low_stock", quantity };
  return { status: "in_stock" };
}

// ---- Admin inventory view ---------------------------------------------------------

/** `?status=` values on /admin/inventory, in tab order. */
export const INVENTORY_FILTERS = ["all", "out", "low", "in"] as const;
export type InventoryFilter = (typeof INVENTORY_FILTERS)[number];

const FILTER_STATUS = {
  out: "out_of_stock",
  low: "low_stock",
  in: "in_stock",
} as const satisfies Record<Exclude<InventoryFilter, "all">, StockState["status"]>;

/** Unknown or missing values fall back to "all"; a bad URL is never an error. */
export function parseInventoryFilter(value: unknown): InventoryFilter {
  return typeof value === "string" && (INVENTORY_FILTERS as readonly string[]).includes(value)
    ? (value as InventoryFilter)
    : "all";
}

type StockRow = { name: string; stockQuantity: number; lowStockThreshold: number };

const ORDER: Record<StockState["status"], number> = { out_of_stock: 0, low_stock: 1, in_stock: 2 };

/**
 * Rows for one filter, most urgent first (sold out, then low, then in stock; then by
 * quantity and name), plus a count per filter for the tabs.
 */
export function inventoryView<T extends StockRow>(rows: T[], filter: InventoryFilter) {
  const withState = rows.map((row) => ({
    row,
    status: toStockState(row.stockQuantity, row.lowStockThreshold).status,
  }));

  const counts: Record<InventoryFilter, number> = { all: rows.length, out: 0, low: 0, in: 0 };
  for (const { status } of withState) {
    if (status === "out_of_stock") counts.out++;
    else if (status === "low_stock") counts.low++;
    else counts.in++;
  }

  const visible = withState
    .filter(({ status }) => filter === "all" || status === FILTER_STATUS[filter])
    .sort(
      (a, b) =>
        ORDER[a.status] - ORDER[b.status] ||
        a.row.stockQuantity - b.row.stockQuantity ||
        a.row.name.localeCompare(b.row.name),
    )
    .map(({ row }) => row);

  return { rows: visible, counts };
}
