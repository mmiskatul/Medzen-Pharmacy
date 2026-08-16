import { fail, ok, parseJson, toResponse } from "@/lib/api";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clientIp } from "@/lib/rate-limit";
import { orderUpdateSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  try {
    await requireUser("orders.read");
    const { id } = await params;
    const order = await prisma.order.findFirst({
      where: { id, deletedAt: null },
      include: {
        items: true,
        events: {
          orderBy: { createdAt: "desc" },
          include: { user: { select: { name: true } } },
        },
        customer: { select: { id: true, name: true, phone: true } },
      },
    });
    if (!order) return fail("That order no longer exists.", 404);
    return ok(order);
  } catch (error) {
    return toResponse(error);
  }
}

/**
 * Status changes always append a timeline event, so the order history
 * shows who moved it and when — not just the current state.
 */
export async function PATCH(request: Request, { params }: Context) {
  try {
    const user = await requireUser("orders.update");
    const { id } = await params;
    const parsed = await parseJson(request, orderUpdateSchema);
    if (parsed.response) return parsed.response;
    const { status, paymentStatus, note } = parsed.data;

    if (!status && !paymentStatus && !note) {
      return fail("Nothing to update.", 422);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id },
        data: {
          ...(status ? { status } : {}),
          ...(paymentStatus ? { paymentStatus } : {}),
        },
      });

      const messages: string[] = [];
      if (status) messages.push(`Status set to ${status.replace(/_/g, " ").toLowerCase()}.`);
      if (paymentStatus) {
        messages.push(`Payment marked ${paymentStatus.replace(/_/g, " ").toLowerCase()}.`);
      }
      if (note) messages.push(note);

      await tx.orderEvent.create({
        data: {
          orderId: id,
          status: status ?? null,
          message: messages.join(" "),
          userId: user.id,
        },
      });

      return order;
    });

    await audit({
      user,
      action: "order.updated",
      entity: "Order",
      entityId: id,
      meta: { status, paymentStatus },
      ip: clientIp(request.headers),
    });

    return ok(updated);
  } catch (error) {
    return toResponse(error);
  }
}
