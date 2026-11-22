"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState } from "react";
import { updateCartLineAction, type CartActionState } from "@/app/cart/actions";
import { StockStatus } from "@/components/product/stock-status";
import { MinusIcon, PlusIcon } from "@/components/ui/icons";
import { formatPrice } from "@/lib/format";
import type { CartLine as CartLineData } from "@/lib/cart";

type CartLineProps = {
  line: CartLineData;
  /** The first line's photo is usually the page's largest image. */
  eager?: boolean;
};

// Every button submits the product id and a target quantity; the server clamps it
// to live stock and re-renders the page with fresh prices and totals.
export function CartLine({ line, eager = false }: CartLineProps) {
  const [state, action, pending] = useActionState<CartActionState, FormData>(
    updateCartLineAction,
    { status: "idle", message: "" },
  );
  const { product, quantity, maxQuantity, issue } = line;
  const soldOut = issue === "sold_out";
  const atMax = !soldOut && quantity >= maxQuantity;

  return (
    <li
      aria-busy={pending}
      className={`grid grid-cols-[5.5rem_1fr] gap-4 py-6 transition-opacity duration-300 ease-luxe sm:grid-cols-[8rem_1fr] sm:gap-6 ${
        pending ? "opacity-50" : ""
      }`}
    >
      <Link
        href={product.href}
        tabIndex={-1}
        aria-hidden="true"
        className={`media media-portrait ${soldOut ? "opacity-40" : ""}`}
      >
        <Image
          src={product.image.src}
          alt=""
          fill
          sizes="8rem"
          loading={eager ? "eager" : undefined}
        />
      </Link>

      <form action={action} className="flex min-w-0 flex-col">
        <input type="hidden" name="productId" value={product.id} />

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-caption text-muted">{product.category.name}</p>
            <h2 className="text-title">
              <Link href={product.href} className="link-quiet">
                {product.name}
              </Link>
            </h2>
            <p className="mt-1 text-caption text-muted">
              {formatPrice(line.unitPrice)}
              {quantity > 1 && " each"} · Style {product.sku}
            </p>
          </div>
          <p className="shrink-0 text-body font-bold">
            {soldOut ? (
              <span className="text-muted line-through">{formatPrice(line.unitPrice)}</span>
            ) : (
              formatPrice(line.lineTotal)
            )}
          </p>
        </div>

        <div className="mt-3">
          <StockStatus stock={product.stock} />
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          {soldOut ? (
            <span />
          ) : (
            <div
              role="group"
              aria-label={`Quantity of ${product.name}`}
              className="inline-flex items-center border border-line-strong"
            >
              <button
                type="submit"
                name="quantity"
                value={quantity - 1}
                className="btn-icon transition-colors hover:bg-surface disabled:opacity-30"
                disabled={pending}
                aria-label={quantity === 1 ? "Decrease quantity (removes item)" : "Decrease quantity"}
              >
                <MinusIcon width={16} height={16} />
              </button>
              <output
                aria-live="polite"
                aria-label="Quantity"
                className="w-8 text-center text-body font-bold tabular-nums"
              >
                {quantity}
              </output>
              <button
                type="submit"
                name="quantity"
                value={quantity + 1}
                className="btn-icon transition-colors hover:bg-surface disabled:opacity-30"
                disabled={pending || atMax}
                aria-label="Increase quantity"
              >
                <PlusIcon width={16} height={16} />
              </button>
            </div>
          )}

          <button
            type="submit"
            name="quantity"
            value={0}
            className={
              soldOut
                ? "btn btn-secondary min-h-11 px-4 py-2"
                : "link min-h-11 text-caption text-muted hover:text-ink"
            }
            disabled={pending}
            aria-label={`Remove ${product.name}`}
          >
            Remove
          </button>
        </div>

        <LineNotice line={line} state={state} atMax={atMax} />
      </form>
    </li>
  );
}

/**
 * One visible message at a time: a failed or limited action wins, then the stock
 * state. Successful updates are only announced, since the quantity and totals
 * visibly change.
 */
function LineNotice({
  line,
  state,
  atMax,
}: {
  line: CartLineData;
  state: CartActionState;
  atMax: boolean;
}) {
  let notice: { text: string; danger: boolean } | null = null;

  if (state.status === "error" || state.status === "limited") {
    notice = { text: state.message, danger: state.status === "error" };
  } else if (line.issue === "sold_out") {
    notice = { text: "This piece sold out after you added it. Remove it to continue.", danger: true };
  } else if (line.issue === "reduced") {
    notice = {
      text: `Only ${line.maxQuantity} available, so we’ve reduced this from ${line.requested}.`,
      danger: true,
    };
  } else if (atMax && line.product.stock.status !== "low_stock") {
    // Low stock already reads "Only N left" in the stock status above.
    notice = { text: `That’s all we have: ${line.maxQuantity} available.`, danger: false };
  }

  return (
    <div role="status" className="mt-3 min-h-4 text-caption">
      {notice && (
        <p key={state.at} className={notice.danger ? "text-danger" : "text-muted"}>
          {notice.text}
        </p>
      )}
      {state.status === "ok" && (
        <p key={state.at} className="sr-only">
          {state.message}
        </p>
      )}
    </div>
  );
}
