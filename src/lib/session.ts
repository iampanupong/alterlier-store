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
 * Admin user. Reads the role from the database (bypassing the cookie cache) so a
 * promotion or demotion applies on the next request. Non-admins get a 404 so the
 * route's existence isn't confirmed. Call this in every admin page AND every
 * admin server action / route handler.
 */
export async function requireAdmin(returnTo = "/admin") {
  const session = await auth.api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true },
  });
  if (!session) redirect(signInHref(returnTo));
  if (session.user.role !== "admin") notFound();
  return session.user;
}

export function signInHref(returnTo?: string) {
  const next = safeNext(returnTo, "");
  return next ? `${SIGN_IN_PATH}?next=${encodeURIComponent(next)}` : SIGN_IN_PATH;
}

/** Same-origin relative path only: blocks `//host`, `/\host` and absolute URLs. */
export function safeNext(value: unknown, fallback = "/account") {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }
  return value;
}
