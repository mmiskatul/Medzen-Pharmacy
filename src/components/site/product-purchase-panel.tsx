"use client";

import * as React from "react";
import Link from "next/link";
import { Minus, MessageCircle, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useCart } from "@/components/site/cart-provider";
import type { PublicProduct } from "@/lib/queries";
import { whatsappLink } from "@/lib/whatsapp";

export function ProductPurchasePanel({
  product,
  whatsapp,
  showPrice,
}: {
  product: PublicProduct;
  whatsapp: string;
  showPrice: boolean;
}) {
  const cart = useCart();
  const [quantity, setQuantity] = React.useState(1);
  const soldOut = product.availability === "out_of_stock";

  function addToBasket() {
    cart.add(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        sku: product.sku,
        priceFils: showPrice ? product.priceFils : null,
        imageUrl: product.imageUrl,
        prescriptionRequired: product.prescriptionRequired,
      },
      quantity,
    );
    toast.success(`${product.name} × ${quantity} added to your request`, {
      description: "Open your basket to send it to the pharmacy.",
      action: { label: "View basket", onClick: () => location.assign("/cart") },
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-ink">Quantity</span>
        <div className="flex items-center rounded-xl border border-line-strong">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            className="grid size-10 place-items-center rounded-l-xl text-ink-soft transition-colors hover:bg-wash disabled:opacity-40"
            aria-label="Decrease quantity"
          >
            <Minus className="size-4" />
          </button>
          <input
            type="number"
            min={1}
            max={50}
            value={quantity}
            onChange={(event) => {
              const next = Number.parseInt(event.target.value, 10);
              setQuantity(Number.isNaN(next) ? 1 : Math.min(50, Math.max(1, next)));
            }}
            aria-label="Quantity"
            className="tnum h-10 w-14 border-x border-line-strong bg-transparent text-center text-sm outline-none focus:bg-wash"
          />
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(50, q + 1))}
            disabled={quantity >= 50}
            className="grid size-10 place-items-center rounded-r-xl text-ink-soft transition-colors hover:bg-wash disabled:opacity-40"
            aria-label="Increase quantity"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <Button
          size="lg"
          className="flex-1"
          onClick={addToBasket}
          disabled={soldOut}
        >
          <ShoppingBag />
          {soldOut ? "Out of stock" : "Add to request"}
        </Button>
        <Button asChild size="lg" variant="whatsapp" className="flex-1">
          <a
            href={whatsappLink(whatsapp, {
              kind: "product",
              productName: product.name,
              sku: product.sku,
            })}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle />
            Ask on WhatsApp
          </a>
        </Button>
      </div>

      {soldOut ? (
        <p className="text-sm text-muted">
          This item is not on the shelf right now.{" "}
          <a
            href={whatsappLink(whatsapp, {
              kind: "availability",
              productName: product.name,
            })}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-brand-700 underline underline-offset-4"
          >
            Ask us when it is back
          </a>
          .
        </p>
      ) : null}

      {product.prescriptionRequired ? (
        <p className="text-sm text-muted">
          Have a prescription already?{" "}
          <Link
            href="/prescription"
            className="font-medium text-brand-700 underline underline-offset-4"
          >
            Upload it securely
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}
