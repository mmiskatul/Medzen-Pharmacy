import { fail, ok, parseJson, toResponse } from "@/lib/api";
import { audit } from "@/lib/audit";
import { signOrderStatus } from "@/lib/jwt";
import { notify } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { clientIp, LIMITS, rateLimit } from "@/lib/rate-limit";
import { getSettings } from "@/lib/site-settings.server";
import { generateReference } from "@/lib/utils";
import { orderRequestSchema } from "@/lib/validation";

import { randomBytes } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Order *requests*. No payment is taken here — the pharmacy confirms
 * stock and total before anything is prepared. Prices are re-read from
 * the database, never trusted from the client payload.
 */
export async function POST(request: Request) {
  try {
    const ip = clientIp(request.headers);
    const limit = rateLimit(`order:${ip}`, LIMITS.order.limit, LIMITS.order.windowMs);
    if (!limit.ok) {
      return fail(
        "You have sent several order requests already. Message us on WhatsApp to follow up.",
        429,
        undefined,
        { headers: { "Retry-After": String(limit.retryAfterSeconds) } },
      );
    }

    const parsed = await parseJson(request, orderRequestSchema);
    if (parsed.response) return parsed.response;
    const data = parsed.data;

    if (data.website) return ok({ reference: generateReference("MZ") });

    const settings = await getSettings();

    const products = await prisma.product.findMany({
      where: {
        id: { in: data.items.map((item) => item.productId) },
        status: "PUBLISHED",
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        sku: true,
        priceFils: true,
        prescriptionRequired: true,
      },
    });

    if (products.length === 0) {
      return fail(
        "None of those products are available any more. Refresh your basket and try again.",
        422,
      );
    }

    const byId = new Map(products.map((product) => [product.id, product]));
    const items = data.items
      .map((item) => {
        const product = byId.get(item.productId);
        if (!product) return null;
        const unitFils = product.priceFils ?? 0;
        return {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          unitFils,
          quantity: item.quantity,
          lineFils: unitFils * item.quantity,
          prescriptionRequired: product.prescriptionRequired,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    const subtotalFils = items.reduce((sum, item) => sum + item.lineFils, 0);
    const { deliveryFeeFils, freeDeliveryOverFils } = settings.commerce;
    const deliveryFils =
      data.fulfilment === "DELIVERY" &&
      (freeDeliveryOverFils === 0 || subtotalFils < freeDeliveryOverFils)
        ? deliveryFeeFils
        : 0;

    const email = data.email ? data.email : null;
    const customer = await prisma.customer.upsert({
      where: { phone: data.phone },
      create: {
        name: data.name,
        phone: data.phone,
        email,
        address: data.address || null,
      },
      update: {
        name: data.name,
        ...(email ? { email } : {}),
        ...(data.address ? { address: data.address } : {}),
      },
    });

    const reference = generateReference("MZ");
    const order = await prisma.order.create({
      data: {
        reference,
        customerId: customer.id,
        customerName: data.name,
        customerPhone: data.phone,
        customerEmail: email,
        fulfilment: data.fulfilment,
        deliveryAddress: data.address || null,
        notes: data.notes || null,
        subtotalFils,
        deliveryFils,
        totalFils: subtotalFils + deliveryFils,
        items: { create: items },
        events: {
          create: { status: "PENDING", message: "Request received from the website." },
        },
      },
      select: { id: true, reference: true },
    });

    const needsPrescription = items.some((item) => item.prescriptionRequired);

    await notify({
      type: "NEW_ORDER",
      title: `New order request ${order.reference}`,
      body: `${data.name} · ${items.length} ${items.length === 1 ? "item" : "items"}${
        needsPrescription ? " · includes a prescription item" : ""
      }`,
      href: `/admin/orders/${order.id}`,
    });

    await audit({
      user: null,
      action: "order.requested",
      entity: "Order",
      entityId: order.id,
      meta: { reference: order.reference, itemCount: items.length },
      ip,
    });

    return ok(
      {
        reference: order.reference,
        needsPrescription,
        droppedItems: data.items.length - items.length,
        // JWT lets the customer come back to /status/[token] without
        // needing an account. Treat it like a magic link.
        statusToken: signOrderStatus({
          sub: order.id,
          kind: "order",
          jti: randomBytes(16).toString("base64url"),
        }),
      },
      { status: 201 },
    );
  } catch (error) {
    return toResponse(error);
  }
}
