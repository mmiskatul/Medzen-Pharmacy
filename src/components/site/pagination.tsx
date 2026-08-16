import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

/** Server-rendered pagination — the page number stays a real, linkable URL. */
export function Pagination({
  page,
  pageCount,
  buildHref,
}: {
  page: number;
  pageCount: number;
  buildHref: (page: number) => string;
}) {
  if (pageCount <= 1) return null;

  const pages = new Set<number>([1, pageCount, page, page - 1, page + 1]);
  const visible = [...pages]
    .filter((n) => n >= 1 && n <= pageCount)
    .sort((a, b) => a - b);

  const item =
    "grid h-10 min-w-10 place-items-center rounded-xl border px-3 text-sm font-medium transition-colors";

  return (
    <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label="Pagination">
      {page > 1 ? (
        <Link
          href={buildHref(page - 1)}
          className={cn(item, "border-line-strong text-ink-soft hover:bg-wash")}
          rel="prev"
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </Link>
      ) : null}

      {visible.map((number, index) => (
        <span key={number} className="flex items-center gap-1.5">
          {index > 0 && number - visible[index - 1]! > 1 ? (
            <span className="px-1 text-muted" aria-hidden>
              …
            </span>
          ) : null}
          <Link
            href={buildHref(number)}
            aria-current={number === page ? "page" : undefined}
            className={cn(
              item,
              "tnum",
              number === page
                ? "border-brand-800 bg-brand-800 text-white"
                : "border-line-strong text-ink-soft hover:bg-wash",
            )}
          >
            {number}
          </Link>
        </span>
      ))}

      {page < pageCount ? (
        <Link
          href={buildHref(page + 1)}
          className={cn(item, "border-line-strong text-ink-soft hover:bg-wash")}
          rel="next"
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </Link>
      ) : null}
    </nav>
  );
}
