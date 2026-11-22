import { sql } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { rateLimits } from "@/db/rate-limit";

export type Limit = { max: number; windowSeconds: number };

/**
 * Counts one hit against `key` and returns whether it is still within `max` for the
 * current window. A single upsert, so concurrent requests can't slip past
 * (neon-http has no interactive transactions).
 */
export async function consumeRateLimit(key: string, { max, windowSeconds }: Limit) {
  const expired = sql`${rateLimits.windowStart} <= now() - ${windowSeconds} * interval '1 second'`;
  const [row] = await db
    .insert(rateLimits)
    .values({ key, count: 1 })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`case when ${expired} then 1 else ${rateLimits.count} + 1 end`,
        windowStart: sql`case when ${expired} then now() else ${rateLimits.windowStart} end`,
      },
    })
    .returning({ count: rateLimits.count });
  return row.count <= max;
}

/** All limits must pass. Every key is counted, even if an earlier one already failed. */
export async function withinLimits(checks: [key: string, limit: Limit][]) {
  const results = await Promise.all(checks.map(([key, limit]) => consumeRateLimit(key, limit)));
  return results.every(Boolean);
}

/** Client IP from the proxy headers (Vercel and most hosts set x-forwarded-for). */
export async function clientIp() {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip")?.trim() || "unknown"
  );
}
