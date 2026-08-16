import { z } from "zod";

import { fail, ok, parseJson, toResponse } from "@/lib/api";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { notify } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { clientIp } from "@/lib/rate-limit";
import { getSettings } from "@/lib/site-settings.server";
import { inventoryAdjustSchema, inventorySettingsSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

const bodySchema = z.union([
  z.object({ kind: z.literal("adjust") }).and(inventoryAdjustSchema),
  z.object({ kind: z.literal("settings") }).and(inventorySettingsSchema),
]);

export async function GET(_request: Request, { params }: Context) {
  try {
    await requireUser("inventory.read");
    const { id } = await params;
    const inventory = await prisma.inventory.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: { user: { select: { name: true } } },
        },
      },
    });
    if (!inventory) return fail("That stock record no longer exists.", 404);
    return ok(inventory);
  } catch (error) {
    return toResponse(error);
  }
}

/**
 * Two operations share this endpoint: an adjustment (which writes a
 * movement record) and a settings change (threshold, batch, expiry).
 * Adjustments run in a transaction so quantity and history cannot drift.
 */
export async function PATCH(request: Request, { params }: Context) {
  try {
    const user = await requireUser("inventory.write");
    const { id } = await params;
    const parsed = await parseJson(request, bodySchema);
    if (parsed.response) return parsed.response;
    const body = parsed.data;

    if (body.kind === "settings") {
      const updated = await prisma.inventory.update({
        where: { id },
        data: {
          lowStockAt: body.lowStockAt,
          batchNumber: body.batchNumber || null,
          expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
          shelfLocation: body.shelfLocation || null,
        },
      });
      await audit({
        user,
        action: "inventory.settings_updated",
        entity: "Inventory",
        entityId: id,
        meta: { lowStockAt: body.lowStockAt },
        ip: clientIp(request.headers),
      });
      return ok(updated);
    }

    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.inventory.findUnique({
        where: { id },
        include: { product: { select: { name: true } } },
      });
      if (!current) throw new Error("MISSING_INVENTORY");

      const quantityAfter = Math.max(0, current.quantity + body.delta);

      const updated = await tx.inventory.update({
        where: { id },
        data: { quantity: quantityAfter },
      });

      await tx.inventoryTransaction.create({
        data: {
          inventoryId: id,
          delta: body.delta,
          quantityAfter,
          reason: body.reason,
          note: body.note || null,
          userId: user.id,
        },
      });

      return { updated, productName: current.product.name, quantityAfter };
    });

    const settings = await getSettings();
    if (
      settings.notifications.lowStockAlerts &&
      result.quantityAfter <= result.updated.lowStockAt
    ) {
      await notify({
        type: "LOW_STOCK",
        title:
          result.quantityAfter <= 0
            ? `Out of stock: ${result.productName}`
            : `Low stock: ${result.productName}`,
        body: `${result.quantityAfter} remaining (threshold ${result.updated.lowStockAt}).`,
        href: "/admin/inventory",
      });
    }

    await audit({
      user,
      action: "inventory.adjusted",
      entity: "Inventory",
      entityId: id,
      meta: { delta: body.delta, reason: body.reason, quantityAfter: result.quantityAfter },
      ip: clientIp(request.headers),
    });

    return ok(result.updated);
  } catch (error) {
    if (error instanceof Error && error.message === "MISSING_INVENTORY") {
      return fail("That stock record no longer exists.", 404);
    }
    return toResponse(error);
  }
}
