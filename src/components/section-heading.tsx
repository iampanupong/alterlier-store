import Link from "next/link";

type SectionHeadingProps = {
  id: string;
  eyebrow: string;
  title: string;
  action?: { label: string; href: string };
};

export function SectionHeading({ id, eyebrow, title, action }: SectionHeadingProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 px-gutter pb-8 lg:pb-12">
      <div>
        <p className="eyebrow text-muted">{eyebrow}</p>
        <h2 id={id} className="mt-2 text-display">
          {title}
        </h2>
      </div>
      {action && (
        <Link href={action.href} className="link text-label uppercase">
          {action.label}
        </Link>
      )}
    </div>
  );
}
