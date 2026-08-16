import type { Metadata } from "next";
import Link from "next/link";
import { PackageSearch } from "lucide-react";

import { Pagination } from "@/components/site/pagination";
import { ProductCard } from "@/components/site/product-card";
import { ProductFilters } from "@/components/site/product-filters";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/primitives";
import {
  getActiveBrands,
  getActiveCategories,
  listProducts,
  type ProductSort,
} from "@/lib/queries";
import { getSettings } from "@/lib/site-settings.server";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "Products",
  description:
    "Browse medicines, vitamins, personal care, baby care and wellness products stocked at Medzen Pharmacy in Umm Ramool, Dubai.",
  alternates: { canonical: "/products" },
};

type SearchParams = Record<string, string | string[] | undefined>;

function asArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function toFils(value: string | string[] | undefined): number | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return undefined;
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : undefined;
}

const SORTS: ProductSort[] = ["popular", "newest", "price_asc", "price_desc"];

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const rawSort = Array.isArray(params.sort) ? params.sort[0] : params.sort;
  const sort = SORTS.includes(rawSort as ProductSort)
    ? (rawSort as ProductSort)
    : "popular";
  const page = Math.max(
    1,
    Number.parseInt(
      (Array.isArray(params.page) ? params.page[0] : params.page) ?? "1",
      10,
    ) || 1,
  );

  const [settings, categories, brands, result] = await Promise.all([
    getSettings(),
    getActiveCategories(),
    getActiveBrands(),
    listProducts({
      q: (Array.isArray(params.q) ? params.q[0] : params.q) ?? undefined,
      categories: asArray(params.category),
      brands: asArray(params.brand),
      minFils: toFils(params.min),
      maxFils: toFils(params.max),
      inStockOnly: params.stock === "in",
      prescription:
        params.rx === "yes" ? "yes" : params.rx === "no" ? "no" : undefined,
      sort,
      page,
      perPage: 12,
    }),
  ]);

  function buildHref(nextPage: number) {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (key === "page" || value === undefined) continue;
      for (const item of asArray(value)) next.append(key, item);
    }
    next.set("page", String(nextPage));
    return `/products?${next.toString()}`;
  }

  return (
    <div className="container-page py-10 lg:py-14">
      <header className="max-w-2xl">
        <span className="eyebrow">Catalog</span>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Products
        </h1>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
          What we currently list online. Stock moves, so message the pharmacy to
          confirm before travelling — and note that some items need a valid
          prescription.
        </p>
      </header>

      <div className="mt-9 grid gap-8 lg:grid-cols-[16rem_1fr] lg:gap-10">
        <ProductFilters
          categories={categories.map((c) => ({
            slug: c.slug,
            name: c.name,
            productCount: c.productCount,
          }))}
          brands={brands.map((b) => ({
            slug: b.slug,
            name: b.name,
            productCount: b.productCount,
          }))}
          showPrices={settings.commerce.showPrices}
        />

        <section aria-label="Product results">
          <p className="tnum mb-4 text-sm text-muted" role="status">
            {result.total} {result.total === 1 ? "product" : "products"}
            {result.pageCount > 1
              ? ` · page ${result.page} of ${result.pageCount}`
              : ""}
          </p>

          {result.products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
                {result.products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    showPrice={settings.commerce.showPrices}
                  />
                ))}
              </div>
              <Pagination
                page={result.page}
                pageCount={result.pageCount}
                buildHref={buildHref}
              />
            </>
          ) : (
            <EmptyState
              icon={PackageSearch}
              title="Nothing matches those filters"
              description="Try removing a filter, or ask the pharmacy directly — we can often source items that are not listed here."
              action={
                <Button asChild variant="secondary">
                  <Link href="/products">Clear filters</Link>
                </Button>
              }
            />
          )}
        </section>
      </div>
    </div>
  );
}
