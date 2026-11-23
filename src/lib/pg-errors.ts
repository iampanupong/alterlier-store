// Postgres error details from a driver error, looking through Drizzle's wrapper.
// No imports, so both the app and the scripts can use it.

type DriverError = { code?: unknown; constraint?: unknown; cause?: unknown } | undefined;

export const UNIQUE_VIOLATION = "23505";
export const FK_VIOLATION = "23503";
export const CHECK_VIOLATION = "23514";

/** Postgres SQLSTATE, e.g. "23505". */
export function pgCode(error: unknown): string | undefined {
  for (let e = error as DriverError; e; e = e.cause as DriverError) {
    if (typeof e.code === "string" && /^[0-9A-Z]{5}$/.test(e.code)) return e.code;
  }
  return undefined;
}

/** Name of the violated constraint, e.g. "products_slug_unique". */
export function pgConstraint(error: unknown): string | undefined {
  for (let e = error as DriverError; e; e = e.cause as DriverError) {
    if (typeof e.constraint === "string") return e.constraint;
  }
  return undefined;
}
