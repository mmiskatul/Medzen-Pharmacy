import { z } from "zod";

import { fail, ok, parseJson, toResponse } from "@/lib/api";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bulkSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, "Select at least one product.").max(200),
  action: z.enum(["publish", "unpublish", "delete", "set_category"]),
  categoryId: z.string().uuid().nullable().optional(),
});

/** Bulk actions from the product table's selection toolbar. */
export async function POST(request: Request) {
  try {
    const user = await requireUser("products.write");
    const parsed = await parseJson(request, bulkSchema);
    if (parsed.response) return parsed.response;
    const { ids, action, categoryId } = parsed.data;

    if (action === "set_category" && categoryId === undefined) {
      return fail("Choose the category to move these products into.", 422);
    }

    const where = { id: { in: ids }, deletedAt: null };
    let affected = 0;

    switch (action) {
      case "publish":
        affected = (await prisma.product.updateMany({ where, data: { status: "PUBLISHED" } }))
          .count;
        break;
      case "unpublish":
        affected = (await prisma.product.updateMany({ where, data: { status: "DRAFT" } }))
          .count;
        break;
      case "delete":
        affected = (
          await prisma.product.updateMany({
            where,
            data: { deletedAt: new Date(), status: "DRAFT" },
          })
        ).count;
        break;
      case "set_category":
        affected = (
          await prisma.product.updateMany({
            where,
            data: { categoryId: categoryId ?? null },
          })
        ).count;
        break;
    }

    await audit({
      user,
      action: `product.bulk_${action}`,
      entity: "Product",
      meta: { count: affected, ids: ids.length },
      ip: clientIp(request.headers),
    });

    return ok({ affected });
  } catch (error) {
    return toResponse(error);
  }
}
