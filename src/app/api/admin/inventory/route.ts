import type { Prisma } from "@prisma/client";

import { ok, toResponse } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stock list with the three states the pharmacy acts on: out of stock,
 * at or below the low-stock threshold, and expiring within 90 days.
 */
export async function GET(request: Request) {
  try {
    await requireUser("inventory.read");
    const url = new URL(request.url);
    const filter = url.searchParams.get("filter");
    const term = url.searchParams.get("q")?.trim();

    const soon = new Date();
    soon.setDate(soon.getDate() + 90);

    const where: Prisma.InventoryWhereInput = { product: { deletedAt: null } };
    if (term) {
      where.product = {
        deletedAt: null,
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { sku: { contains: term, mode: "insensitive" } },
        ],
      };
    }
    if (filter === "out") where.quantity = { lte: 0 };
    if (filter === "expiring") {
      where.expiryDate = { not: null, lte: soon };
    }

    const rows = await prisma.inventory.findMany({
      where,
      include: {
        product: {
          select: { id: true, name: true, sku: true, status: true },
        },
      },
      orderBy: { quantity: "asc" },
      take: 200,
    });

    // "Low" compares two columns, which Prisma cannot express in a filter,
    // so it is applied after the query.
    const items =
      filter === "low"
        ? rows.filter((row) => row.quantity > 0 && row.quantity <= row.lowStockAt)
        : rows;

    return ok({ items, total: items.length });
  } catch (error) {
    return toResponse(error);
  }
}
