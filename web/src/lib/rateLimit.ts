interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp in seconds
  retryAfter: number; // Seconds to wait
}

interface RateLimitRule {
  limit: number;
  windowMs: number;
}

export const RATE_LIMIT_RULES: Record<string, RateLimitRule> = {
  auth: { limit: 5, windowMs: 60 * 1000 }, // 5 requests per 60s
  projectSubmit: { limit: 5, windowMs: 10 * 60 * 1000 }, // 5 requests per 10m
  ratings: { limit: 10, windowMs: 60 * 1000 }, // 10 requests per 60s
};

// Global in-memory store for rate limit timestamp windows
const rateLimitMap = new Map<string, number[]>();
let lastCleanup = Date.now();


// Clean up expired keys periodically to prevent memory leaks.

function cleanupStore(now: number) {
  // Only cleanup once every 60 seconds
  if (now - lastCleanup < 60 * 1000) return;
  lastCleanup = now;

  for (const [key, timestamps] of rateLimitMap.entries()) {
    // remove key if newest timestamp is older than 10 minutes,
    const newest = timestamps[timestamps.length - 1];
    if (!newest || now - newest > 10 * 60 * 1000) {
      rateLimitMap.delete(key);
    }
  }
}

// Check and record a rate limit attempt using a sliding window algorithm.

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  cleanupStore(now);

  const windowStart = now - windowMs;
  let timestamps = rateLimitMap.get(key) || [];

  // Remove timestamps outside sliding window
  timestamps = timestamps.filter((t) => t > windowStart);

  if (timestamps.length >= limit) {
    const oldestTimestamp = timestamps[0];
    const resetMs = oldestTimestamp + windowMs;
    const retryAfter = Math.max(1, Math.ceil((resetMs - now) / 1000));
    const reset = Math.ceil(resetMs / 1000);

    rateLimitMap.set(key, timestamps);

    return {
      success: false,
      limit,
      remaining: 0,
      reset,
      retryAfter,
    };
  }

  timestamps.push(now);
  rateLimitMap.set(key, timestamps);

  const reset = Math.ceil((now + windowMs) / 1000);
  const remaining = limit - timestamps.length;

  return {
    success: true,
    limit,
    remaining,
    reset,
    retryAfter: 0,
  };
}

/**
 * Extract client identifier from request headers (IP) or authenticated user payload.
 */
export function getClientIdentifier(
  request: Request,
  userId?: number | string | null
): string {
  if (userId) {
    return `user:${userId}`;
  }

  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const ip = xff.split(",")[0].trim();
    if (ip) return `ip:${ip}`;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return `ip:${realIp.trim()}`;
  }

  return "ip:127.0.0.1";
}
