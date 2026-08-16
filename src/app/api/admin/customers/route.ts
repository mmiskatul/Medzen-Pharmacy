import type { Prisma } from "@prisma/client";

import { ok, toResponse } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireUser("customers.read");
    const url = new URL(request.url);
    const term = url.searchParams.get("q")?.trim();
    const page = Math.max(1, Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
    const perPage = Math.min(
      100,
      Math.max(1, Number.parseInt(url.searchParams.get("perPage") ?? "20", 10) || 20),
    );

    const where: Prisma.CustomerWhereInput = { deletedAt: null };
    if (term) {
      where.OR = [
        { name: { contains: term, mode: "insensitive" } },
        { phone: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          createdAt: true,
          _count: { select: { orders: true, prescriptions: true } },
          orders: {
            select: { createdAt: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.customer.count({ where }),
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
