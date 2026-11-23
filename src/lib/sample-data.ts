// Placeholder site content (hero, campaigns, collections, navigation).
// Products and categories come from the database via src/lib/catalog.ts.

import type { Image } from "@/lib/catalog";

export type Collection = {
  id: string;
  name: string;
  description: string;
  href: string;
  image: Image;
};

/** Unsplash photo URL; sizing params are added by src/lib/image-loader.ts. */
function unsplash(id: string) {
  return `https://images.unsplash.com/photo-${id}`;
}

export const hero = {
  eyebrow: "Autumn / Winter 2026",
  title: "Quiet Northern Light",
  href: "/collections/autumn-winter",
  image: {
    src: unsplash("1558769132-cb1aea458c5e"),
    alt: "Knitwear in undyed neutral tones hanging on a wooden rail",
  },
} satisfies { eyebrow: string; title: string; href: string; image: Image };

export const intro =
  "A season shaped by slow tailoring, washed neutrals and leather worked by hand. Discover the new collection, available online and in our ateliers.";

export const editorialPair: Collection[] = [
  {
    id: "women",
    name: "Women",
    description: "Sculpted outerwear and fluid knits",
    href: "/women",
    image: {
      src: unsplash("1485968579580-b6d095142e6e"),
      alt: "Woman in a long black coat walking down a city street",
    },
  },
  {
    id: "men",
    name: "Men",
    description: "Relaxed tailoring in wool and cashmere",
    href: "/men",
    image: {
      src: unsplash("1617137968427-85924c800a22"),
      alt: "Man in a navy suit walking past a glass building",
    },
  },
];

export const campaign = {
  eyebrow: "The Weekend Edit",
  title: "Soft layers for slow days",
  body: "Chunky knits, washed denim and quiet accessories for the colder months.",
  href: "/collections/weekend",
  image: {
    src: unsplash("1556905055-8f358a7a47b2"),
    alt: "Flat lay of a rust beanie, grey knit sweater, jeans, a watch and yellow tulips on white linen",
  },
} satisfies {
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  image: Image;
};

export const featuredCollections: Collection[] = [
  {
    id: "atelier",
    name: "The Atelier Line",
    description: "Limited pieces cut and finished in our own workshop.",
    href: "/collections/atelier",
    image: {
      src: unsplash("1490481651871-ab68de25d43d"),
      alt: "Light garments hanging from a branch rail in a bright studio",
    },
  },
  {
    id: "knitwear",
    name: "Winter Knitwear",
    description: "Cashmere and merino in washed, undyed tones.",
    href: "/collections/knitwear",
    image: {
      src: unsplash("1445205170230-053b83016050"),
      alt: "Neutral knitwear on a boutique rail behind a window",
    },
  },
  {
    id: "gifts",
    name: "Gifts for the Season",
    description: "Small leather goods, fragrance and jewelry.",
    href: "/collections/gifts",
    image: {
      src: unsplash("1483985988355-763728e1935b"),
      alt: "Woman in sunglasses carrying shopping bags",
    },
  },
];

export const services = [
  {
    id: "shipping",
    title: "Complimentary shipping",
    body: "Free express delivery and returns on every order.",
    href: "/services/shipping",
  },
  {
    id: "appointment",
    title: "Book an appointment",
    body: "Shop in person or by video with a client advisor.",
    href: "/services/appointments",
  },
  {
    id: "gifting",
    title: "Signature wrapping",
    body: "Every order arrives in our recyclable gift box.",
    href: "/services/gifting",
  },
];

export const footerNav = [
  {
    title: "Client services",
    links: [
      { label: "Contact us", href: "/contact" },
      { label: "Shipping", href: "/services/shipping" },
      { label: "Returns", href: "/services/returns" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "The house",
    links: [
      { label: "About", href: "/about" },
      { label: "Ateliers", href: "/ateliers" },
      { label: "Sustainability", href: "/sustainability" },
      { label: "Careers", href: "/careers" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy policy", href: "/legal/privacy" },
      { label: "Terms of sale", href: "/legal/terms" },
      { label: "Cookie settings", href: "/legal/cookies" },
    ],
  },
];

export const mainNav = [
  { label: "New In", href: "/new-arrivals" },
  { label: "Women", href: "/women" },
  { label: "Men", href: "/men" },
  { label: "Bags", href: "/categories/bags" },
  { label: "Jewelry & Watches", href: "/categories/jewelry" },
  { label: "Gifts", href: "/collections/gifts" },
];

/** Editorial image beside the sign-in / sign-up forms. */
export const accountEditorial = {
  eyebrow: "Nord Alterlier account",
  title: "Your details, orders and saved pieces in one place.",
  image: {
    src: unsplash("1490481651871-ab68de25d43d"),
    alt: "Light garments hanging from a branch rail in a bright studio",
  },
} satisfies { eyebrow: string; title: string; image: Image };
