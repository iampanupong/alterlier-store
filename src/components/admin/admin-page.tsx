// Shared building blocks for admin pages (server components).

export function AdminHeading({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-6">
      <div>
        <h1 className="text-display">{title}</h1>
        {description ? <p className="mt-3 text-body text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex gap-3">{actions}</div> : null}
    </header>
  );
}

/** Suspense fallback for admin page content. */
export function AdminFallback() {
  return <div aria-hidden="true" className="h-10 w-40 bg-surface-strong" />;
}

/** Placeholder panel for sections whose content lands in a later step. */
export function AdminEmpty({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12 bg-surface p-6 sm:p-8">
      <h2 className="text-title">{title}</h2>
      <p className="mt-2 text-body text-muted">{children}</p>
    </section>
  );
}
