import { NextResponse } from "next/server";

import { redeemMagicLink } from "@/lib/customer-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Verifies a magic-link token and exchanges it for a long-lived
 * customer cookie session. Redirects to the customer area on success,
 * or to /login with an error flag on failure.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const customer = await redeemMagicLink(token);

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  if (!customer) {
    return NextResponse.redirect(`${origin}/login?magic=invalid`);
  }
  return NextResponse.redirect(`${origin}/account`);
}