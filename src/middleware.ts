import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "medzen_session";

/**
 * Edge-level gate for the admin area. This is a cheap redirect for signed-out
 * visitors, not the authorisation check — the real check runs in the admin
 * layout and in every admin API route, where the session can be verified
 * against the database and permissions can be evaluated.
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/admin/login") {
    if (hasSession) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin") && !hasSession) {
    const url = new URL("/admin/login", request.url);
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
