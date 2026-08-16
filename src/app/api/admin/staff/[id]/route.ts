import { fail, ok, parseJson, toResponse } from "@/lib/api";
import { audit } from "@/lib/audit";
import { hashPassword, requireUser, revokeAllSessions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clientIp } from "@/lib/rate-limit";
import { staffSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

/** Guard against removing or demoting the last active super admin. */
async function wouldOrphanSuperAdmin(id: string) {
  const remaining = await prisma.user.count({
    where: {
      role: "SUPER_ADMIN",
      isActive: true,
      deletedAt: null,
      id: { not: id },
    },
  });
  return remaining === 0;
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    const actor = await requireUser("staff.write");
    const { id } = await params;
    const parsed = await parseJson(request, staffSchema.partial());
    if (parsed.response) return parsed.response;
    const input = parsed.data;

    const target = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, role: true, isActive: true },
    });
    if (!target) return fail("That staff account no longer exists.", 404);

    const losingSuperAdmin =
      target.role === "SUPER_ADMIN" &&
      ((input.role && input.role !== "SUPER_ADMIN") || input.isActive === false);

    if (losingSuperAdmin && (await wouldOrphanSuperAdmin(id))) {
      return fail(
        "This is the last active super admin. Promote another account first.",
        409,
      );
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(input.name ? { name: input.name } : {}),
        ...(input.email ? { email: input.email.toLowerCase() } : {}),
        ...(input.role ? { role: input.role } : {}),
        ...(input.extraPerms ? { extraPerms: input.extraPerms } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        ...(input.password
          ? { passwordHash: await hashPassword(input.password), failedLogins: 0, lockedUntil: null }
          : {}),
      },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    // A password change or deactivation invalidates existing sessions.
    if (input.password || input.isActive === false) {
      await revokeAllSessions(id);
    }

    await audit({
      user: actor,
      action: "staff.updated",
      entity: "User",
      entityId: id,
      meta: {
        role: input.role,
        isActive: input.isActive,
        passwordChanged: Boolean(input.password),
      },
      ip: clientIp(request.headers),
    });

    return ok(updated);
  } catch (error) {
    return toResponse(error);
  }
}

export async function DELETE(request: Request, { params }: Context) {
  try {
    const actor = await requireUser("staff.write");
    const { id } = await params;

    if (id === actor.id) {
      return fail("You cannot remove your own account.", 409);
    }
    if (await wouldOrphanSuperAdmin(id)) {
      const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
      if (target?.role === "SUPER_ADMIN") {
        return fail(
          "This is the last active super admin. Promote another account first.",
          409,
        );
      }
    }

    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    await revokeAllSessions(id);

    await audit({
      user: actor,
      action: "staff.deactivated",
      entity: "User",
      entityId: id,
      ip: clientIp(request.headers),
    });

    return ok({ id });
  } catch (error) {
    return toResponse(error);
  }
}
