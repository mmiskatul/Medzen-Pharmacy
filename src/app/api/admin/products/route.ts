import type { Prisma } from "@prisma/client";

import { ok, parseJson, toResponse } from "@/lib/api";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clientIp } from "@/lib/rate-limit";
import { productSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin product list: includes drafts, stock levels and image counts. */
export async function GET(request: Request) {
  try {
    await requireUser("products.read");
    const url = new URL(request.url);
    const term = url.searchParams.get("q")?.trim();
    const status = url.searchParams.get("status");
    const categoryId = url.searchParams.get("categoryId");
    const page = Math.max(1, Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
    const perPage = Math.min(
      100,
      Math.max(1, Number.parseInt(url.searchParams.get("perPage") ?? "20", 10) || 20),
    );

    const where: Prisma.ProductWhereInput = { deletedAt: null };
    if (term) {
      where.OR = [
        { name: { contains: term, mode: "insensitive" } },
        { sku: { contains: term, mode: "insensitive" } },
      ];
    }
    if (status === "DRAFT" || status === "PUBLISHED") where.status = status;
    if (categoryId) where.categoryId = categoryId;

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          brand: { select: { id: true, name: true } },
          inventory: { select: { quantity: true, lowStockAt: true, expiryDate: true } },
          images: { select: { key: true }, orderBy: { sortOrder: "asc" }, take: 1 },
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.product.count({ where }),
    ]);

    return ok({
      items,
      total,
      page,
      perPage,
      pageCount: Math.max(1, Math.ceil(total / perPage)),
    });
  } catch (error) {
    return toResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser("products.write");
    const parsed = await parseJson(request, productSchema);
    if (parsed.response) return parsed.response;
    const input = parsed.data;

    // Every product gets an inventory row on creation, so the stock
    // module never has to deal with a missing relation.
    const created = await prisma.product.create({
      data: {
        name: input.name,
        slug: input.slug,
        sku: input.sku,
        summary: input.summary || null,
        description: input.description || null,
        usageInfo: input.usageInfo || null,
        keyInfo: input.keyInfo || null,
        priceFils: input.priceFils ?? null,
        compareAtFils: input.compareAtFils ?? null,
        categoryId: input.categoryId ?? null,
        brandId: input.brandId ?? null,
        prescriptionRequired: input.prescriptionRequired,
        status: input.status,
        isFeatured: input.isFeatured,
        metaTitle: input.metaTitle || null,
        metaDescription: input.metaDescription || null,
        images: {
          create: (input.imageKeys ?? []).map((key, index) => ({
            key,
            alt: input.name,
            sortOrder: index,
          })),
        },
        inventory: { create: {} },
      },
      select: { id: true, slug: true },
    });

    await audit({
      user,
      action: "product.created",
      entity: "Product",
      entityId: created.id,
      meta: { sku: input.sku, status: input.status },
      ip: clientIp(request.headers),
    });

    return ok(created, { status: 201 });
  } catch (error) {
    return toResponse(error);
  }
}
