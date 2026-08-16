import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * Wordmark. The mark is a pharmacy cross drawn as two overlapping
 * rounded bars — one solid, one hairline — so it reads as a cross at
 * favicon size and as a considered mark at header size.
 */
export function Logo({
  className,
  name = "Medzen",
  suffix = "Pharmacy",
  tone = "dark",
}: {
  className?: string;
  name?: string;
  suffix?: string;
  tone?: "dark" | "light";
}) {
  return (
    <Link
      href="/"
      className={cn("group inline-flex items-center gap-2.5", className)}
      aria-label={`${name} ${suffix} — home`}
    >
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-[11px] transition-colors",
          tone === "dark" ? "bg-brand-800" : "bg-white",
        )}
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className="size-[18px]" fill="none">
          <path
            d="M12 3.5v17M3.5 12h17"
            stroke={tone === "dark" ? "#ffffff" : "#0e5c43"}
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path
            d="M12 3.5v17M3.5 12h17"
            stroke={tone === "dark" ? "#17b67d" : "#17b67d"}
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.9"
          />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display text-[1.0625rem] font-bold tracking-tight",
            tone === "dark" ? "text-ink" : "text-white",
          )}
        >
          {name}
        </span>
        <span
          className={cn(
            "mt-0.5 text-[0.6875rem] font-medium uppercase tracking-[0.18em]",
            tone === "dark" ? "text-muted" : "text-brand-200",
          )}
        >
          {suffix}
        </span>
      </span>
    </Link>
  );
}
