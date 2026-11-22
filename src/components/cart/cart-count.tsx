import { getCartCount } from "@/lib/cart";

/** Header badge. Reads the cart cookie, so render it inside <Suspense>. */
export async function CartCount() {
  const count = await getCartCount();
  if (count === 0) return null;
  return (
    <span className="absolute top-1 right-0.5 flex min-w-4 items-center justify-center bg-ink px-1 text-caption font-bold text-paper">
      {count > 99 ? "99+" : count}
      <span className="sr-only"> {count === 1 ? "item" : "items"}</span>
    </span>
  );
}
