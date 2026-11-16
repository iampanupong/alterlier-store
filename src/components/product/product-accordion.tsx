import type { ReactNode } from "react";

type Section = {
  title: string;
  content: ReactNode;
  defaultOpen?: boolean;
};

/** Native <details> disclosure list separated by hairlines. */
export function ProductAccordion({ sections }: { sections: Section[] }) {
  return (
    <div className="border-t border-line">
      {sections.map((section) => (
        <details
          key={section.title}
          open={section.defaultOpen}
          className="group border-b border-line"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between py-5 eyebrow [&::-webkit-details-marker]:hidden">
            {section.title}
            <span
              aria-hidden="true"
              className="text-lg leading-none font-light transition-transform duration-300 ease-luxe group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <div className="pb-6 text-body text-muted">{section.content}</div>
        </details>
      ))}
    </div>
  );
}
