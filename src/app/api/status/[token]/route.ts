import { NextResponse } from "next/server";

import { ok, toResponse } from "@/lib/api";
import { verifyOrderStatus } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public status lookup by JWT. The customer-facing /status/[token] page
 * hits this route with the token returned at submission time. The token
 * is signed and audience-checked, so a tampered or replay-from-another-
 * kind token is rejected before the database is touched.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    let claims;
    try {
      claims = verifyOrderStatus(token);
    } catch {
      // Don't leak which check failed — bad token, expired, or wrong
      // audience all surface as a 404 to the customer.
      return new NextResponse("Not found", { status: 404 });
    }

    if (claims.kind === "order") {
      const order = await prisma.order.findUnique({
        where: { id: claims.sub },
        select: {
          reference: true,
          status: true,
          paymentStatus: true,
          fulfilment: true,
          totalFils: true,
          currency: true,
          createdAt: true,
          updatedAt: true,
          events: {
            orderBy: { createdAt: "asc" },
            select: { status: true, message: true, createdAt: true },
          },
        },
      });
      if (!order) return new NextResponse("Not found", { status: 404 });
      return ok({
        kind: "order" as const,
        reference: order.reference,
        status: order.status,
        paymentStatus: order.paymentStatus,
        fulfilment: order.fulfilment,
        totalFils: order.totalFils,
        currency: order.currency,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        events: order.events,
      });
    }

    const prescription = await prisma.prescriptionRequest.findUnique({
      where: { id: claims.sub },
      select: {
        reference: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        resolutionMessage: true,
        reviewedAt: true,
      },
    });
    if (!prescription) return new NextResponse("Not found", { status: 404 });
    return ok({
      kind: "prescription" as const,
      reference: prescription.reference,
      status: prescription.status,
      createdAt: prescription.createdAt,
      updatedAt: prescription.updatedAt,
      resolutionMessage: prescription.resolutionMessage,
      reviewedAt: prescription.reviewedAt,
    });
  } catch (error) {
    return toResponse(error);
  }
}