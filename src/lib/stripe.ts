import "server-only";
import Stripe from "stripe";

// Server-side Stripe client. Created lazily so `next build` doesn't need the key.
// Use a restricted key (rk_…) with write access to Checkout Sessions.

let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    client = new Stripe(key, { apiVersion: "2026-11-18.endive" });
  }
  return client;
}

/** Absolute origin for Stripe redirect URLs. */
export function appUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL;
  if (!base) throw new Error("NEXT_PUBLIC_APP_URL is not set");
  return new URL(path, base).toString();
}
