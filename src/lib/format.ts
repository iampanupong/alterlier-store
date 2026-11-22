// Client-safe formatting helpers (no server imports), re-exported from catalog.ts.

const priceFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  // "$2,450" for whole amounts, "$199.50" otherwise.
  trailingZeroDisplay: "stripIfInteger",
});

export function formatPrice(amount: number) {
  return priceFormat.format(amount);
}
