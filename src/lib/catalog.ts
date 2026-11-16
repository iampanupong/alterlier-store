// Catalogue queries for the storefront. The only place pages and components read
// products and categories from the database.

import { sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import type { Image } from "@/db/catalog";

export type { Image };

export type StockState =
  | { status: "in_stock" }
  | { status: "low_stock"; quantity: number }
  | { status: "out_of_stock" };

export type CategoryRef = {
  id: string;
  name: string;
  href: string;
};

export type Category = CategoryRef & {
  slug: string;
  image: Image;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  href: string;
  sku: string;
  price: number;
  category: CategoryRef;
  /** Primary image, used on cards and as the first gallery image. */
  image: Image;
  /** Additional images shown on the product page after `image`. */
  gallery: Image[];
  description: string;
  details: string[];
  stock: StockState;
  badge: "New" | "Limited" | null;
};

/** Invalidate with `revalidateTag(CATALOG_TAG)` after writing catalogue data. */
export const CATALOG_TAG = "catalog";

type ProductRow = NonNullable<Awaited<ReturnType<typeof findProduct>>>;

function findProduct(slug: string) {
  return db.query.products.findFirst({
    where: (p, { eq }) => eq(p.slug, slug),
    with: { category: true },
  });
}

function categoryHref(slug: string) {
  return `/categories/${slug}`;
}

function toStockState(quantity: number, lowStockThreshold: number): StockState {
  if (quantity <= 0) return { status: "out_of_stock" };
  if (quantity <= lowStockThreshold) return { status: "low_stock", quantity };
  return { status: "in_stock" };
}

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    href: `/products/${row.slug}`,
    sku: row.sku,
    price: row.priceCents / 100,
    category: {
      id: row.category.id,
      name: row.category.name,
      href: categoryHref(row.category.slug),
    },
    image: row.image,
    gallery: row.gallery,
    description: row.description,
    details: row.details,
    stock: toStockState(row.stockQuantity, row.lowStockThreshold),
    badge: row.badge,
  };
}

export async function getProductSlugs() {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const rows = await db.query.products.findMany({ columns: { slug: true } });
  return rows.map((row) => row.slug);
}

export async function getProductBySlug(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const row = await findProduct(slug);
  return row ? toProduct(row) : undefined;
}

export async function getNewArrivals(limit = 8) {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const rows = await db.query.products.findMany({
    with: { category: true },
    orderBy: (p, { desc }) => [desc(p.createdAt)],
    limit,
  });
  return rows.map(toProduct);
}

/** Same-category products first, then the rest of the catalogue. */
export async function getRelatedProducts(productId: string, categoryId: string, limit = 4) {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const rows = await db.query.products.findMany({
    where: (p, { ne }) => ne(p.id, productId),
    with: { category: true },
    orderBy: (p, { desc }) => [desc(sql`${p.categoryId} = ${categoryId}`), desc(p.createdAt)],
    limit,
  });
  return rows.map(toProduct);
}

/** Categories that have an image, in rail order. */
export async function getRailCategories(): Promise<Category[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const rows = await db.query.categories.findMany({
    where: (c, { isNotNull }) => isNotNull(c.image),
    orderBy: (c, { asc }) => [asc(c.sortOrder), asc(c.name)],
  });
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    href: categoryHref(row.slug),
    image: row.image!,
  }));
}

const priceFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatPrice(amount: number) {
  return priceFormat.format(amount);
}
