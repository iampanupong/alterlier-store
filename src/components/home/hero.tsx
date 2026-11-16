import Image from "next/image";
import Link from "next/link";
import { hero } from "@/lib/sample-data";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="media media-hero relative">
      <Image
        src={hero.image.src}
        alt={hero.image.alt}
        fill
        preload
        sizes="100vw"
      />
      {/* Top and bottom scrims keep the floating header and copy legible. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b from-black/45 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-black/60 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 px-gutter pb-12 text-white lg:pb-16">
        <p className="eyebrow">{hero.eyebrow}</p>
        <h1 id="hero-title" className="mt-3 max-w-3xl text-display-lg text-balance">
          {hero.title}
        </h1>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={hero.href} className="btn btn-on-media">
            Discover the collection
          </Link>
        </div>
      </div>
    </section>
  );
}
