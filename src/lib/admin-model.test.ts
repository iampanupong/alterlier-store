import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  galleryText,
  LIMITS,
  parseGallery,
  parseImageUrl,
  parseInteger,
  parseNewProductForm,
  parsePriceCents,
  parseProductForm,
  parseStockForm,
  slugify,
} from "./admin-model";

const CATEGORY = "11111111-1111-4111-8111-111111111111";
const PRODUCT = "22222222-2222-4222-8222-222222222222";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

const VALID = {
  name: "  Structured Top-Handle Bag ",
  slug: "Structured-Top-Handle-Bag",
  sku: "na-bg-24101",
  categoryId: CATEGORY,
  price: "2,450.00",
  badge: "New",
  description: "Calf leather.",
  details: "Calf leather\n\n  Brass hardware  \n",
  imageSrc: "https://images.unsplash.com/photo-123?w=800&q=80",
  imageAlt: "A black bag",
  gallery: "https://images.unsplash.com/photo-456 | Clasp detail | 45% 40%",
  lowStockThreshold: "3",
  stockQuantity: "12",
};

describe("parsePriceCents", () => {
  test("parses dollars to integer cents without float rounding", () => {
    assert.equal(parsePriceCents("49"), 4900);
    assert.equal(parsePriceCents("49.5"), 4950);
    assert.equal(parsePriceCents("49.50"), 4950);
    assert.equal(parsePriceCents("0.29"), 29); // 0.29 * 100 is 28.999… as a float
    assert.equal(parsePriceCents("$1,250.10"), 125010);
    assert.equal(parsePriceCents("0"), 0);
    assert.equal(parsePriceCents("9999999.99"), LIMITS.priceCents);
  });

  test("rejects negatives, extra decimals, exponents and junk", () => {
    for (const raw of ["", "-1", "1.234", "1e3", "abc", "12.", ".5", "10000000", "NaN", "Infinity"]) {
      assert.equal(parsePriceCents(raw), null, raw);
    }
  });
});

describe("parseInteger", () => {
  test("accepts whole numbers in range only", () => {
    assert.equal(parseInteger("0", 0, 10), 0);
    assert.equal(parseInteger("10", 0, 10), 10);
    for (const raw of ["", "-1", "11", "1.5", "1e2", " 3", "0x10"]) {
      assert.equal(parseInteger(raw, 0, 10), null, raw);
    }
  });
});

describe("slugify", () => {
  test("makes a lowercase hyphenated slug", () => {
    assert.equal(slugify("Silk Midi Dress"), "silk-midi-dress");
    assert.equal(slugify("  Café — Crème & Co.  "), "cafe-creme-co");
    assert.equal(slugify("!!!"), "");
  });
});

describe("parseImageUrl", () => {
  test("requires https and strips Unsplash query parameters", () => {
    assert.equal(
      parseImageUrl("https://images.unsplash.com/photo-123?w=800&q=80"),
      "https://images.unsplash.com/photo-123",
    );
    assert.equal(parseImageUrl("https://cdn.example.com/a.jpg?v=2"), "https://cdn.example.com/a.jpg?v=2");
    for (const raw of ["http://example.com/a.jpg", "javascript:alert(1)", "data:image/png;base64,AA", "/a.jpg", "https://u:p@example.com/a.jpg", ""]) {
      assert.equal(parseImageUrl(raw), null, raw);
    }
  });
});

describe("parseGallery", () => {
  test("parses url | alt [| focus] lines and round-trips through galleryText", () => {
    const raw = "https://a.example/1.jpg | First\n\nhttps://a.example/2.jpg | Second | 45% 40%";
    const images = parseGallery(raw);
    assert.deepEqual(images, [
      { src: "https://a.example/1.jpg", alt: "First" },
      { src: "https://a.example/2.jpg", alt: "Second", focus: "45% 40%" },
    ]);
    assert.deepEqual(parseGallery(galleryText(images as never)), images);
    assert.deepEqual(parseGallery(""), []);
  });

  test("explains what's wrong with a line", () => {
    assert.match(parseGallery("https://a.example/1.jpg") as string, /Line 1: add alt text/);
    assert.match(parseGallery("ftp://a | x") as string, /Line 1: enter an https/);
    assert.match(parseGallery("https://a.example/1.jpg | x | left") as string, /two percentages/);
    assert.match(parseGallery("https://a.example/1.jpg | x | 1% 1% | y") as string, /optionally/);
    const tooMany = Array.from({ length: LIMITS.gallery + 1 }, () => "https://a.example/1.jpg | x").join("\n");
    assert.match(parseGallery(tooMany) as string, /Up to/);
  });
});

describe("parseProductForm", () => {
  test("normalises a valid submission", () => {
    const result = parseProductForm(form(VALID));
    assert.ok(result.ok);
    assert.deepEqual(result.value, {
      name: "Structured Top-Handle Bag",
      slug: "structured-top-handle-bag",
      sku: "NA-BG-24101",
      categoryId: CATEGORY,
      priceCents: 245000,
      description: "Calf leather.",
      details: ["Calf leather", "Brass hardware"],
      badge: "New",
      image: { src: "https://images.unsplash.com/photo-123", alt: "A black bag" },
      gallery: [{ src: "https://images.unsplash.com/photo-456", alt: "Clasp detail", focus: "45% 40%" }],
      lowStockThreshold: 3,
    });
  });

  test("ignores fields it doesn't know (no stock, no role, no id)", () => {
    const result = parseProductForm(form({ ...VALID, stockQuantity: "999", role: "admin", id: PRODUCT }));
    assert.ok(result.ok);
    assert.equal("stockQuantity" in result.value, false);
    assert.equal("id" in result.value, false);
  });

  test("reports every invalid field at once", () => {
    const result = parseProductForm(
      form({
        name: "",
        slug: "Bad Slug!",
        sku: "-x",
        categoryId: "not-a-uuid",
        price: "-5",
        badge: "Sale",
        description: "x".repeat(LIMITS.description + 1),
        details: Array.from({ length: LIMITS.details + 1 }, () => "x").join("\n"),
        imageSrc: "http://insecure.example/a.jpg",
        imageAlt: "",
        gallery: "nope",
        lowStockThreshold: "-1",
      }),
    );
    assert.equal(result.ok, false);
    assert.deepEqual(Object.keys(!result.ok ? result.fieldErrors : {}).sort(), [
      "badge",
      "categoryId",
      "description",
      "details",
      "gallery",
      "imageAlt",
      "imageSrc",
      "lowStockThreshold",
      "name",
      "price",
      "sku",
      "slug",
    ]);
  });

  test("an empty badge means none", () => {
    const result = parseProductForm(form({ ...VALID, badge: "" }));
    assert.ok(result.ok);
    assert.equal(result.value.badge, null);
  });
});

describe("parseNewProductForm", () => {
  test("adds the opening stock", () => {
    const result = parseNewProductForm(form(VALID));
    assert.ok(result.ok);
    assert.equal(result.value.stockQuantity, 12);
  });

  test("validates stock alongside the other fields", () => {
    const result = parseNewProductForm(form({ ...VALID, name: "", stockQuantity: "-3" }));
    assert.equal(result.ok, false);
    assert.deepEqual(Object.keys(!result.ok ? result.fieldErrors : {}).sort(), ["name", "stockQuantity"]);
  });
});

describe("parseStockForm", () => {
  test("accepts a product id, the quantity seen and the new quantity", () => {
    assert.deepEqual(parseStockForm(form({ productId: PRODUCT, expected: "4", quantity: "0" })), {
      ok: true,
      value: { productId: PRODUCT, expected: 4, quantity: 0 },
    });
  });

  test("tampered hidden fields are invalid, a bad quantity is a field error", () => {
    assert.deepEqual(parseStockForm(form({ productId: "x", expected: "4", quantity: "1" })), { ok: false, invalid: true });
    assert.deepEqual(parseStockForm(form({ productId: PRODUCT, expected: "", quantity: "1" })), { ok: false, invalid: true });
    for (const quantity of ["-1", "1.5", "", String(LIMITS.stock + 1)]) {
      const result = parseStockForm(form({ productId: PRODUCT, expected: "4", quantity }));
      assert.ok(!result.ok && "fieldErrors" in result, quantity);
    }
  });
});
