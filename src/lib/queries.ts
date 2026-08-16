import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "./prisma";
import { mediaUrl } from "./storage";

/**
 * Read layer for the public site. Every query here filters to published,
 * non-deleted rows and projects only public-safe fields — internal stock
 * counts, cost data and admin notes never leave this module.
 */

export type PublicProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  summary: string | null;
  priceFils: number | null;
  compareAtFils: number | null;
  currency: string;
  prescriptionRequired: boolean;
  categoryName: string | null;
  categorySlug: string | null;
  brandName: string | null;
  brandSlug: string | null;
  imageUrl: string | null;
  // Customers see a coarse signal, never the exact quantity on the shelf.
  availability: "in_stock" | "low" | "out_of_stock" | "on_request";
};

const publicProductSelect = {
  id: true,
  name: true,
  slug: true,
  sku: true,
  summary: true,
  priceFils: true,
  compareAtFils: true,
  currency: true,
  prescriptionRequired: true,
  category: { select: { name: true, slug: true } },
  brand: { select: { name: true, slug: true } },
  images: { select: { key: true }, orderBy: { sortOrder: "asc" }, take: 1 },
  inventory: { select: { quantity: true, lowStockAt: true } },
} satisfies Prisma.ProductSelect;

type RawPublicProduct = Prisma.ProductGetPayload<{
  select: typeof publicProductSelect;
}>;

function toPublicProduct(row: RawPublicProduct): PublicProduct {
  const inventory = row.inventory;
  let availability: PublicProduct["availability"] = "on_request";
  if (inventory) {
    if (inventory.quantity <= 0) availability = "out_of_stock";
    else if (inventory.quantity <= inventory.lowStockAt) availability = "low";
    else availability = "in_stock";
  }

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sku: row.sku,
    summary: row.summary,
    priceFils: row.priceFils,
    compareAtFils: row.compareAtFils,
    currency: row.currency,
    prescriptionRequired: row.prescriptionRequired,
    categoryName: row.category?.name ?? null,
    categorySlug: row.category?.slug ?? null,
    brandName: row.brand?.name ?? null,
    brandSlug: row.brand?.slug ?? null,
    imageUrl: mediaUrl(row.images[0]?.key),
    availability,
  };
}

export const PUBLISHED = {
  status: "PUBLISHED",
  deletedAt: null,
} satisfies Prisma.ProductWhereInput;

// ---------------------------------------------------------------- listing

export type ProductSort = "popular" | "newest" | "price_asc" | "price_desc";

export type ProductFilters = {
  q?: string;
  categories?: string[];
  brands?: string[];
  minFils?: number;
  maxFils?: number;
  inStockOnly?: boolean;
  prescription?: "yes" | "no";
  sort?: ProductSort;
  page?: number;
  perPage?: number;
};

const ORDER_BY: Record<ProductSort, Prisma.ProductOrderByWithRelationInput[]> = {
  popular: [{ isFeatured: "desc" }, { viewCount: "desc" }, { name: "asc" }],
  newest: [{ createdAt: "desc" }],
  price_asc: [{ priceFils: { sort: "asc", nulls: "last" } }],
  price_desc: [{ priceFils: { sort: "desc", nulls: "last" } }],
};

export function buildProductWhere(
  filters: ProductFilters,
): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { ...PUBLISHED };
  const and: Prisma.ProductWhereInput[] = [];

  if (filters.q) {
    const term = filters.q.trim();
    and.push({
      OR: [
        { name: { contains: term, mode: "insensitive" } },
        { summary: { contains: term, mode: "insensitive" } },
        { sku: { contains: term, mode: "insensitive" } },
        { brand: { name: { contains: term, mode: "insensitive" } } },
        { category: { name: { contains: term, mode: "insensitive" } } },
      ],
    });
  }
  if (filters.categories?.length) {
    and.push({ category: { slug: { in: filters.categories } } });
  }
  if (filters.brands?.length) {
    and.push({ brand: { slug: { in: filters.brands } } });
  }
  if (filters.minFils !== undefined || filters.maxFils !== undefined) {
    and.push({
      priceFils: {
        ...(filters.minFils !== undefined ? { gte: filters.minFils } : {}),
        ...(filters.maxFils !== undefined ? { lte: filters.maxFils } : {}),
      },
    });
  }
  if (filters.inStockOnly) {
    and.push({ inventory: { quantity: { gt: 0 } } });
  }
  if (filters.prescription) {
    and.push({ prescriptionRequired: filters.prescription === "yes" });
  }

  if (and.length) where.AND = and;
  return where;
}

export async function listProducts(filters: ProductFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const perPage = Math.min(48, Math.max(1, filters.perPage ?? 12));
  const where = buildProductWhere(filters);

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: publicProductSelect,
      orderBy: ORDER_BY[filters.sort ?? "popular"],
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: rows.map(toPublicProduct),
    total,
    page,
    perPage,
    pageCount: Math.max(1, Math.ceil(total / perPage)),
  };
}

export async function getFeaturedProducts(take = 8) {
  const rows = await prisma.product.findMany({
    where: { ...PUBLISHED, isFeatured: true },
    select: publicProductSelect,
    orderBy: [{ updatedAt: "desc" }],
    take,
  });
  return rows.map(toPublicProduct);
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findFirst({
    where: { ...PUBLISHED, slug },
    select: {
      ...publicProductSelect,
      description: true,
      usageInfo: true,
      keyInfo: true,
      metaTitle: true,
      metaDescription: true,
      images: { select: { key: true, alt: true }, orderBy: { sortOrder: "asc" } },
    },
  });
  if (!product) return null;

  return {
    ...toPublicProduct(product as RawPublicProduct),
    description: product.description,
    usageInfo: product.usageInfo,
    keyInfo: product.keyInfo,
    metaTitle: product.metaTitle,
    metaDescription: product.metaDescription,
    gallery: product.images
      .map((image) => ({ url: mediaUrl(image.key), alt: image.alt }))
      .filter((image): image is { url: string; alt: string | null } =>
        Boolean(image.url),
      ),
  };
}

export async function getRelatedProducts(
  productId: string,
  categorySlug: string | null,
  take = 4,
) {
  if (!categorySlug) return [];
  const rows = await prisma.product.findMany({
    where: {
      ...PUBLISHED,
      id: { not: productId },
      category: { slug: categorySlug },
    },
    select: publicProductSelect,
    take,
    orderBy: [{ isFeatured: "desc" }, { viewCount: "desc" }],
  });
  return rows.map(toPublicProduct);
}

// ---------------------------------------------------------------- taxonomy

export async function getActiveCategories() {
  const rows = await prisma.category.findMany({
    where: { isActive: true, deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      icon: true,
      imageKey: true,
      _count: { select: { products: { where: PUBLISHED } } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    icon: row.icon,
    imageUrl: mediaUrl(row.imageKey),
    productCount: row._count.products,
  }));
}

export async function getActiveBrands() {
  const rows = await prisma.brand.findMany({
    where: { isActive: true, deletedAt: null },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      logoKey: true,
      _count: { select: { products: { where: PUBLISHED } } },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    logoUrl: mediaUrl(row.logoKey),
    productCount: row._count.products,
  }));
}

// ---------------------------------------------------------------- content

export async function getActiveServices() {
  return prisma.service.findMany({
    where: { isActive: true, deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  });
}

export async function getPublishedFaqs() {
  return prisma.faq.findMany({
    where: { isPublished: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

/** Only verified *and* published testimonials are ever returned. */
export async function getPublishedTestimonials() {
  return prisma.testimonial.findMany({
    where: { isPublished: true, isVerified: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: 6,
  });
}

export async function getActiveBanners() {
  const now = new Date();
  const rows = await prisma.banner.findMany({
    where: {
      isActive: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    orderBy: [{ sortOrder: "asc" }],
  });
  return rows.map((row) => ({ ...row, imageUrl: mediaUrl(row.imageKey) }));
}

// ---------------------------------------------------------------- search

export async function searchSuggestions(term: string, take = 6) {
  const trimmed = term.trim();
  if (trimmed.length < 2) return [];
  const rows = await prisma.product.findMany({
    where: buildProductWhere({ q: trimmed }),
    select: {
      name: true,
      slug: true,
      sku: true,
      category: { select: { name: true } },
    },
    take,
    orderBy: [{ isFeatured: "desc" }, { viewCount: "desc" }],
  });
  return rows.map((row) => ({
    name: row.name,
    slug: row.slug,
    sku: row.sku,
    category: row.category?.name ?? null,
  }));
}

/** Fire-and-forget view counter; a failure must never break a page render. */
export async function recordProductView(slug: string) {
  await prisma.product
    .updateMany({ where: { slug, ...PUBLISHED }, data: { viewCount: { increment: 1 } } })
    .catch(() => undefined);
}
