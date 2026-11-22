/** Hairline-ruled term/value list used across account pages. */
export function DetailList({ items }: { items: { term: string; value: React.ReactNode }[] }) {
  return (
    <dl className="divide-y divide-line border-y border-line">
      {items.map((item) => (
        <div
          key={item.term}
          className="grid gap-1 py-4 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4"
        >
          <dt className="eyebrow text-muted">{item.term}</dt>
          <dd className="text-body break-words">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Placeholder rows while the session streams in. */
export function DetailListFallback({ rows = 3 }: { rows?: number }) {
  return (
    <div aria-hidden="true" className="divide-y divide-line border-y border-line">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="py-4">
          <div className="h-5 w-2/3 bg-surface-strong" />
        </div>
      ))}
    </div>
  );
}

export const memberSince = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" });
