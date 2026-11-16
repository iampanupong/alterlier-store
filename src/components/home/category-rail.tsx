import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/section-heading";
import { getRailCategories } from "@/lib/catalog";

export async function CategoryRail() {
  const categories = await getRailCategories();

  return (
    <section aria-labelledby="categories-title" className="section">
      <SectionHeading id="categories-title" eyebrow="Explore" title="Shop by Category" />
      <ul className="scroll-row gap-3 scroll-px-gutter px-gutter pb-2 lg:gap-4">
        {categories.map((category) => (
          <li key={category.id} className="w-[68vw] sm:w-[40vw] lg:w-[calc((100%-3*1rem)/4.4)]">
            <Link href={category.href} className="group block">
              <div className="media media-portrait">
                <Image
                  src={category.image.src}
                  alt={category.image.alt}
                  fill
                  sizes="(min-width: 64rem) 23vw, (min-width: 40rem) 40vw, 68vw"
                  className="transition-transform duration-[1200ms] ease-luxe group-hover:scale-[1.03]"
                />
              </div>
              <p className="link-quiet mt-4 inline-block text-label uppercase group-hover:decoration-current">
                {category.name}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
