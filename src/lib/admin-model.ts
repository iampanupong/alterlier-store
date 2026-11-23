// Pure validation for admin forms: no Next.js or database imports, so it's unit-tested
// directly (admin-model.test.ts). Server actions run every submission through these;
// nothing from the form reaches the database without passing here first.

import type { Image } from "@/db/catalog";
import { isUuid } from "@/lib/order-model";

export const BADGES = ["New", "Limited"] as const;
export type Badge = (typeof BADGES)[number];

export const LIMITS = {
  name: 120,
  slug: 100,
  sku: 40,
  description: 4000,
  detail: 200,
  details: 20,
  alt: 200,
  url: 2048,
  gallery: 12,
  /** $9,999,999.99: fits the int4 `price_cents` column with room to spare. */
  priceCents: 999_999_999,
  stock: 100_000,
  threshold: 1_000,
} as const;

/** Fields shared by create and edit. Stock isn't one: it has its own guarded update. */
export type ProductInput = {
  name: string;
  slug: string;
  sku: string;
  categoryId: string;
  priceCents: number;
  description: string;
  details: string[];
  badge: Badge | null;
  image: Image;
  gallery: Image[];
  lowStockThreshold: number;
};

export type NewProductInput = ProductInput & { stockQuantity: number };

/** Form control names, in on-screen order (used to focus the first error). */
export const PRODUCT_FIELDS = [
  "name",
  "slug",
  "sku",
  "categoryId",
  "price",
  "badge",
  "description",
  "details",
  "imageSrc",
  "imageAlt",
  "gallery",
  "stockQuantity",
  "lowStockThreshold",
] as const;

export type ProductField = (typeof PRODUCT_FIELDS)[number];
export type FieldErrors<F extends string = ProductField> = Partial<Record<F, string>>;

export type Parsed<T, F extends string = ProductField> =
  | { ok: true; value: T }
  | { ok: false; fieldErrors: FieldErrors<F> };

type Source = Pick<FormData, "get">;

/** Trimmed string value; files and missing fields read as "". */
export function text(form: Source, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SKU = /^[A-Z0-9][A-Z0-9-]*$/;
const PRICE = /^(\d{1,7})(?:\.(\d{1,2}))?$/;
const INTEGER = /^\d{1,7}$/;

/** "49", "49.5", "49.50", "1,250.00" → cents. String maths only: no float rounding. */
export function parsePriceCents(raw: string): number | null {
  const match = PRICE.exec(raw.replace(/[$,\s]/g, ""));
  if (!match) return null;
  const cents = Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
  return cents <= LIMITS.priceCents ? cents : null;
}

/** Whole number in [min, max], or null. */
export function parseInteger(raw: string, min: number, max: number): number | null {
  if (!INTEGER.test(raw)) return null;
  const value = Number(raw);
  return value >= min && value <= max ? value : null;
}

/** Lowercase, hyphenated slug from a name: "Silk Midi Dress" → "silk-midi-dress". */
export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, LIMITS.slug)
    .replace(/-+$/, "");
}

/**
 * https URL, or null. Unsplash URLs are stored bare (no query) because the image
 * loader adds its own sizing parameters.
 */
export function parseImageUrl(raw: string): string | null {
  if (!raw || raw.length > LIMITS.url) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password) return null;
  if (url.hostname === "images.unsplash.com") return `${url.origin}${url.pathname}`;
  return url.toString();
}

/** CSS object-position as two percentages, e.g. "45% 40%" (a zoomed detail crop). */
const FOCUS = /^(?:100|\d{1,2})% (?:100|\d{1,2})%$/;

/** One image per line as `url | alt text`, optionally `| 45% 40%` for a detail crop. */
export function parseGallery(raw: string): Image[] | string {
  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length > LIMITS.gallery) return `Up to ${LIMITS.gallery} gallery images.`;
  const images: Image[] = [];
  for (const [index, line] of lines.entries()) {
    const [srcRaw, altRaw = "", focusRaw, ...extra] = line.split("|").map((part) => part.trim());
    const src = parseImageUrl(srcRaw);
    const at = `Line ${index + 1}:`;
    if (!src) return `${at} enter an https image URL.`;
    if (!altRaw) return `${at} add alt text after a “|”.`;
    if (altRaw.length > LIMITS.alt) return `${at} alt text is too long.`;
    if (extra.length > 0) return `${at} use “URL | alt text”, optionally “| 45% 40%”.`;
    if (focusRaw !== undefined && !FOCUS.test(focusRaw)) {
      return `${at} write the crop focus as two percentages, like 45% 40%.`;
    }
    images.push(focusRaw ? { src, alt: altRaw, focus: focusRaw } : { src, alt: altRaw });
  }
  return images;
}

export function galleryText(gallery: Image[]) {
  return gallery
    .map((image) => [image.src, image.alt, image.focus].filter(Boolean).join(" | "))
    .join("\n");
}

/** Product fields shared by create and edit. */
export function parseProductForm(form: Source): Parsed<ProductInput> {
  const errors: FieldErrors = {};

  const name = text(form, "name");
  if (!name) errors.name = "Enter a name.";
  else if (name.length > LIMITS.name) errors.name = `Use ${LIMITS.name} characters or fewer.`;

  const slug = text(form, "slug").toLowerCase();
  if (!slug) errors.slug = "Enter a URL slug.";
  else if (slug.length > LIMITS.slug || !SLUG.test(slug)) {
    errors.slug = "Use lowercase letters, numbers and single hyphens.";
  }

  const sku = text(form, "sku").toUpperCase();
  if (!sku) errors.sku = "Enter a SKU.";
  else if (sku.length > LIMITS.sku || !SKU.test(sku)) {
    errors.sku = "Use letters, numbers and hyphens.";
  }

  const categoryId = text(form, "categoryId");
  if (!isUuid(categoryId)) errors.categoryId = "Choose a category.";

  const priceRaw = text(form, "price");
  const priceCents = parsePriceCents(priceRaw);
  if (!priceRaw) errors.price = "Enter a price.";
  else if (priceCents === null) errors.price = "Enter a price like 1250 or 1250.00.";

  const badgeRaw = text(form, "badge");
  const badge = BADGES.find((b) => b === badgeRaw) ?? null;
  if (badgeRaw && !badge) errors.badge = "Choose a badge from the list.";

  const description = text(form, "description");
  if (!description) errors.description = "Enter a description.";
  else if (description.length > LIMITS.description) {
    errors.description = `Use ${LIMITS.description} characters or fewer.`;
  }

  const details = text(form, "details")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (details.length > LIMITS.details) errors.details = `Up to ${LIMITS.details} lines.`;
  else if (details.some((line) => line.length > LIMITS.detail)) {
    errors.details = `Keep each line to ${LIMITS.detail} characters.`;
  }

  const imageSrc = parseImageUrl(text(form, "imageSrc"));
  if (!imageSrc) errors.imageSrc = "Enter an https image URL.";

  const imageAlt = text(form, "imageAlt");
  if (!imageAlt) errors.imageAlt = "Describe the image for screen readers.";
  else if (imageAlt.length > LIMITS.alt) errors.imageAlt = `Use ${LIMITS.alt} characters or fewer.`;

  const gallery = parseGallery(text(form, "gallery"));
  if (typeof gallery === "string") errors.gallery = gallery;

  const lowStockThreshold = parseInteger(text(form, "lowStockThreshold"), 0, LIMITS.threshold);
  if (lowStockThreshold === null) {
    errors.lowStockThreshold = `Enter a whole number from 0 to ${LIMITS.threshold}.`;
  }

  if (Object.keys(errors).length > 0) return { ok: false, fieldErrors: errors };
  return {
    ok: true,
    value: {
      name,
      slug,
      sku,
      categoryId,
      priceCents: priceCents!,
      description,
      details,
      badge,
      image: { src: imageSrc!, alt: imageAlt },
      gallery: gallery as Image[],
      lowStockThreshold: lowStockThreshold!,
    },
  };
}

/** Create form: the shared fields plus the opening stock level. */
export function parseNewProductForm(form: Source): Parsed<NewProductInput> {
  const base = parseProductForm(form);
  const stockQuantity = parseInteger(text(form, "stockQuantity"), 0, LIMITS.stock);
  const stockError =
    stockQuantity === null ? `Enter a whole number from 0 to ${LIMITS.stock}.` : undefined;

  if (!base.ok || stockError) {
    return {
      ok: false,
      fieldErrors: { ...(base.ok ? {} : base.fieldErrors), ...(stockError ? { stockQuantity: stockError } : {}) },
    };
  }
  return { ok: true, value: { ...base.value, stockQuantity: stockQuantity! } };
}

export type StockField = "quantity";
export type StockInput = { productId: string; expected: number; quantity: number };

/**
 * Stock update: the new quantity plus the quantity the admin was looking at
 * (`expected`), so a concurrent checkout reservation isn't silently overwritten.
 */
export function parseStockForm(form: Source): Parsed<StockInput, StockField> | { ok: false; invalid: true } {
  const productId = text(form, "productId");
  const expected = parseInteger(text(form, "expected"), 0, Number.MAX_SAFE_INTEGER);
  if (!isUuid(productId) || expected === null) return { ok: false, invalid: true };

  const quantity = parseInteger(text(form, "quantity"), 0, LIMITS.stock);
  if (quantity === null) {
    return { ok: false, fieldErrors: { quantity: `Enter a whole number from 0 to ${LIMITS.stock}.` } };
  }
  return { ok: true, value: { productId, expected, quantity } };
}

export type AdjustStockField = "amount";
export type AdjustStockInput = { productId: string; delta: number };

/**
 * Relative stock change ("received 5", "remove 2"): a positive amount plus a direction,
 * turned into a signed delta. Relative changes compose with concurrent checkout
 * reservations, so no `expected` value is needed. The resulting quantity is bounds-
 * checked in SQL (adjustStock), not here.
 */
export function parseAdjustStockForm(
  form: Source,
): Parsed<AdjustStockInput, AdjustStockField> | { ok: false; invalid: true } {
  const productId = text(form, "productId");
  const op = text(form, "op");
  if (!isUuid(productId) || (op !== "add" && op !== "remove")) return { ok: false, invalid: true };

  const amount = parseInteger(text(form, "amount"), 1, LIMITS.stock);
  if (amount === null) {
    return { ok: false, fieldErrors: { amount: `Enter a whole number from 1 to ${LIMITS.stock}.` } };
  }
  return { ok: true, value: { productId, delta: op === "add" ? amount : -amount } };
}
