import type { Metadata } from "next";
import { MessageCircle, SearchX } from "lucide-react";

import { Pagination } from "@/components/site/pagination";
import { ProductCard } from "@/components/site/product-card";
import { SearchExperience } from "@/components/site/search-experience";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/primitives";
import { listProducts } from "@/lib/queries";
import { getSettings } from "@/lib/site-settings.server";
import { whatsappLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Search",
  description: "Search products stocked at Medzen Pharmacy in Umm Ramool, Dubai.",
  alternates: { canonical: "/search" },
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.q) ? params.q[0] : params.q;
  const term = (raw ?? "").trim();
  const page = Math.max(
    1,
    Number.parseInt(
      (Array.isArray(params.page) ? params.page[0] : params.page) ?? "1",
      10,
    ) || 1,
  );

  const settings = await getSettings();
  const result = term
    ? await listProducts({ q: term, page, perPage: 12 })
    : { products: [], total: 0, page: 1, pageCount: 1, perPage: 12 };

  return (
    <div className="container-page py-10 lg:py-14">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Search the catalog
        </h1>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
          Look up a product by name, brand, category or SKU.
        </p>
      </header>

      <div className="mx-auto mt-7 max-w-2xl">
        <SearchExperience initialTerm={term} />
      </div>

      <div className="mt-12">
        {!term ? (
          <EmptyState
            icon={SearchX}
            title="Start typing to search"
            description="Try a product name like “paracetamol”, a brand, or a category such as “baby care”."
          />
        ) : result.products.length > 0 ? (
          <>
            <p className="tnum mb-5 text-sm text-muted" role="status">
              {result.total} {result.total === 1 ? "result" : "results"} for “{term}”
            </p>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
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
              buildHref={(next) =>
                `/search?q=${encodeURIComponent(term)}&page=${next}`
              }
            />
          </>
        ) : (
          <EmptyState
            icon={SearchX}
            title={`Nothing found for “${term}”`}
            description="We may still be able to get it for you. Send us the name and we will check with our suppliers."
            action={
              <Button asChild variant="whatsapp">
                <a
                  href={whatsappLink(settings.contact.whatsapp, {
                    kind: "availability",
                    productName: term,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle />
                  Ask if we can get it
                </a>
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
}
