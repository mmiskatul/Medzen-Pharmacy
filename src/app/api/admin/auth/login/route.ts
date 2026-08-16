import { fail, ok, parseJson, toResponse } from "@/lib/api";
import { attemptLogin, createSession } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { clientIp, LIMITS, rateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const ip = clientIp(request.headers);
    const limit = rateLimit(`login:${ip}`, LIMITS.login.limit, LIMITS.login.windowMs);
    if (!limit.ok) {
      return fail(
        `Too many sign-in attempts. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.`,
        429,
        undefined,
        { headers: { "Retry-After": String(limit.retryAfterSeconds) } },
      );
    }

    const parsed = await parseJson(request, loginSchema);
    if (parsed.response) return parsed.response;
    const { email, password, remember } = parsed.data;

    const result = await attemptLogin(email, password);

    if (!result.ok) {
      await audit({
        user: null,
        action: "auth.login_failed",
        entity: "User",
        meta: { email, reason: result.reason },
        ip,
      });

      // The same message for a wrong password and an unknown address, so
      // the form cannot be used to discover which staff emails exist.
      if (result.reason === "locked") {
        return fail(
          "This account is temporarily locked after several failed attempts. Try again shortly or ask a super admin to help.",
          423,
        );
      }
      if (result.reason === "inactive") {
        return fail("This account has been deactivated. Contact a super admin.", 403);
      }
      return fail("That email and password combination is not recognised.", 401);
    }

    await createSession(result.user.id, {
      ip,
      userAgent: request.headers.get("user-agent") ?? undefined,
      remember,
    });

    await audit({
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        extraPerms: result.user.extraPerms,
      },
      action: "auth.login",
      entity: "User",
      entityId: result.user.id,
      ip,
    });

    return ok({ name: result.user.name, role: result.user.role });
  } catch (error) {
    return toResponse(error);
  }
}
