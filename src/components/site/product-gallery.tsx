"use client";

import * as React from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";

import { cn } from "@/lib/utils";

export function ProductGallery({
  images,
  productName,
}: {
  images: { url: string; alt: string | null }[];
  productName: string;
}) {
  const [active, setActive] = React.useState(0);

  if (images.length === 0) {
    return (
      <div className="grid aspect-square place-items-center rounded-2xl border border-line bg-wash text-muted">
        <ImageOff className="size-8" aria-hidden />
        <span className="mt-2 text-sm">No image available</span>
      </div>
    );
  }

  const current = images[active] ?? images[0]!;

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-line bg-wash">
        <Image
          src={current.url}
          alt={current.alt ?? productName}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 520px"
          className="object-cover"
        />
      </div>

      {images.length > 1 ? (
        <ul className="grid grid-cols-5 gap-2" role="list">
          {images.map((image, index) => (
            <li key={image.url}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Show image ${index + 1} of ${images.length}`}
                aria-current={index === active}
                className={cn(
                  "relative block aspect-square w-full overflow-hidden rounded-xl border-2 transition-colors",
                  index === active
                    ? "border-brand-600"
                    : "border-line hover:border-brand-200",
                )}
              >
                <Image
                  src={image.url}
                  alt=""
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
