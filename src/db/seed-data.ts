// Catalogue seed data, loaded into the database by `pnpm db:seed` (src/db/seed.ts).
// Products are listed newest first; the seed staggers `created_at` to keep this order.

import type { Image } from "./catalog";

export type SeedCategory = {
  slug: string;
  name: string;
  /** Categories with an image are shown in the homepage rail, in list order. */
  image?: Image;
};

export type SeedProduct = {
  slug: string;
  name: string;
  sku: string;
  priceCents: number;
  /** Category slug. */
  category: string;
  badge?: "New" | "Limited";
  image: Image;
  gallery: Image[];
  description: string;
  details: string[];
  stockQuantity: number;
};

/** Unsplash photo URL; sizing params are added by src/lib/image-loader.ts. */
function unsplash(id: string) {
  return `https://images.unsplash.com/photo-${id}`;
}

export const categories: SeedCategory[] = [
  {
    slug: "outerwear",
    name: "Outerwear",
    image: {
      src: unsplash("1539109136881-3be0616acf4b"),
      alt: "Woman in a pale blue coat in a city square",
    },
  },
  {
    slug: "bags",
    name: "Bags",
    image: {
      src: unsplash("1584917865442-de89df76afd3"),
      alt: "Red leather top-handle bag",
    },
  },
  {
    slug: "tailoring",
    name: "Tailoring",
    image: {
      src: unsplash("1507679799987-c73779587ccf"),
      alt: "Man buttoning a navy suit jacket",
    },
  },
  {
    slug: "dresses",
    name: "Dresses",
    image: {
      src: unsplash("1496747611176-843222e1e57c"),
      alt: "Woman in a floral wrap dress by the sea",
    },
  },
  {
    slug: "shoes",
    name: "Shoes",
    image: {
      src: unsplash("1543163521-1bf539c55dd2"),
      alt: "Floral print pumps",
    },
  },
  {
    slug: "accessories",
    name: "Accessories",
    image: {
      src: unsplash("1511499767150-a48a237f0083"),
      alt: "Round metal-frame sunglasses",
    },
  },
  { slug: "knitwear", name: "Knitwear" },
  { slug: "jewelry", name: "Jewelry" },
  { slug: "watches", name: "Watches" },
  { slug: "eyewear", name: "Eyewear" },
];

export const products: SeedProduct[] = [
  {
    slug: "structured-top-handle-bag",
    name: "Structured top-handle bag",
    sku: "NA-BG-24101",
    priceCents: 245000,
    category: "bags",
    badge: "New",
    image: {
      src: unsplash("1584917865442-de89df76afd3"),
      alt: "Red leather top-handle bag in a shop window",
    },
    gallery: [
      {
        src: unsplash("1584917865442-de89df76afd3"),
        alt: "Detail of the polished metal clasp on the red bag",
        focus: "50% 48%",
      },
      {
        src: unsplash("1584917865442-de89df76afd3"),
        alt: "Detail of the rolled leather top handle",
        focus: "50% 22%",
      },
    ],
    description:
      "A compact, architectural top-handle bag cut from smooth calf leather and closed with a polished turn-lock. Sized for the essentials, with a detachable strap for wearing on the shoulder.",
    details: [
      "Smooth calf leather",
      "Polished palladium-finish hardware",
      "Detachable, adjustable shoulder strap",
      "Suede-lined interior with one flat pocket",
      "W 24 × H 19 × D 11 cm",
      "Made in Italy",
    ],
    stockQuantity: 12,
  },
  {
    slug: "floral-print-satin-pump",
    name: "Floral print satin pump",
    sku: "NA-SH-24233",
    priceCents: 89000,
    category: "shoes",
    badge: "New",
    image: {
      src: unsplash("1543163521-1bf539c55dd2"),
      alt: "Pair of floral print pumps on a white plinth",
    },
    gallery: [
      {
        src: unsplash("1543163521-1bf539c55dd2"),
        alt: "Detail of the floral print and pointed toe",
        focus: "40% 72%",
      },
    ],
    description:
      "A pointed pump in printed duchess satin, balanced on a slender 95 mm heel. The botanical print is engineered so each pair is slightly different.",
    details: [
      "Printed silk-blend satin upper",
      "Leather lining and sole",
      "95 mm stiletto heel",
      "Fits true to size",
      "Made in Italy",
    ],
    stockQuantity: 3,
  },
  {
    slug: "leather-strap-dress-watch",
    name: "Leather-strap dress watch",
    sku: "NA-WT-24310",
    priceCents: 165000,
    category: "watches",
    image: {
      src: unsplash("1524592094714-0f0654e20314"),
      alt: "Hand holding a watch with a white dial and brown leather strap",
    },
    gallery: [
      {
        src: unsplash("1556905055-8f358a7a47b2"),
        alt: "The watch styled with a grey knit, a rust beanie and denim",
      },
      {
        src: unsplash("1507679799987-c73779587ccf"),
        alt: "Man fastening a navy suit jacket, a watch at his wrist",
      },
    ],
    description:
      "A slim, quiet dress watch with a lacquered white dial, rose-tone baton indices and a hand-stitched leather strap that softens with wear.",
    details: [
      "38 mm stainless steel case",
      "Swiss quartz movement",
      "Sapphire crystal",
      "Hand-stitched calf leather strap",
      "Water resistant to 30 m",
    ],
    stockQuantity: 8,
  },
  {
    slug: "round-metal-sunglasses",
    name: "Round metal sunglasses",
    sku: "NA-EY-24402",
    priceCents: 46000,
    category: "eyewear",
    badge: "Limited",
    image: {
      src: unsplash("1511499767150-a48a237f0083"),
      alt: "Round metal-frame sunglasses with green lenses",
    },
    gallery: [
      {
        src: unsplash("1511499767150-a48a237f0083"),
        alt: "Detail of the fine gold-tone bridge",
        focus: "50% 45%",
      },
    ],
    description:
      "Featherweight round sunglasses in a fine gold-tone frame with bottle-green mineral lenses. Produced in a numbered edition of 300.",
    details: [
      "Gold-tone titanium frame",
      "Green mineral glass lenses, 100% UV protection",
      "Adjustable nose pads",
      "Comes with a leather case",
      "Made in Japan",
    ],
    stockQuantity: 0,
  },
  {
    slug: "chevron-leather-crossbody",
    name: "Chevron leather crossbody",
    sku: "NA-BG-24118",
    priceCents: 138000,
    category: "bags",
    image: {
      src: unsplash("1566150905458-1bf1fc113f0d"),
      alt: "Pink leather crossbody bag with a chevron panel on a white block",
    },
    gallery: [
      {
        src: unsplash("1539109136881-3be0616acf4b"),
        alt: "Woman in a pale blue coat wearing a pink crossbody bag",
      },
      {
        src: unsplash("1566150905458-1bf1fc113f0d"),
        alt: "Detail of the tonal chevron panel",
        focus: "45% 40%",
      },
    ],
    description:
      "A small crossbody in powder-pink leather, finished with a tonal chevron panel and a slim chain strap long enough to wear across the body.",
    details: [
      "Grained calf leather",
      "Light gold-tone chain strap, 110 cm drop",
      "Magnetic flap closure",
      "W 20 × H 13 × D 6 cm",
      "Made in Italy",
    ],
    stockQuantity: 15,
  },
  {
    slug: "satin-bomber-jacket",
    name: "Satin bomber jacket",
    sku: "NA-OW-24507",
    priceCents: 189000,
    category: "outerwear",
    image: {
      src: unsplash("1591047139829-d91aecb6caea"),
      alt: "Copper satin bomber jacket held up on a hanger",
    },
    gallery: [
      {
        src: unsplash("1591047139829-d91aecb6caea"),
        alt: "Detail of the ribbed collar and zip",
        focus: "48% 32%",
      },
    ],
    description:
      "A relaxed bomber in liquid copper satin with a lightly padded body, ribbed trims and a two-way zip. Lined in silk for an easy layer over knitwear.",
    details: [
      "Shell: 100% polyamide satin",
      "Lining: 100% silk",
      "Two-way metal zip",
      "Ribbed collar, cuffs and hem",
      "Relaxed fit; take your usual size",
    ],
    stockQuantity: 2,
  },
  {
    slug: "jeweled-drop-earrings",
    name: "Jeweled drop earrings",
    sku: "NA-JW-24611",
    priceCents: 115000,
    category: "jewelry",
    badge: "New",
    image: {
      src: unsplash("1535632066927-ab7c9ab60908"),
      alt: "Pair of jeweled drop earrings resting on a green leaf",
    },
    gallery: [
      {
        src: unsplash("1535632066927-ab7c9ab60908"),
        alt: "Detail of the faceted blue centre stone",
        focus: "45% 55%",
      },
    ],
    description:
      "Art deco–inspired drop earrings set with a faceted blue stone and a halo of crystals, hand-finished in our jewelry atelier.",
    details: [
      "Sterling silver with rhodium finish",
      "Glass stones and crystals",
      "Post-back fastening",
      "Length 4.5 cm",
      "Presented in a gift box",
    ],
    stockQuantity: 1,
  },
  {
    slug: "hand-knit-cotton-poncho",
    name: "Hand-knit cotton poncho",
    sku: "NA-KN-24702",
    priceCents: 74000,
    category: "knitwear",
    image: {
      src: unsplash("1434389677669-e08b4cac3105"),
      alt: "Cream knit poncho on a hanger",
    },
    gallery: [
      {
        src: unsplash("1558769132-cb1aea458c5e"),
        alt: "Knitwear in undyed neutral tones hanging on a wooden rail",
      },
      {
        src: unsplash("1434389677669-e08b4cac3105"),
        alt: "Detail of the open hand-knit stitch",
        focus: "50% 55%",
      },
    ],
    description:
      "An airy poncho hand-knitted in undyed organic cotton, with an open stitch and fringed hem. Light enough to layer through the seasons.",
    details: [
      "100% organic cotton",
      "Hand-knitted",
      "Fringed hem",
      "Hand wash cold, dry flat",
    ],
    stockQuantity: 20,
  },
];
