import type { ImageLoaderProps } from "next/image";

// Global `next/image` loader (see `images.loaderFile` in next.config.ts).
// Unsplash images are resized by Unsplash's own CDN instead of the Next.js
// optimizer; everything else is served as-is.
export default function imageLoader({ src, width, quality }: ImageLoaderProps) {
  if (src.startsWith("https://images.unsplash.com/")) {
    const url = new URL(src);
    url.searchParams.set("auto", "format");
    url.searchParams.set("fit", "crop");
    url.searchParams.set("w", String(width));
    url.searchParams.set("q", String(quality ?? 75));
    return url.toString();
  }
  return `${src}${src.includes("?") ? "&" : "?"}w=${width}`;
}
