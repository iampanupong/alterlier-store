import { check, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Fixed-window counters for the auth server actions (src/lib/rate-limit.ts).
// Better Auth's own limiter only runs for HTTP requests, not `auth.api.*` calls.

export const rateLimits = pgTable(
  "rate_limits",
  {
    key: text("key").primaryKey(),
    count: integer("count").notNull().default(0),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [check("rate_limits_count_non_negative", sql`${t.count} >= 0`)],
);
