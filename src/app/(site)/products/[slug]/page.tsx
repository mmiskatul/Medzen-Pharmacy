import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Info, ShieldAlert } from "lucide-react";

import { ProductCard } from "@/components/site/product-card";
import { ProductGallery } from "@/components/site/product-gallery";
import { ProductPurchasePanel } from "@/components/site/product-purchase-panel";
import { Badge, SectionHeading } from "@/components/ui/primitives";
import { publicEnv } from "@/lib/env";
import {
  getProductBySlug,
  getRelatedProducts,
  recordProductView,
} from "@/lib/queries";
import { getSettings } from "@/lib/site-settings.server";
import { formatPrice, truncate } from "@/lib/utils";

export const revalidate = 120;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };

  const description =
    product.metaDescription ||
    product.summary ||
    truncate(product.description ?? `${product.name} at Medzen Pharmacy.`, 155);

  return {
    title: product.metaTitle || product.name,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.metaTitle || product.name,
      description,
      type: "website",
      url: `${publicEnv.siteUrl}/products/${product.slug}`,
      ...(product.imageUrl
        ? { images: [{ url: `${publicEnv.siteUrl}${product.imageUrl}` }] }
        : {}),
    },
  };
}

const AVAILABILITY_LABEL = {
  in_stock: "In stock",
  low: "Low stock",
  out_of_stock: "Out of stock",
  on_request: "Available on request",
} as const;

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([
    getProductBySlug(slug),
    getSettings(),
  ]);

  if (!product) notFound();

  // Counting a view must never delay or break the render.
  void recordProductView(slug);

  const related = await getRelatedProducts(product.id, product.categorySlug);
  const showPrice = settings.commerce.showPrices;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    ...(product.summary ? { description: product.summary } : {}),
    ...(product.brandName
      ? { brand: { "@type": "Brand", name: product.brandName } }
      : {}),
    ...(showPrice && product.priceFils !== null
      ? {
          offers: {
            "@type": "Offer",
            price: (product.priceFils / 100).toFixed(2),
            priceCurrency: product.currency,
            availability:
              product.availability === "out_of_stock"
                ? "https://schema.org/OutOfStock"
                : "https://schema.org/InStock",
            url: `${publicEnv.siteUrl}/products/${product.slug}`,
          },
        }
      : {}),
  };

  return (
    <div className="container-page py-8 lg:py-12">
      <nav aria-label="Breadcrumb" className="mb-7">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-muted">
          <li>
            <Link href="/" className="hover:text-brand-800">
              Home
            </Link>
          </li>
          <ChevronRight className="size-3.5" aria-hidden />
          <li>
            <Link href="/products" className="hover:text-brand-800">
              Products
            </Link>
          </li>
          {product.categorySlug && product.categoryName ? (
            <>
              <ChevronRight className="size-3.5" aria-hidden />
              <li>
                <Link
                  href={`/products?category=${product.categorySlug}`}
                  className="hover:text-brand-800"
                >
                  {product.categoryName}
                </Link>
              </li>
            </>
          ) : null}
          <ChevronRight className="size-3.5" aria-hidden />
          <li aria-current="page" className="font-medium text-ink">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <ProductGallery images={product.gallery} productName={product.name} />

        <div>
          {product.brandName ? (
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              {product.brandName}
            </p>
          ) : null}

          <h1 className="mt-1.5 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            {product.name}
          </h1>

          {product.summary ? (
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
              {product.summary}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Badge tone={product.availability === "out_of_stock" ? "muted" : "brand"}>
              {AVAILABILITY_LABEL[product.availability]}
            </Badge>
            {product.categoryName ? (
              <Badge tone="neutral">{product.categoryName}</Badge>
            ) : null}
            <Badge tone="muted" className="tnum">
              SKU {product.sku}
            </Badge>
          </div>

          {showPrice ? (
            <p className="tnum mt-6 text-3xl font-bold text-ink">
              {formatPrice(product.priceFils, product.currency)}
              {product.compareAtFils &&
              product.priceFils &&
              product.compareAtFils > product.priceFils ? (
                <span className="ml-3 text-lg font-medium text-muted line-through">
                  {formatPrice(product.compareAtFils, product.currency)}
                </span>
              ) : null}
            </p>
          ) : (
            <p className="mt-6 text-lg font-medium text-muted">
              Message us for the current price.
            </p>
          )}

          {product.prescriptionRequired ? (
            <div className="mt-6 flex gap-3 rounded-xl border border-rx-line bg-rx-bg p-4">
              <ShieldAlert className="mt-0.5 size-5 shrink-0 text-rx" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-rx">
                  Prescription may be required
                </p>
                <p className="mt-1 text-sm leading-relaxed text-rx/90">
                  Availability and dispensing are subject to applicable UAE
                  pharmacy regulations and pharmacist approval. Our team will
                  confirm before anything is prepared.
                </p>
              </div>
            </div>
          ) : null}

          <div className="mt-7">
            <ProductPurchasePanel
              product={product}
              whatsapp={settings.contact.whatsapp}
              showPrice={showPrice}
            />
          </div>

          <div className="mt-8 space-y-6 border-t border-line pt-8">
            {product.description ? (
              <section>
                <h2 className="text-base font-semibold text-ink">Description</h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">
                  {product.description}
                </p>
              </section>
            ) : null}

            {product.keyInfo ? (
              <section>
                <h2 className="text-base font-semibold text-ink">
                  Key information
                </h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">
                  {product.keyInfo}
                </p>
              </section>
            ) : null}

            {product.usageInfo ? (
              <section>
                <h2 className="text-base font-semibold text-ink">How to use</h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">
                  {product.usageInfo}
                </p>
              </section>
            ) : null}

            <div className="flex gap-3 rounded-xl border border-line bg-wash p-4">
              <Info className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
              <p className="text-xs leading-relaxed text-muted">
                Product information is provided by the manufacturer and is
                general in nature. Always read the label and speak to our
                pharmacist or your doctor about what is right for you.
              </p>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-16 border-t border-line pt-12 lg:mt-20">
          <SectionHeading
            eyebrow="Same aisle"
            title={`More in ${product.categoryName}`}
          />
          <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} showPrice={showPrice} />
            ))}
          </div>
        </section>
      ) : null}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
    </div>
  );
}
