import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/auth-cookie";
import { safeRedirectPath } from "@/lib/safe-redirect";

export function proxy(request: NextRequest) {
  if (!request.cookies.get(SESSION_COOKIE_NAME)?.value) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set(
      "next",
      safeRedirectPath(`${request.nextUrl.pathname}${request.nextUrl.search}`),
    );
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/timeline/:path*",
    "/planning/:path*",
    "/wallet/:path*",
    "/transactions/:path*",
    "/categories/:path*",
    "/notifications/:path*",
    "/settings/:path*",
  ],
};
