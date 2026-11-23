// Server-side auth reads. Pages, server actions and route handlers go through these,
// never through the client. Callers that read the session must sit inside <Suspense>
// (cacheComponents): it's request data.

import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";

export const SIGN_IN_PATH = "/sign-in";

/** Current session or null. Deduped per request; may come from the 5-minute cookie cache. */
export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);

/** Signed-in user, or a redirect to sign-in that returns to `returnTo`. */
export async function requireUser(returnTo = "/account") {
  const session = await getSession();
  if (!session) redirect(signInHref(returnTo));
  return session.user;
}

/**
 * Session read from the database, bypassing the cookie cache, so a role change
 * applies on the next request. Deduped per request: the admin layout and page share it.
 */
const getFreshSession = cache(async () =>
  auth.api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true },
  }),
);

/**
 * The admin user, or null. For deciding what to *render* (the admin nav) only.
 * Authorization is always `requireAdmin()` in the page, action or route handler.
 */
export async function getAdmin() {
  const session = await getFreshSession();
  return session?.user.role === "admin" ? session.user : null;
}

/**
 * Admin user. Reads the role from the database (bypassing the cookie cache) so a
 * promotion or demotion applies on the next request. Non-admins get a 404 so the
 * route's existence isn't confirmed. Call this in every admin page AND every
 * admin server action / route handler (enforced by src/lib/admin-guard.test.ts).
 */
export async function requireAdmin(returnTo = "/admin") {
  const session = await getFreshSession();
  if (!session) redirect(signInHref(returnTo));
  if (session.user.role !== "admin") notFound();
  return session.user;
}

export function signInHref(returnTo?: string) {
  const next = safeNext(returnTo, "");
  return next ? `${SIGN_IN_PATH}?next=${encodeURIComponent(next)}` : SIGN_IN_PATH;
}

const NEXT_BASE = "http://next.invalid";

/**
 * Same-origin relative path only. Parsed the way a browser would, so tricks like
 * `//host`, `/\host` and `/<tab>/host` (browsers strip tabs/newlines) all fall back.
 */
export function safeNext(value: unknown, fallback = "/account") {
  if (typeof value !== "string" || !value.startsWith("/")) return fallback;
  let url: URL;
  try {
    url = new URL(value, NEXT_BASE);
  } catch {
    return fallback;
  }
  if (url.origin !== NEXT_BASE) return fallback;
  return url.pathname + url.search + url.hash;
}
