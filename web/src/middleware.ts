import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "./lib/auth";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("swh_token")?.value;
  
  // Protect admin routes
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    
    const auth = verifyToken(token);
    if (!auth || auth.role !== "admin") {
      return NextResponse.redirect(new URL("/explore", request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
