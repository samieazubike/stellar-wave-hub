/**
 * Extract the client IP from a Next.js Request.
 * Tries x-forwarded-for first (reverse-proxy / CDN), then x-real-ip,
 * and falls back to "unknown" when neither header is present.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for may be a comma-separated list; the first entry is the client
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

type RateLimitBucket = {
  hits: number[];
};

type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

type RateLimitStore = Map<string, RateLimitBucket>;

const globalStore = globalThis as typeof globalThis & {
  __stellarWaveRateLimitStore?: RateLimitStore;
};

const buckets = globalStore.__stellarWaveRateLimitStore ?? new Map<string, RateLimitBucket>();
globalStore.__stellarWaveRateLimitStore = buckets;

export function checkRateLimit(
  key: string,
  options: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - options.windowMs;
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((hit) => hit > windowStart);

  if (bucket.hits.length >= options.limit) {
    const retryAfterMs = bucket.hits[0] + options.windowMs - now;
    buckets.set(key, bucket);

    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);

  return { allowed: true };
}

export function rateLimitExceededResponse(retryAfterSeconds: number): Response {
  return Response.json(
    {
      error: "Rate limit exceeded",
      retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
      },
    },
  );
}
