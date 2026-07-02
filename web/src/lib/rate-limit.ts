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
