import { fail, ok, toResponse } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { clientIp, LIMITS, rateLimit } from "@/lib/rate-limit";
import { searchSuggestions } from "@/lib/queries";

export const runtime = "nodejs";

/** Type-ahead suggestions for the search page. */
export async function GET(request: Request) {
  try {
    const ip = clientIp(request.headers);
    const limit = rateLimit(`search:${ip}`, LIMITS.search.limit, LIMITS.search.windowMs);
    if (!limit.ok) return fail("Too many searches. Pause for a moment.", 429);

    const term = new URL(request.url).searchParams.get("q")?.trim() ?? "";
    if (term.length < 2) return ok({ suggestions: [] });

    const suggestions = await searchSuggestions(term);

    // Analytics: the term and result count only. No visitor identifier.
    void prisma.searchQuery
      .create({ data: { term: term.slice(0, 80), results: suggestions.length } })
      .catch(() => undefined);

    return ok({ suggestions });
  } catch (error) {
    return toResponse(error);
  }
}
