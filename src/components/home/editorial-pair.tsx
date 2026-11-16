import Image from "next/image";
import Link from "next/link";
import { editorialPair, intro } from "@/lib/sample-data";

export function EditorialPair() {
  return (
    <section aria-label="Shop women and men">
      <p className="container-prose section text-center text-body">{intro}</p>

      <div className="grid-editorial">
        {editorialPair.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="group media media-portrait relative block"
          >
            <Image
              src={item.image.src}
              alt={item.image.alt}
              fill
              sizes="(min-width: 48rem) 50vw, 100vw"
              className="transition-transform duration-[1200ms] ease-luxe group-hover:scale-[1.03]"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/55 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-4 p-8 text-center text-white lg:p-12">
              <h2 className="text-display">{item.name}</h2>
              <p className="text-caption">{item.description}</p>
              <span className="link eyebrow">Shop {item.name}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
