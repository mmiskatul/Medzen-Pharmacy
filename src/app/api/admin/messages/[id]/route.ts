import { ok, parseJson, toResponse } from "@/lib/api";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clientIp } from "@/lib/rate-limit";
import { messageUpdateSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  try {
    const user = await requireUser("messages.update");
    const { id } = await params;
    const parsed = await parseJson(request, messageUpdateSchema);
    if (parsed.response) return parsed.response;

    const updated = await prisma.contactMessage.update({
      where: { id },
      data: { status: parsed.data.status },
    });

    await audit({
      user,
      action: "message.status_changed",
      entity: "ContactMessage",
      entityId: id,
      meta: { status: parsed.data.status },
      ip: clientIp(request.headers),
    });

    return ok({ id: updated.id, status: updated.status });
  } catch (error) {
    return toResponse(error);
  }
}

export async function DELETE(request: Request, { params }: Context) {
  try {
    const user = await requireUser("messages.update");
    const { id } = await params;
    await prisma.contactMessage.delete({ where: { id } });
    await audit({
      user,
      action: "message.deleted",
      entity: "ContactMessage",
      entityId: id,
      ip: clientIp(request.headers),
    });
    return ok({ id });
  } catch (error) {
    return toResponse(error);
  }
}
