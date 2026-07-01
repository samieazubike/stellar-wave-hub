import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "./lib/auth";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("swh_token")?.value;
  const pathname = request.nextUrl.pathname;

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const auth = verifyToken(token);
    if (!auth || auth.role !== "admin") {
      return NextResponse.redirect(new URL("/explore", request.url));
    }
  }

  // Protect authenticated routes
  if (
    pathname.startsWith("/submit") ||
    pathname.startsWith("/my-projects") ||
    pathname.startsWith("/profile")
  ) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/submit", "/my-projects", "/profile"],
};
