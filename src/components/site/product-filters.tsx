"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";
import { cn } from "@/lib/utils";

export type FilterOption = { slug: string; name: string; productCount: number };

const SORTS = [
  { value: "popular", label: "Popular" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
] as const;

/**
 * Filters live in the URL, so a filtered view is shareable, survives a
 * refresh and works with the back button. Every change resets to page 1.
 */
export function ProductFilters({
  categories,
  brands,
  showPrices,
}: {
  categories: FilterOption[];
  brands: FilterOption[];
  showPrices: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = React.useState(false);

  const selectedCategories = params.getAll("category");
  const selectedBrands = params.getAll("brand");

  const update = React.useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(params.toString());
      mutate(next);
      next.delete("page");
      router.push(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [params, pathname, router],
  );

  function toggleMulti(key: "category" | "brand", value: string) {
    update((next) => {
      const current = next.getAll(key);
      next.delete(key);
      const isOn = current.includes(value);
      for (const item of current) {
        if (item !== value) next.append(key, item);
      }
      if (!isOn) next.append(key, value);
    });
  }

  function setSingle(key: string, value: string | null) {
    update((next) => {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    });
  }

  const activeCount =
    selectedCategories.length +
    selectedBrands.length +
    (params.get("min") ? 1 : 0) +
    (params.get("max") ? 1 : 0) +
    (params.get("stock") ? 1 : 0) +
    (params.get("rx") ? 1 : 0);

  const panel = (
    <div className="space-y-7">
      <fieldset>
        <legend className="text-sm font-semibold text-ink">Category</legend>
        <ul className="mt-3 space-y-1.5">
          {categories.map((category) => (
            <li key={category.slug}>
              <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1 text-sm text-ink-soft hover:text-ink">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category.slug)}
                  onChange={() => toggleMulti("category", category.slug)}
                  className="size-4 rounded border-line-strong text-brand-600 focus:ring-brand-500"
                />
                <span className="flex-1">{category.name}</span>
                <span className="tnum text-xs text-muted">{category.productCount}</span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      {brands.length > 0 ? (
        <fieldset>
          <legend className="text-sm font-semibold text-ink">Brand</legend>
          <ul className="mt-3 max-h-56 space-y-1.5 overflow-y-auto pr-1">
            {brands.map((brand) => (
              <li key={brand.slug}>
                <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1 text-sm text-ink-soft hover:text-ink">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand.slug)}
                    onChange={() => toggleMulti("brand", brand.slug)}
                    className="size-4 rounded border-line-strong text-brand-600 focus:ring-brand-500"
                  />
                  <span className="flex-1">{brand.name}</span>
                  <span className="tnum text-xs text-muted">{brand.productCount}</span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      ) : null}

      {showPrices ? (
        <fieldset>
          <legend className="text-sm font-semibold text-ink">Price (AED)</legend>
          <div className="mt-3 flex items-center gap-2">
            <Label htmlFor="price-min" className="sr-only">
              Minimum price
            </Label>
            <Input
              id="price-min"
              type="number"
              min={0}
              inputMode="decimal"
              placeholder="Min"
              defaultValue={params.get("min") ?? ""}
              onBlur={(event) => setSingle("min", event.target.value)}
              className="h-10"
            />
            <span className="text-muted" aria-hidden>
              –
            </span>
            <Label htmlFor="price-max" className="sr-only">
              Maximum price
            </Label>
            <Input
              id="price-max"
              type="number"
              min={0}
              inputMode="decimal"
              placeholder="Max"
              defaultValue={params.get("max") ?? ""}
              onBlur={(event) => setSingle("max", event.target.value)}
              className="h-10"
            />
          </div>
        </fieldset>
      ) : null}

      <fieldset className="space-y-2.5">
        <legend className="text-sm font-semibold text-ink">Availability</legend>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={params.get("stock") === "in"}
            onChange={(event) =>
              setSingle("stock", event.target.checked ? "in" : null)
            }
            className="size-4 rounded border-line-strong text-brand-600 focus:ring-brand-500"
          />
          In stock only
        </label>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold text-ink">Prescription</legend>
        <Select
          className="mt-3 h-10"
          aria-label="Prescription requirement"
          value={params.get("rx") ?? ""}
          onChange={(event) => setSingle("rx", event.target.value || null)}
        >
          <option value="">Any</option>
          <option value="no">No prescription needed</option>
          <option value="yes">Prescription required</option>
        </Select>
      </fieldset>

      {activeCount > 0 ? (
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => router.push(pathname)}
        >
          <X />
          Clear all filters
        </Button>
      ) : null}
    </div>
  );

  return (
    <>
      {/* Mobile: filters open in a sheet so the grid keeps full width. */}
      <div className="flex items-center gap-2 lg:hidden">
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
          <SlidersHorizontal />
          Filters
          {activeCount > 0 ? (
            <span className="tnum rounded-full bg-brand-600 px-1.5 text-[0.6875rem] font-bold text-white">
              {activeCount}
            </span>
          ) : null}
        </Button>
        <Label htmlFor="sort-mobile" className="sr-only">
          Sort products
        </Label>
        <Select
          id="sort-mobile"
          className="h-9 flex-1"
          value={params.get("sort") ?? "popular"}
          onChange={(event) => setSingle("sort", event.target.value)}
        >
          {SORTS.map((sort) => (
            <option key={sort.value} value={sort.value}>
              {sort.label}
            </option>
          ))}
        </Select>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-ink/40"
            onClick={() => setOpen(false)}
            aria-label="Close filters"
            tabIndex={-1}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink">Filters</h2>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close filters">
                <X />
              </Button>
            </div>
            {panel}
            <Button className="mt-6 w-full" onClick={() => setOpen(false)}>
              Show results
            </Button>
          </div>
        </div>
      ) : null}

      <aside className={cn("hidden lg:block")} aria-label="Product filters">
        <div className="sticky top-28 space-y-7 rounded-2xl border border-line bg-white p-5">
          <div>
            <Label htmlFor="sort-desktop">Sort by</Label>
            <Select
              id="sort-desktop"
              className="mt-2 h-10"
              value={params.get("sort") ?? "popular"}
              onChange={(event) => setSingle("sort", event.target.value)}
            >
              {SORTS.map((sort) => (
                <option key={sort.value} value={sort.value}>
                  {sort.label}
                </option>
              ))}
            </Select>
          </div>
          {panel}
        </div>
      </aside>
    </>
  );
}
