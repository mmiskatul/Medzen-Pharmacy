import { z } from "zod";

import { ok, fail, parseJson, toResponse } from "@/lib/api";
import { issueMagicLinkToken } from "@/lib/customer-auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { optionalEmail } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  email: optionalEmail,
  website: z.string().max(0).optional(),
});

/**
 * Request a magic-link email for the customer area. Always returns the
 * same success message regardless of whether the email exists — the
 * route is rate-limited per IP, so a brute force probe cannot enumerate
 * the customer table. When SMTP isn't configured, the link is logged
 * server-side so a developer or operator can copy it.
 */
export async function POST(request: Request) {
  try {
    const ip = clientIp(request.headers);
    const limit = rateLimit(`magic:${ip}`, 5, 10 * 60 * 1000);
    if (!limit.ok) {
      return fail(
        "You've asked for several sign-in links recently. Try again shortly.",
        429,
        undefined,
        { headers: { "Retry-After": String(limit.retryAfterSeconds) } },
      );
    }

    const parsed = await parseJson(request, schema);
    if (parsed.response) return parsed.response;
    if (parsed.data.website) return ok({ sent: true });
    if (!parsed.data.email) return fail("Enter the email address on your account.", 422);

    const token = await issueMagicLinkToken(parsed.data.email);
    if (token) {
      // No SMTP is wired up yet; this log line is the integration point.
      // The link is the absolute URL the customer must click.
      const link = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/api/customer/magic-link/${token}`;
      console.info("[customer] magic link issued", { email: parsed.data.email, link });
    }

    return ok({ sent: true });
  } catch (error) {
    return toResponse(error);
  }
}