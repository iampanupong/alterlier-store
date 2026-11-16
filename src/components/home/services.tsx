import Link from "next/link";
import { services } from "@/lib/sample-data";

export function Services() {
  return (
    <section aria-labelledby="services-title" className="section border-t border-line">
      <h2 id="services-title" className="container-page eyebrow pb-10 text-center">
        Client services
      </h2>
      <ul className="container-page grid-cards gap-y-10 text-center">
        {services.map((service) => (
          <li key={service.id} className="flex flex-col items-center gap-3 px-4">
            <h3 className="text-title">{service.title}</h3>
            <p className="max-w-xs text-caption text-muted">{service.body}</p>
            <Link href={service.href} className="link mt-1 text-caption">
              Learn more
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
