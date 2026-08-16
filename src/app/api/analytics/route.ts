import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Privacy-conscious page counter.
 *
 * Stores a path and a day bucket, nothing else — no IP, no user agent, no
 * cookie, no visitor identifier. Two people cannot be told apart in this
 * table, and a single person's route through the site cannot be
 * reconstructed from it. The client IP is used only to rate limit the
 * endpoint and is never written.
 */
const bodySchema = z.object({
  path: z
    .string()
    .max(200)
    // Same-site paths only, so an arbitrary string cannot be injected
    // into the analytics table.
    .regex(/^\/[a-zA-Z0-9\-/_]*$/, "Invalid path"),
});

export async function POST(request: Request) {
  const limit = rateLimit(`pv:${clientIp(request.headers)}`, 120, 60_000);
  if (!limit.ok) return new NextResponse(null, { status: 204 });

  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) return new NextResponse(null, { status: 204 });

    // Product detail paths are collapsed so the table cannot become a
    // record of which specific medicine an individual looked at.
    const path = parsed.data.path.startsWith("/products/")
      ? "/products/[product]"
      : parsed.data.path;

    const day = new Date();
    day.setUTCHours(0, 0, 0, 0);

    await prisma.pageView.upsert({
      where: { path_day: { path, day } },
      create: { path, day, count: 1 },
      update: { count: { increment: 1 } },
    });
  } catch {
    // Analytics must never affect the visitor's experience.
  }

  return new NextResponse(null, { status: 204 });
}
