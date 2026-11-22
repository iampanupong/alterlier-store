// Building blocks shared by the order confirmation and the account order page.
// All amounts come from the order's own snapshots (cents), never from live prices.

import Image from "next/image";
import Link from "next/link";
import type { ShippingAddress as Address } from "@/db/orders";
import { formatPrice } from "@/lib/format";
import type { OrderWithItems } from "@/lib/orders";

export const price = (cents: number) => formatPrice(cents / 100);

/** Short, human-readable order reference. */
export const orderNumber = (id: string) => id.slice(0, 8).toUpperCase();

export const orderDate = new Intl.DateTimeFormat("en", { dateStyle: "long" });

/** Hairline-ruled list of the pieces in an order, each linking back to its product. */
export function OrderItems({ items }: { items: OrderWithItems["items"] }) {
  return (
    <ul className="divide-y divide-line border-y border-line">
      {items.map((item) => (
        <li key={item.id} className="grid grid-cols-[4rem_minmax(0,1fr)_auto] gap-4 py-4">
          <div className="media media-portrait">
            <Image src={item.image.src} alt="" fill sizes="4rem" />
          </div>
          <div className="min-w-0">
            <p className="text-body font-bold">
              <Link href={`/products/${item.product.slug}`} className="link-quiet">
                {item.productName}
              </Link>
            </p>
            <p className="mt-1 text-caption text-muted">
              Qty {item.quantity} · {price(item.unitPriceCents)} each
            </p>
            <p className="text-caption text-muted">Style {item.sku}</p>
          </div>
          <p className="text-body tabular-nums">{price(item.unitPriceCents * item.quantity)}</p>
        </li>
      ))}
    </ul>
  );
}

/** Subtotal, shipping and total, laid out like the bag's order summary. */
export function OrderTotals({ order }: { order: Pick<OrderWithItems, "subtotalCents" | "totalCents" | "items"> }) {
  const count = order.items.reduce((sum, item) => sum + item.quantity, 0);
  return (
    <dl className="space-y-3 text-body">
      <div className="flex justify-between gap-4">
        <dt>
          Subtotal · {count} {count === 1 ? "item" : "items"}
        </dt>
        <dd className="tabular-nums">{price(order.subtotalCents)}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt>Shipping</dt>
        <dd className="text-muted">Complimentary</dd>
      </div>
      <div className="flex items-baseline justify-between gap-4 border-t border-line pt-4">
        <dt className="font-bold">Total</dt>
        <dd className="text-title tabular-nums">
          {price(order.totalCents)}
          <span className="sr-only"> US dollars</span>
        </dd>
      </div>
    </dl>
  );
}

export function AddressLines({ address }: { address: Address }) {
  return (
    <address className="not-italic">
      {address.name}
      <br />
      {address.line1}
      {address.line2 ? `, ${address.line2}` : ""}
      <br />
      {[address.city, address.state, address.postalCode].filter(Boolean).join(", ")}
      <br />
      {address.country}
    </address>
  );
}
