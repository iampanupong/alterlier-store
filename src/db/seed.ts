// Loads the catalogue seed data. Idempotent: rows are upserted by slug. Stock and
// created_at are only set when a product is first inserted, so re-running never
// overwrites live inventory or reorders New Arrivals.
// Run with `pnpm db:seed` after `pnpm db:migrate`.

import "dotenv/config";
import { eq, sql } from "drizzle-orm";
import { db } from "./index";
import { categories, products } from "./catalog";
import { categories as seedCategories, products as seedProducts } from "./seed-data";

async function main() {
  const categoryRows = await db
    .insert(categories)
    .values(
      seedCategories.map((c, i) => ({
        slug: c.slug,
        name: c.name,
        image: c.image ?? null,
        sortOrder: i,
      })),
    )
    .onConflictDoUpdate({
      target: categories.slug,
      set: {
        name: sql`excluded.name`,
        image: sql`excluded.image`,
        sortOrder: sql`excluded.sort_order`,
        updatedAt: sql`now()`,
      },
    })
    .returning({ id: categories.id, slug: categories.slug });

  const categoryIds = new Map(categoryRows.map((row) => [row.slug, row.id]));

  // Newest first in seed-data, so stagger created_at backwards one minute per product.
  const now = Date.now();
  const productValues = seedProducts.map((p, i) => {
    const categoryId = categoryIds.get(p.category);
    if (!categoryId) throw new Error(`Unknown category "${p.category}" for ${p.slug}`);
    return {
      slug: p.slug,
      sku: p.sku,
      name: p.name,
      description: p.description,
      details: p.details,
      priceCents: p.priceCents,
      categoryId,
      badge: p.badge ?? null,
      image: p.image,
      gallery: p.gallery,
      stockQuantity: p.stockQuantity,
      createdAt: new Date(now - i * 60_000),
    };
  });

  // The upsert below matches on slug, so a product whose slug was renamed in
  // seed-data would collide with its own row on the unique sku. Move those rows
  // to the new slug first.
  const existing = await db.select({ slug: products.slug, sku: products.sku }).from(products);
  const slugBySku = new Map(existing.map((row) => [row.sku, row.slug]));
  const takenSlugs = new Set(existing.map((row) => row.slug));
  for (const p of productValues) {
    const currentSlug = slugBySku.get(p.sku);
    if (currentSlug && currentSlug !== p.slug && !takenSlugs.has(p.slug)) {
      await db.update(products).set({ slug: p.slug }).where(eq(products.sku, p.sku));
    }
  }

  await db
    .insert(products)
    .values(productValues)
    .onConflictDoUpdate({
      target: products.slug,
      set: {
        sku: sql`excluded.sku`,
        name: sql`excluded.name`,
        description: sql`excluded.description`,
        details: sql`excluded.details`,
        priceCents: sql`excluded.price_cents`,
        categoryId: sql`excluded.category_id`,
        badge: sql`excluded.badge`,
        image: sql`excluded.image`,
        gallery: sql`excluded.gallery`,
        updatedAt: sql`now()`,
      },
    });

  console.log(`Seeded ${categoryRows.length} categories and ${productValues.length} products.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
