import { ok, toResponse } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { getDashboardAnalytics } from "@/lib/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireUser("analytics.read");
    const range = new URL(request.url).searchParams.get("range");
    const days = range === "30" ? 30 : range === "365" ? 365 : 7;
    return ok(await getDashboardAnalytics(days));
  } catch (error) {
    return toResponse(error);
  }
}
