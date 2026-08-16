import { fail, ok, parseJson, toResponse } from "@/lib/api";
import { notify } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { clientIp, LIMITS, rateLimit } from "@/lib/rate-limit";
import { contactMessageSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public contact form intake. */
export async function POST(request: Request) {
  try {
    const ip = clientIp(request.headers);
    const limit = rateLimit(`msg:${ip}`, LIMITS.contact.limit, LIMITS.contact.windowMs);
    if (!limit.ok) {
      return fail(
        "You have sent several messages already. Message us on WhatsApp if it is urgent.",
        429,
        undefined,
        { headers: { "Retry-After": String(limit.retryAfterSeconds) } },
      );
    }

    const parsed = await parseJson(request, contactMessageSchema);
    if (parsed.response) return parsed.response;
    const data = parsed.data;

    if (data.website) return ok({ received: true });

    const created = await prisma.contactMessage.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        subject: data.subject,
        message: data.message,
      },
      select: { id: true },
    });

    await notify({
      type: "NEW_MESSAGE",
      title: `New message: ${data.subject}`,
      body: `${data.name} · ${data.phone}`,
      href: `/admin/messages`,
    });

    return ok({ received: true, id: created.id }, { status: 201 });
  } catch (error) {
    return toResponse(error);
  }
}
