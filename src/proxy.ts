import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

// Optimistic check only: is there a session cookie at all? Pages still verify the
// session (requireUser / requireAdmin). This just gives signed-out visitors a real
// redirect before the page starts streaming.
export function proxy(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const url = new URL("/sign-in", request.url);
  url.searchParams.set("next", pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*", "/checkout/:path*"],
};
