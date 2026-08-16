import { ok, toResponse } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireUser();
    const unreadOnly = new URL(request.url).searchParams.get("unread") === "1";

    const [items, unread] = await Promise.all([
      prisma.notification.findMany({
        where: unreadOnly ? { readAt: null } : {},
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.notification.count({ where: { readAt: null } }),
    ]);

    return ok({ items, unread });
  } catch (error) {
    return toResponse(error);
  }
}

/** Marks one notification read, or all of them when no id is given. */
export async function PATCH(request: Request) {
  try {
    await requireUser();
    const id = new URL(request.url).searchParams.get("id");

    if (id) {
      await prisma.notification.update({
        where: { id },
        data: { readAt: new Date() },
      });
    } else {
      await prisma.notification.updateMany({
        where: { readAt: null },
        data: { readAt: new Date() },
      });
    }

    return ok({ unread: await prisma.notification.count({ where: { readAt: null } }) });
  } catch (error) {
    return toResponse(error);
  }
}
