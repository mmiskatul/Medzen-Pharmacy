import type { Prisma } from "@prisma/client";

import { ok, toResponse } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireUser("orders.read");
    const url = new URL(request.url);
    const term = url.searchParams.get("q")?.trim();
    const status = url.searchParams.get("status");
    const page = Math.max(1, Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
    const perPage = Math.min(
      100,
      Math.max(1, Number.parseInt(url.searchParams.get("perPage") ?? "20", 10) || 20),
    );

    const where: Prisma.OrderWhereInput = { deletedAt: null };
    if (term) {
      where.OR = [
        { reference: { contains: term, mode: "insensitive" } },
        { customerName: { contains: term, mode: "insensitive" } },
        { customerPhone: { contains: term, mode: "insensitive" } },
      ];
    }
    if (status) where.status = status as Prisma.OrderWhereInput["status"];

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { _count: { select: { items: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.order.count({ where }),
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
