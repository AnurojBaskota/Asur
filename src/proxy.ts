import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/server/session-token";

// Optimistic gate: bounce signed-out visitors away from admin pages.
// Every page and Server Action still calls requireAdmin() itself.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const signedIn = !!verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/admin/login") {
    return signedIn ? NextResponse.redirect(new URL("/admin", request.url)) : NextResponse.next();
  }
  if (!signedIn) return NextResponse.redirect(new URL("/admin/login", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
