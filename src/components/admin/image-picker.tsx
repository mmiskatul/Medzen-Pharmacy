"use client";

import * as React from "react";
import Image from "next/image";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/components/admin/api-client";
import { cn } from "@/lib/utils";

/**
 * Uploads to the public media prefix and hands the caller storage keys.
 * Multiple mode keeps order, and the first image is the one shown on
 * product cards, so the order is meaningful rather than cosmetic.
 */
export function ImagePicker({
  value,
  onChange,
  folder,
  multiple = false,
  max = 6,
}: {
  value: string[];
  onChange: (keys: string[]) => void;
  folder: "products" | "categories" | "brands" | "banners" | "site";
  multiple?: boolean;
  max?: number;
}) {
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const room = multiple ? max - value.length : 1;
    if (room <= 0) {
      toast.error(`You can attach up to ${max} images.`);
      return;
    }

    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files).slice(0, room)) {
        const result = await api.upload(file, folder);
        uploaded.push(result.key);
      }
      onChange(multiple ? [...value, ...uploaded] : uploaded.slice(0, 1));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "The image could not be uploaded.",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2.5">
        {value.map((key, index) => (
          <div
            key={key}
            className={cn(
              "group relative size-24 overflow-hidden rounded-xl border bg-wash",
              index === 0 && multiple ? "border-brand-500" : "border-line",
            )}
          >
            <Image
              src={`/api/media/${key}`}
              alt=""
              fill
              sizes="96px"
              className="object-cover"
            />
            {index === 0 && multiple ? (
              <span className="absolute inset-x-0 top-0 bg-brand-600 py-0.5 text-center text-[0.625rem] font-bold uppercase tracking-wide text-white">
                Main
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => onChange(value.filter((item) => item !== key))}
              className="absolute bottom-1 right-1 grid size-7 place-items-center rounded-lg bg-white/95 text-muted opacity-0 transition-opacity hover:text-danger focus:opacity-100 group-hover:opacity-100"
              aria-label={`Remove image ${index + 1}`}
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}

        {multiple || value.length === 0 ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading || (multiple && value.length >= max)}
            className="grid size-24 place-items-center rounded-xl border-2 border-dashed border-line-strong text-muted transition-colors hover:border-brand-300 hover:text-brand-700 disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="size-5 animate-spin" aria-hidden />
            ) : (
              <ImagePlus className="size-5" aria-hidden />
            )}
            <span className="sr-only">Upload an image</span>
          </button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple={multiple}
        className="sr-only"
        onChange={(event) => {
          void handleFiles(event.target.files);
          event.target.value = "";
        }}
      />

      <p className="text-xs text-muted">
        JPG, PNG, WebP or AVIF.
        {multiple ? ` Up to ${max} images — the first one is used on cards.` : ""}
      </p>
    </div>
  );
}
