"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { Image as ImageData } from "@/lib/catalog";

/**
 * Mobile: full-width swipe carousel with a position indicator.
 * Desktop: images stacked edge to edge beside the sticky info panel.
 */
export function ProductGallery({ images }: { images: ImageData[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  return (
    <div className="relative">
      <div
        ref={trackRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          setActive(Math.round(el.scrollLeft / el.clientWidth));
        }}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] lg:flex-col lg:gap-px lg:overflow-visible [&::-webkit-scrollbar]:hidden"
        aria-label="Product images"
        role="region"
        tabIndex={0}
      >
        {images.map((image, i) => (
          <div
            key={`${image.src}-${i}`}
            className="media aspect-[4/5] w-full flex-none snap-start"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${images.length}`}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              preload={i === 0}
              sizes="(min-width: 64rem) 58vw, 100vw"
              style={
                image.focus
                  ? {
                      objectPosition: image.focus,
                      transformOrigin: image.focus,
                      transform: "scale(1.8)",
                    }
                  : undefined
              }
            />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center gap-1.5 lg:hidden"
        >
          {images.map((image, i) => (
            <span
              key={`${image.src}-${i}`}
              className={`h-px w-6 transition-colors duration-300 ${
                i === active ? "bg-ink" : "bg-ink/25"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
