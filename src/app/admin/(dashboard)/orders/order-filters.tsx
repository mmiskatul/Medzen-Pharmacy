"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { Select } from "@/components/ui/field";
import { Card } from "@/components/ui/primitives";

/**
 * Filters for the server-rendered order and prescription tables. State
 * lives in the URL so a filtered view can be bookmarked or shared with a
 * colleague.
 */
export function OrderFilters({
  statuses,
  searchPlaceholder = "Search by reference, name or phone",
}: {
  statuses: { value: string; label: string }[];
  searchPlaceholder?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [term, setTerm] = React.useState(params.get("q") ?? "");

  function push(next: URLSearchParams) {
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
  }

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      const current = params.get("q") ?? "";
      if (term === current) return;
      const next = new URLSearchParams(params.toString());
      if (term.trim()) next.set("q", term.trim());
      else next.delete("q");
      push(next);
    }, 350);
    return () => window.clearTimeout(timer);
    // `push` and `params` are stable enough for this debounce; re-running
    // on every params change would fight the user's typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  return (
    <Card className="p-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div>
          <label htmlFor="table-search" className="sr-only">
            Search
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-line-strong px-3.5 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/25">
            <Search className="size-4 shrink-0 text-muted" aria-hidden />
            <input
              id="table-search"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted/80"
              autoComplete="off"
            />
          </div>
        </div>

        <div>
          <label htmlFor="table-status" className="sr-only">
            Filter by status
          </label>
          <Select
            id="table-status"
            className="sm:w-56"
            value={params.get("status") ?? ""}
            onChange={(event) => {
              const next = new URLSearchParams(params.toString());
              if (event.target.value) next.set("status", event.target.value);
              else next.delete("status");
              push(next);
            }}
          >
            <option value="">All statuses</option>
            {statuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </Card>
  );
}
