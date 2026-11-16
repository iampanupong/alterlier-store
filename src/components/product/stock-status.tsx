import type { StockState } from "@/lib/catalog";

const COPY = {
  in_stock: { label: "In stock", note: "Ships in 1–2 business days", dot: "bg-success" },
  low_stock: { label: "", note: "Ships in 1–2 business days", dot: "bg-warning" },
  out_of_stock: { label: "Sold out", note: "Currently unavailable online", dot: "bg-subtle" },
} as const;

export function StockStatus({ stock }: { stock: StockState }) {
  const copy = COPY[stock.status];
  const label = stock.status === "low_stock" ? `Only ${stock.quantity} left` : copy.label;

  return (
    <p className="flex items-center gap-2 text-caption">
      <span aria-hidden="true" className={`size-1.5 rounded-full ${copy.dot}`} />
      <span className="font-bold">{label}</span>
      <span className="text-muted">· {copy.note}</span>
    </p>
  );
}
