import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ── In-memory sliding-window rate limiter (per IP) ───────────────────────────
// Resets on cold start. 60 requests per minute per IP.
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const timestamps = (rateLimitMap.get(ip) ?? []).filter((t) => t > windowStart);
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return timestamps.length > RATE_LIMIT_MAX;
}

// ── Routes requiring a valid JWT ─────────────────────────────────────────────
const AUTH_REQUIRED = [
  "/api/auth/me",
  "/api/projects/my",
  "/api/ratings",
  "/api/upload",
  "/api/admin",
];

// ── Routes requiring admin role ──────────────────────────────────────────────
const ADMIN_REQUIRED = [
  "/api/admin",
  "/api/projects/pending",
];

function getIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

// Decode JWT payload without crypto verification.
// Route handlers remain the authoritative auth source.
function parseJwtPayload(token: string): { userId: number; role: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(payload));
    if (typeof decoded.userId !== "number" || typeof decoded.role !== "string") return null;
    return { userId: decoded.userId, role: decoded.role };
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Rate limiting
  const ip = getIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  const requiresAuth = AUTH_REQUIRED.some((p) => pathname.startsWith(p));
  const requiresAdmin = ADMIN_REQUIRED.some((p) => pathname.startsWith(p));

  if (requiresAuth || requiresAdmin) {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = parseJwtPayload(token);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (requiresAdmin && payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
