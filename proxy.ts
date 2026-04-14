import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  try {
    const authCookie = request.cookies.get("tc_auth");
    if (
      !authCookie?.value &&
      !request.nextUrl.pathname.startsWith("/login")
    ) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  } catch {
    // Allow request through if proxy errors
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
