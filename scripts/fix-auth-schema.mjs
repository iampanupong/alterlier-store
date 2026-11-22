// Runs after `auth generate`: the Better Auth CLI emits `timestamp` columns, but our
// convention is timestamptz. Rewrites src/db/auth-schema.ts in place; safe to re-run.
import { readFileSync, writeFileSync } from "node:fs";

const file = new URL("../src/db/auth-schema.ts", import.meta.url);
const source = readFileSync(file, "utf8");
const fixed = source.replace(/timestamp\("([a-z_]+)"\)/g, 'timestamp("$1", { withTimezone: true })');
writeFileSync(file, fixed);
