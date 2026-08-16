"use client";

import Image from "next/image";
import Link from "next/link";
import { ImageOff, Plus, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/site/cart-provider";
import type { PublicProduct } from "@/lib/queries";
import { cn, formatPrice } from "@/lib/utils";

const AVAILABILITY: Record<
  PublicProduct["availability"],
  { label: string; tone: "brand" | "neutral" | "muted" }
> = {
  in_stock: { label: "In stock", tone: "brand" },
  low: { label: "Low stock", tone: "neutral" },
  out_of_stock: { label: "Out of stock", tone: "muted" },
  on_request: { label: "Available on request", tone: "muted" },
};

export function ProductCard({
  product,
  showPrice = true,
  className,
}: {
  product: PublicProduct;
  showPrice?: boolean;
  className?: string;
}) {
  const cart = useCart();
  const availability = AVAILABILITY[product.availability];
  const soldOut = product.availability === "out_of_stock";

  function addToBasket() {
    cart.add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      sku: product.sku,
      priceFils: showPrice ? product.priceFils : null,
      imageUrl: product.imageUrl,
      prescriptionRequired: product.prescriptionRequired,
    });
    toast.success(`${product.name} added to your request`, {
      description: "Review your basket to send it to the pharmacy.",
    });
  }

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition-colors duration-200 hover:border-brand-200",
        className,
      )}
    >
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-square overflow-hidden bg-wash"
      >
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <span className="grid h-full place-items-center text-muted">
            <ImageOff className="size-7" aria-hidden />
            <span className="sr-only">No image available</span>
          </span>
        )}

        {product.prescriptionRequired ? (
          <Badge tone="rx" className="absolute left-3 top-3 bg-rx-bg/95 backdrop-blur">
            <ShieldAlert className="size-3" aria-hidden />
            Prescription
          </Badge>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        {product.brandName ? (
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted">
            {product.brandName}
          </p>
        ) : null}

        <h3 className="mt-1 text-[0.9375rem] font-semibold leading-snug text-ink">
          <Link
            href={`/products/${product.slug}`}
            className="after:absolute after:inset-0 after:content-[''] focus:outline-none"
          >
            {product.name}
          </Link>
        </h3>

        {product.summary ? (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">
            {product.summary}
          </p>
        ) : null}

        <div className="mt-3 flex items-center gap-2">
          <Badge tone={availability.tone}>{availability.label}</Badge>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div>
            {showPrice ? (
              <>
                <p className="tnum text-base font-bold text-ink">
                  {formatPrice(product.priceFils, product.currency)}
                </p>
                {product.compareAtFils && product.priceFils &&
                product.compareAtFils > product.priceFils ? (
                  <p className="tnum text-xs text-muted line-through">
                    {formatPrice(product.compareAtFils, product.currency)}
                  </p>
                ) : null}
              </>
            ) : (
              <p className="text-sm font-medium text-muted">Ask for price</p>
            )}
          </div>

          <Button
            size="icon"
            variant={soldOut ? "secondary" : "subtle"}
            className="relative z-10 shrink-0"
            onClick={addToBasket}
            disabled={soldOut}
            aria-label={
              soldOut
                ? `${product.name} is out of stock`
                : `Add ${product.name} to your request`
            }
          >
            <Plus />
          </Button>
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white">
      <div className="skeleton aspect-square rounded-none" />
      <div className="space-y-2.5 p-4">
        <div className="skeleton h-3 w-16" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-3 w-3/4" />
        <div className="skeleton mt-4 h-5 w-20" />
      </div>
    </div>
  );
}
