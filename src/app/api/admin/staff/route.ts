import { fail, ok, parseJson, toResponse } from "@/lib/api";
import { audit } from "@/lib/audit";
import { hashPassword, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clientIp } from "@/lib/rate-limit";
import { staffSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SAFE_FIELDS = {
  id: true,
  name: true,
  email: true,
  role: true,
  extraPerms: true,
  isActive: true,
  lastLoginAt: true,
  lockedUntil: true,
  createdAt: true,
} as const;

export async function GET() {
  try {
    await requireUser("staff.read");
    const items = await prisma.user.findMany({
      where: { deletedAt: null },
      select: SAFE_FIELDS,
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });
    return ok({ items, total: items.length });
  } catch (error) {
    return toResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser("staff.write");
    const parsed = await parseJson(request, staffSchema);
    if (parsed.response) return parsed.response;
    const input = parsed.data;

    if (!input.password) {
      return fail("Set a password for the new account.", 422, {
        password: ["Set a password of at least 12 characters."],
      });
    }

    const created = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        role: input.role,
        extraPerms: input.extraPerms,
        isActive: input.isActive,
        passwordHash: await hashPassword(input.password),
      },
      select: SAFE_FIELDS,
    });

    await audit({
      user,
      action: "staff.created",
      entity: "User",
      entityId: created.id,
      meta: { email: created.email, role: created.role },
      ip: clientIp(request.headers),
    });

    return ok(created, { status: 201 });
  } catch (error) {
    return toResponse(error);
  }
}
