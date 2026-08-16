"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ImageOff,
  MessageCircle,
  Minus,
  Plus,
  ShieldAlert,
  ShoppingBag,
  Trash2,
} from "lucide-react";

import { useCart } from "@/components/site/cart-provider";
import { Button } from "@/components/ui/button";
import { Badge, Card, EmptyState, Skeleton } from "@/components/ui/primitives";
import { formatPrice } from "@/lib/utils";
import { whatsappLink } from "@/lib/whatsapp";

export function CartView({
  whatsapp,
  showPrices,
  deliveryFeeFils,
  freeDeliveryOverFils,
}: {
  whatsapp: string;
  showPrices: boolean;
  deliveryFeeFils: number;
  freeDeliveryOverFils: number;
}) {
  const cart = useCart();

  if (!cart.ready) {
    return (
      <div className="grid gap-3">
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (cart.lines.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Your request is empty"
        description="Add products you would like us to prepare, and we will confirm availability and the total before anything is dispensed."
        action={
          <Button asChild>
            <Link href="/products">
              Browse products
              <ArrowRight />
            </Link>
          </Button>
        }
      />
    );
  }

  const needsPrescription = cart.lines.some((line) => line.prescriptionRequired);
  const qualifiesForFreeDelivery =
    freeDeliveryOverFils > 0 && cart.subtotalFils >= freeDeliveryOverFils;
  const delivery = qualifiesForFreeDelivery ? 0 : deliveryFeeFils;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_0.6fr] lg:gap-10">
      <ul className="space-y-3">
        {cart.lines.map((line) => (
          <li key={line.productId}>
            <Card className="flex gap-4 p-4">
              <Link
                href={`/products/${line.slug}`}
                className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-wash sm:size-24"
              >
                {line.imageUrl ? (
                  <Image
                    src={line.imageUrl}
                    alt={line.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                ) : (
                  <span className="grid h-full place-items-center text-muted">
                    <ImageOff className="size-5" aria-hidden />
                  </span>
                )}
              </Link>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-[0.9375rem] font-semibold text-ink">
                      <Link href={`/products/${line.slug}`} className="hover:underline">
                        {line.name}
                      </Link>
                    </h2>
                    <p className="tnum mt-0.5 text-xs text-muted">SKU {line.sku}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => cart.remove(line.productId)}
                    className="shrink-0 rounded-lg p-2 text-muted transition-colors hover:bg-danger-bg hover:text-danger"
                    aria-label={`Remove ${line.name} from your request`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                {line.prescriptionRequired ? (
                  <Badge tone="rx" className="mt-2">
                    <ShieldAlert className="size-3" aria-hidden />
                    Prescription required
                  </Badge>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center rounded-xl border border-line-strong">
                    <button
                      type="button"
                      onClick={() =>
                        cart.setQuantity(line.productId, line.quantity - 1)
                      }
                      className="grid size-9 place-items-center rounded-l-xl text-ink-soft transition-colors hover:bg-wash"
                      aria-label={`Decrease quantity of ${line.name}`}
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="tnum grid h-9 w-11 place-items-center border-x border-line-strong text-sm font-medium">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        cart.setQuantity(line.productId, line.quantity + 1)
                      }
                      className="grid size-9 place-items-center rounded-r-xl text-ink-soft transition-colors hover:bg-wash"
                      aria-label={`Increase quantity of ${line.name}`}
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>

                  {showPrices ? (
                    <p className="tnum text-[0.9375rem] font-bold text-ink">
                      {line.priceFils === null
                        ? "Price on request"
                        : formatPrice(line.priceFils * line.quantity)}
                    </p>
                  ) : null}
                </div>
              </div>
            </Card>
          </li>
        ))}

        <li>
          <Button variant="ghost" size="sm" onClick={cart.clear}>
            <Trash2 />
            Empty the basket
          </Button>
        </li>
      </ul>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <Card className="p-5">
          <h2 className="text-base font-semibold text-ink">Request summary</h2>

          {showPrices ? (
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Subtotal</dt>
                <dd className="tnum font-medium text-ink">
                  {formatPrice(cart.subtotalFils)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Delivery</dt>
                <dd className="tnum font-medium text-ink">
                  {delivery === 0 ? "Confirmed with you" : formatPrice(delivery)}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-line pt-3 text-base">
                <dt className="font-semibold text-ink">Estimated total</dt>
                <dd className="tnum font-bold text-ink">
                  {formatPrice(cart.subtotalFils + delivery)}
                </dd>
              </div>
            </dl>
          ) : null}

          <p className="mt-4 rounded-xl border border-line bg-wash p-3 text-xs leading-relaxed text-muted">
            This is a request, not a paid order. The pharmacy confirms stock and
            the final total with you before anything is prepared.
            {cart.hasPricelessLine
              ? " Some items are priced on request."
              : ""}
          </p>

          {needsPrescription ? (
            <div className="mt-3 flex gap-2.5 rounded-xl border border-rx-line bg-rx-bg p-3">
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-rx" aria-hidden />
              <p className="text-xs leading-relaxed text-rx">
                Your request includes an item that may need a prescription.{" "}
                <Link href="/prescription" className="font-semibold underline underline-offset-2">
                  Upload it here
                </Link>{" "}
                so our pharmacist can review it.
              </p>
            </div>
          ) : null}

          <div className="mt-5 grid gap-2.5">
            <Button asChild size="lg">
              <Link href="/checkout">
                Continue to details
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="whatsapp">
              <a
                href={whatsappLink(whatsapp, {
                  kind: "cart",
                  lines: cart.lines.map((line) => ({
                    name: line.name,
                    quantity: line.quantity,
                  })),
                })}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle />
                Send on WhatsApp instead
              </a>
            </Button>
          </div>
        </Card>
      </aside>
    </div>
  );
}
