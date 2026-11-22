import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/section-heading";
import { featuredCollections } from "@/lib/sample-data";

export function FeaturedCollections() {
  return (
    <section aria-labelledby="collections-title" className="section bg-surface">
      <SectionHeading
        id="collections-title"
        eyebrow="Featured"
        title="Collections"
        action={{ label: "All collections", href: "/collections" }}
      />
      <ul className="container-page grid-cards">
        {featuredCollections.map((collection) => (
          <li key={collection.id}>
            <Link href={collection.href} className="group block">
              <div className="media media-portrait">
                <Image
                  src={collection.image.src}
                  alt={collection.image.alt}
                  fill
                  sizes="(min-width: 64rem) 30vw, (min-width: 40rem) 45vw, 100vw"
                  className="media-zoom"
                />
              </div>
              <h3 className="mt-5 text-title">{collection.name}</h3>
              <p className="mt-1 text-caption text-muted">{collection.description}</p>
              <span className="link mt-4 inline-block text-label uppercase">Discover</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
