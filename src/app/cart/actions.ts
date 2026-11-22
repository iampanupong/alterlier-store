"use server";

// Cart mutations. Server actions are public POST endpoints, so every input is
// validated here. The client only sends a product id and a quantity: prices and
// stock always come from the database, never from the request.

import { getLiveProducts } from "@/lib/catalog";
import { readStoredCart, writeStoredCart } from "@/lib/cart";
import {
  applyChange,
  isProductId,
  MAX_LINES,
  parseQuantity,
  type CartChange,
} from "@/lib/cart-model";

export type CartActionState = {
  status: "idle" | "ok" | "limited" | "error";
  message: string;
  /** Quantity of the product in the cart after the action. */
  quantity?: number;
  /** Changes on every response so repeated identical messages are re-announced. */
  at?: number;
};

async function mutate(change: CartChange): Promise<CartActionState> {
  const stored = await readStoredCart();
  const ids = [...new Set([...stored.map((line) => line.id), change.id.toLowerCase()])];
  const products = await getLiveProducts(ids);
  const result = applyChange(stored, change, products);
  await writeStoredCart(result.lines);

  const product = products.get(change.id.toLowerCase());
  const at = Date.now();
  const { quantity } = result;

  if (change.type === "remove") {
    return { status: "ok", message: product ? `Removed ${product.name}.` : "Removed.", quantity, at };
  }
  if (!product || result.unavailable) {
    return { status: "error", message: "Sorry, this piece is sold out.", quantity, at };
  }
  if (result.full) {
    return { status: "error", message: `Your bag can hold up to ${MAX_LINES} different pieces.`, quantity, at };
  }
  if (result.limited) {
    return {
      status: "limited",
      message: `Only ${quantity} available. Your bag has ${quantity}.`,
      quantity,
      at,
    };
  }
  if (change.type === "add") return { status: "ok", message: "Added to your bag.", quantity, at };
  return { status: "ok", message: `Updated ${product.name} to ${quantity}.`, quantity, at };
}

const INVALID: CartActionState = { status: "error", message: "Something went wrong. Please try again." };

export async function addToCartAction(
  _prev: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  const id = formData.get("productId");
  if (!isProductId(id)) return { ...INVALID, at: Date.now() };
  return mutate({ type: "add", id, quantity: 1 });
}

export async function updateCartLineAction(
  _prev: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  const id = formData.get("productId");
  const quantity = parseQuantity(formData.get("quantity"));
  if (!isProductId(id) || quantity === null) return { ...INVALID, at: Date.now() };
  return mutate(quantity === 0 ? { type: "remove", id } : { type: "set", id, quantity });
}
