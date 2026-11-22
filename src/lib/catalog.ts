// Catalogue queries for the storefront. The only place pages and components read
// products and categories from the database.

import { sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { categories, type Image } from "@/db/catalog";

export type { Image };
export { formatPrice } from "@/lib/format";

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

export type LiveProduct = Product & { priceCents: number; stockQuantity: number };

/**
 * Products by id, read fresh from the database. Deliberately NOT cached: the cart
 * validates quantities and prices against these, so they must reflect current stock
 * and pricing. Request-time data, so callers sit inside <Suspense> or a server action.
 */
export async function getLiveProducts(ids: string[]): Promise<Map<string, LiveProduct>> {
  if (ids.length === 0) return new Map();
  const rows = await db.query.products.findMany({
    where: (p, { inArray }) => inArray(p.id, ids),
    with: { category: true },
  });
  return new Map(
    rows.map((row) => [
      row.id,
      { ...toProduct(row), priceCents: row.priceCents, stockQuantity: row.stockQuantity },
    ]),
  );
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

export type CategorySummary = Category & { productCount: number };

/**
 * Categories that have products, in rail order. Categories without their own image
 * use their newest product's image.
 */
export async function getCategorySummaries(): Promise<CategorySummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const rows = await db.query.categories.findMany({
    orderBy: (c, { asc }) => [asc(c.sortOrder), asc(c.name)],
    with: {
      products: {
        columns: { image: true },
        orderBy: (p, { desc }) => [desc(p.createdAt)],
        limit: 1,
      },
    },
    // Relational queries re-alias interpolated columns to the root table, so the
    // subquery's own columns are written out literally.
    extras: (c) => ({
      productCount: sql<number>`(select count(*)::int from "products" p where p."category_id" = ${c.id})`.as(
        "product_count",
      ),
    }),
  });
  return rows
    .filter((row) => row.productCount > 0)
    .map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      href: categoryHref(row.slug),
      image: row.image ?? row.products[0].image,
      productCount: row.productCount,
    }));
}

export async function getCategorySlugs() {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const rows = await db.query.categories.findMany({ columns: { slug: true } });
  return rows.map((row) => row.slug);
}

export async function getCategoryBySlug(slug: string): Promise<CategoryRef | undefined> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const row = await db.query.categories.findFirst({
    where: (c, { eq }) => eq(c.slug, slug),
    columns: { id: true, slug: true, name: true },
  });
  return row && { id: row.id, name: row.name, href: categoryHref(row.slug) };
}

/** Newest first. */
export async function getProductsByCategory(categoryId: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const rows = await db.query.products.findMany({
    where: (p, { eq }) => eq(p.categoryId, categoryId),
    with: { category: true },
    orderBy: (p, { desc }) => [desc(p.createdAt)],
  });
  return rows.map(toProduct);
}

/** Longest query `searchProducts` accepts; anything beyond it is ignored. */
export const SEARCH_QUERY_MAX = 100;
const SEARCH_LIMIT = 48;

/** Escapes LIKE wildcards so user input only ever matches literally. */
function likePattern(term: string) {
  return `%${term.replace(/[\\%_]/g, "\\$&")}%`;
}

/**
 * Products where every word of `query` appears in the name, description, SKU or
 * category name. Name matches rank first, then newest.
 */
export async function searchProducts(query: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);

  const terms = query.slice(0, SEARCH_QUERY_MAX).toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  const rows = await db.query.products.findMany({
    where: (p, { and, or, ilike, inArray }) =>
      and(
        ...terms.map((term) =>
          or(
            ilike(p.name, likePattern(term)),
            ilike(p.description, likePattern(term)),
            ilike(p.sku, likePattern(term)),
            inArray(
              p.categoryId,
              db
                .select({ id: categories.id })
                .from(categories)
                .where(ilike(categories.name, likePattern(term))),
            ),
          ),
        ),
      ),
    with: { category: true },
    orderBy: (p, { desc }) => [
      desc(sql`${p.name} ilike ${likePattern(terms.join(" "))}`),
      desc(p.createdAt),
    ],
    limit: SEARCH_LIMIT,
  });
  return rows.map(toProduct);
}
