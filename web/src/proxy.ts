import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import {
  checkRateLimit,
  getClientIdentifier,
  RATE_LIMIT_RULES,
} from "@/lib/rateLimit";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  const protectedApiRoutes = ["/api/projects/pending", "/api/projects/my"];

  const isProtectedApi = protectedApiRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedApi) {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Determine rate limiting rules for sensitive endpoints
  let rateLimitConfig: { limit: number; windowMs: number; category: string } | null = null;

  if (method === "POST" && pathname.startsWith("/api/auth/")) {
    rateLimitConfig = { ...RATE_LIMIT_RULES.auth, category: "auth" };
  } else if (method === "POST" && pathname === "/api/projects") {
    rateLimitConfig = { ...RATE_LIMIT_RULES.projectSubmit, category: "projectSubmit" };
  } else if (
    (method === "POST" && pathname === "/api/ratings") ||
    (method === "DELETE" && pathname.startsWith("/api/ratings/"))
  ) {
    rateLimitConfig = { ...RATE_LIMIT_RULES.ratings, category: "ratings" };
  }

  if (rateLimitConfig) {
    let userId: number | null = null;
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const payload = verifyToken(authHeader.slice(7));
      if (payload?.userId) {
        userId = payload.userId;
      }
    }

    const clientId = getClientIdentifier(request, userId);
    const key = `${clientId}:${rateLimitConfig.category}`;

    const rlResult = checkRateLimit(
      key,
      rateLimitConfig.limit,
      rateLimitConfig.windowMs
    );

    if (!rlResult.success) {
      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
          retryAfter: rlResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rlResult.retryAfter),
            "X-RateLimit-Limit": String(rlResult.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(rlResult.reset),
          },
        }
      );
    }

    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", String(rlResult.limit));
    response.headers.set("X-RateLimit-Remaining", String(rlResult.remaining));
    response.headers.set("X-RateLimit-Reset", String(rlResult.reset));
    return response;
  }

  return NextResponse.next();
}

export const middleware = proxy;

export const config = {
  matcher: ["/api/:path*"],
};
