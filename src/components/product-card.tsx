import Image from "next/image";
import Link from "next/link";
import { SaveButton } from "@/components/save-button";
import { formatPrice, type Product } from "@/lib/catalog";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group relative flex flex-col">
      <div className="media media-square">
        <Image
          src={product.image.src}
          alt={product.image.alt}
          fill
          sizes="(min-width: 64rem) 25vw, (min-width: 48rem) 33vw, 50vw"
          className="media-zoom"
        />
        {product.badge && (
          <span className="absolute top-3 left-3 bg-paper px-2 py-1 text-caption">
            {product.badge}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 px-3 pt-4 pb-6 sm:px-4">
        <p className="text-caption text-muted">{product.category.name}</p>
        <h3 className="text-title">
          <Link href={product.href} className="after:absolute after:inset-0">
            {product.name}
          </Link>
        </h3>
        <p className="text-caption">
          {formatPrice(product.price)}
          {/* Same wording as StockStatus on the product page. */}
          {product.stock.status === "out_of_stock" && (
            <span className="text-muted"> · Sold out</span>
          )}
          {product.stock.status === "low_stock" && (
            <span className="font-bold"> · Only {product.stock.quantity} left</span>
          )}
        </p>
      </div>

      {/* Sits above the card-wide link overlay so it stays independently clickable. */}
      <SaveButton productName={product.name} className="btn-icon absolute top-1 right-1 z-10" />
    </article>
  );
}
