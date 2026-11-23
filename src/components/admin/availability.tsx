import type { StockState } from "@/lib/catalog";

const COPY = {
  in_stock: { label: "In stock", dot: "bg-success" },
  low_stock: { label: "Low stock", dot: "bg-warning" },
  out_of_stock: { label: "Sold out", dot: "bg-subtle" },
} as const;

/** Availability as shoppers see it, derived from stock and the low-stock threshold. */
export function Availability({ stock }: { stock: StockState }) {
  const copy = COPY[stock.status];
  return (
    <span className="inline-flex items-center gap-2 text-caption whitespace-nowrap">
      <span aria-hidden="true" className={`size-1.5 shrink-0 rounded-full ${copy.dot}`} />
      <span className="font-bold">{copy.label}</span>
    </span>
  );
}
