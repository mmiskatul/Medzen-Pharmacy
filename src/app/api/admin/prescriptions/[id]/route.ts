import { fail, ok, parseJson, toResponse } from "@/lib/api";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clientIp } from "@/lib/rate-limit";
import { prescriptionUpdateSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  try {
    await requireUser("prescriptions.read");
    const { id } = await params;

    const request_ = await prisma.prescriptionRequest.findUnique({
      where: { id },
      include: {
        // File ids and names only. The storage key never leaves the server.
        files: {
          select: {
            id: true,
            originalName: true,
            mimeType: true,
            sizeBytes: true,
            createdAt: true,
          },
        },
        assignedTo: { select: { id: true, name: true } },
        notesLog: {
          orderBy: { createdAt: "desc" },
          include: { user: { select: { name: true } } },
        },
        customer: { select: { id: true, name: true } },
      },
    });

    if (!request_) return fail("That request no longer exists.", 404);
    return ok(request_);
  } catch (error) {
    return toResponse(error);
  }
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    const user = await requireUser("prescriptions.update");
    const { id } = await params;
    const parsed = await parseJson(request, prescriptionUpdateSchema);
    if (parsed.response) return parsed.response;
    const { status, assignedToId, resolutionMessage, note } = parsed.data;

    const updated = await prisma.$transaction(async (tx) => {
      const record = await tx.prescriptionRequest.update({
        where: { id },
        data: {
          ...(status ? { status } : {}),
          ...(assignedToId !== undefined ? { assignedToId } : {}),
          ...(resolutionMessage !== undefined
            ? { resolutionMessage: resolutionMessage || null }
            : {}),
          // Stamped the first time a pharmacist moves it off pending.
          ...(status && status !== "PENDING" ? { reviewedAt: new Date() } : {}),
        },
      });

      if (note) {
        await tx.prescriptionNote.create({
          data: { requestId: id, userId: user.id, body: note },
        });
      }

      return record;
    });

    // The audit meta records the decision, never the clinical content.
    await audit({
      user,
      action: "prescription.updated",
      entity: "PrescriptionRequest",
      entityId: id,
      meta: { status, assignedToId, noteAdded: Boolean(note) },
      ip: clientIp(request.headers),
    });

    return ok({ id: updated.id, status: updated.status });
  } catch (error) {
    return toResponse(error);
  }
}
