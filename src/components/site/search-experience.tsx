"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";

const RECENT_KEY = "medzen.recent-searches.v1";
const MAX_RECENT = 6;

type Suggestion = {
  name: string;
  slug: string;
  sku: string;
  category: string | null;
};

/**
 * Search box with type-ahead and a local recent list. Recent searches are
 * kept in this browser only — they are never sent to the server, so the
 * pharmacy holds no record of what an individual visitor looked for.
 */
export function SearchExperience({ initialTerm }: { initialTerm: string }) {
  const router = useRouter();
  const [term, setTerm] = React.useState(initialTerm);
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);
  const [recent, setRecent] = React.useState<string[]>([]);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENT_KEY);
      if (raw) setRecent(JSON.parse(raw) as string[]);
    } catch {
      // Ignore unreadable storage; recent searches are a convenience only.
    }
  }, []);

  React.useEffect(() => {
    const trimmed = term.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal },
        );
        const payload = (await response.json()) as {
          ok: boolean;
          data?: { suggestions: Suggestion[] };
        };
        if (payload.ok) setSuggestions(payload.data?.suggestions ?? []);
      } catch {
        // Aborted or offline — the full search still works on submit.
      }
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [term]);

  function remember(value: string) {
    const next = [value, ...recent.filter((item) => item !== value)].slice(
      0,
      MAX_RECENT,
    );
    setRecent(next);
    try {
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      // Storage unavailable; nothing else depends on this.
    }
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const value = term.trim();
    if (!value) return;
    remember(value);
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(value)}`);
  }

  return (
    <div className="relative">
      <form onSubmit={submit} role="search">
        <label htmlFor="search-input" className="sr-only">
          Search products
        </label>
        <div className="flex items-center gap-2 rounded-2xl border border-line-strong bg-white px-4 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/25">
          <Search className="size-4 shrink-0 text-muted" aria-hidden />
          <input
            id="search-input"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            onFocus={() => setOpen(true)}
            onBlur={() => window.setTimeout(() => setOpen(false), 150)}
            placeholder="Search by product, brand, category or SKU"
            autoComplete="off"
            role="combobox"
            aria-expanded={open}
            aria-controls="search-suggestions"
            className="h-14 flex-1 bg-transparent text-[0.9375rem] outline-none placeholder:text-muted/80"
          />
          {term ? (
            <button
              type="button"
              onClick={() => setTerm("")}
              className="rounded-lg p-1.5 text-muted hover:bg-wash hover:text-ink"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          ) : null}
          <Button type="submit" disabled={!term.trim()}>
            Search
          </Button>
        </div>
      </form>

      {open && (suggestions.length > 0 || recent.length > 0) ? (
        <div
          id="search-suggestions"
          className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-line bg-white shadow-[var(--shadow-lift)]"
        >
          {suggestions.length > 0 ? (
            <ul role="listbox" aria-label="Product suggestions">
              {suggestions.map((suggestion) => (
                <li key={suggestion.slug}>
                  <Link
                    href={`/products/${suggestion.slug}`}
                    onMouseDown={() => remember(suggestion.name)}
                    className="flex items-center justify-between gap-4 px-4 py-3 text-sm transition-colors hover:bg-wash"
                  >
                    <span className="font-medium text-ink">{suggestion.name}</span>
                    <span className="shrink-0 text-xs text-muted">
                      {suggestion.category ?? suggestion.sku}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="border-b border-line px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
                Recent searches
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {recent.map((item) => (
                  <li key={item}>
                    <button
                      type="button"
                      onMouseDown={() => {
                        setTerm(item);
                        router.push(`/search?q=${encodeURIComponent(item)}`);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-wash px-3 py-1 text-xs text-ink-soft hover:border-brand-200"
                    >
                      <Clock className="size-3" aria-hidden />
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
