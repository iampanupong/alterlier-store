"use client";

import Link from "next/link";
import { useState } from "react";
import { HeartIcon } from "@/components/ui/icons";
import type { StockState } from "@/lib/catalog";

type PurchasePanelProps = {
  productName: string;
  stock: StockState;
};

// Front-end only: there is no cart or wishlist backend yet, so actions just
// update local UI state.
export function PurchasePanel({ productName, stock }: PurchasePanelProps) {
  const [added, setAdded] = useState(false);
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
          <button type="button" className="btn btn-primary flex-1" onClick={() => setAdded(true)}>
            Add to bag
          </button>
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
        {added && (
          <>
            Added to your bag.{" "}
            <Link href="/cart" className="link">
              View bag
            </Link>
          </>
        )}
        {notify && "We’ll email you as soon as this piece is back in stock."}
      </p>
    </div>
  );
}
