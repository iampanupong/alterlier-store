"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { addToCartAction, type CartActionState } from "@/app/cart/actions";
import { HeartIcon } from "@/components/ui/icons";
import type { StockState } from "@/lib/catalog";

type PurchasePanelProps = {
  productId: string;
  productName: string;
  stock: StockState;
};

// "Add to bag" goes through a server action that checks live stock; only the
// product id is sent. Save and "notify me" are still front-end only.
export function PurchasePanel({ productId, productName, stock }: PurchasePanelProps) {
  const [cart, addAction, adding] = useActionState<CartActionState, FormData>(addToCartAction, {
    status: "idle",
    message: "",
  });
  const [saved, setSaved] = useState(false);
  const [notify, setNotify] = useState(false);

  const soldOut = stock.status === "out_of_stock";

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {soldOut ? (
          <button
            type="button"
            className="btn btn-primary flex-1"
            onClick={() => setNotify(true)}
            disabled={notify}
          >
            {notify ? "We’ll let you know" : "Notify me when available"}
          </button>
        ) : (
          <form action={addAction} className="flex flex-1">
            <input type="hidden" name="productId" value={productId} />
            <button type="submit" className="btn btn-primary flex-1" disabled={adding}>
              {adding ? "Adding…" : "Add to bag"}
            </button>
          </form>
        )}
        <button
          type="button"
          className={`btn btn-secondary px-0 w-12 shrink-0 ${saved ? "bg-ink text-paper" : ""}`}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${productName} from saved items` : `Save ${productName}`}
          onClick={() => setSaved((v) => !v)}
        >
          <HeartIcon fill={saved ? "currentColor" : "none"} />
        </button>
      </div>

      <p role="status" className="min-h-4 text-caption">
        {/* Keyed on the response time so a repeated message is announced again. */}
        {cart.status !== "idle" && (
          <span key={cart.at} className={cart.status === "error" ? "text-danger" : undefined}>
            {cart.message}{" "}
            {cart.status !== "error" && (
              <Link href="/cart" className="link text-ink">
                View bag
              </Link>
            )}
          </span>
        )}
        {notify && "We’ll email you as soon as this piece is back in stock."}
      </p>
    </div>
  );
}
