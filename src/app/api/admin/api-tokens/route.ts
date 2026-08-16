import { z } from "zod";

import { ok, parseJson, toResponse } from "@/lib/api";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { issueApiToken } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  label: z
    .string()
    .trim()
    .min(2, "Give the token a label so you can recognise it later.")
    .max(120, "Labels can be up to 120 characters."),
});

/**
 * Issues a long-lived API bearer token for scripts and CLI tools. The
 * token is returned exactly once — store it immediately. Revocation is
 * done by deleting the row via DELETE on the same path; list via GET.
 */
export async function GET() {
  try {
    await requireUser("settings.write");
    const tokens = await prisma.staffApiToken.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        label: true,
        jti: true,
        userId: true,
        expiresAt: true,
        revokedAt: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });
    return ok({ items: tokens, total: tokens.length });
  } catch (error) {
    return toResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser("settings.write");
    const ip = clientIp(request.headers);
    const parsed = await parseJson(request, createSchema);
    if (parsed.response) return parsed.response;

    const issued = await issueApiToken({
      userId: user.id,
      label: parsed.data.label,
    });

    await audit({
      user,
      action: "api_token.issued",
      entity: "StaffApiToken",
      entityId: issued.jti,
      meta: { label: parsed.data.label },
      ip,
    });

    return ok(
      {
        token: issued.token,
        jti: issued.jti,
        expiresAt: issued.expiresAt,
      },
      { status: 201 },
    );
  } catch (error) {
    return toResponse(error);
  }
}