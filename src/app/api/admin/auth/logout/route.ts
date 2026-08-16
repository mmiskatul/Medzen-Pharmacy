import { ok, toResponse } from "@/lib/api";
import { audit } from "@/lib/audit";
import { destroySession, getSessionUser } from "@/lib/auth";
import { clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    await destroySession();
    if (user) {
      await audit({
        user,
        action: "auth.logout",
        entity: "User",
        entityId: user.id,
        ip: clientIp(request.headers),
      });
    }
    return ok({ signedOut: true });
  } catch (error) {
    return toResponse(error);
  }
}
