import Link from "next/link";

type SectionHeadingProps = {
  id: string;
  eyebrow: string;
  title: string;
  action?: { label: string; href: string };
  /** Use "h1" when the heading titles the page rather than a section. */
  as?: "h1" | "h2";
};

export function SectionHeading({ id, eyebrow, title, action, as: Heading = "h2" }: SectionHeadingProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 px-gutter pb-8 lg:pb-12">
      <div>
        <p className="eyebrow text-muted">{eyebrow}</p>
        <Heading id={id} className="mt-2 text-display">
          {title}
        </Heading>
      </div>
      {action && (
        <Link href={action.href} className="link text-label uppercase">
          {action.label}
        </Link>
      )}
    </div>
  );
}
