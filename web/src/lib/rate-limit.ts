type RateLimitContext = {
  count: number;
  resetTime: number;
};

const rateLimits = new Map<string, RateLimitContext>();

export function rateLimit(identifier: string, limit: number, windowMs: number) {
  const now = Date.now();
  const windowContext = rateLimits.get(identifier);

  if (!windowContext || now > windowContext.resetTime) {
    rateLimits.set(identifier, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: limit - 1, resetTime: now + windowMs };
  }

  if (windowContext.count >= limit) {
    return { success: false, remaining: 0, resetTime: windowContext.resetTime };
  }

  windowContext.count += 1;
  return { 
    success: true, 
    remaining: limit - windowContext.count, 
    resetTime: windowContext.resetTime 
  };
}

export function getRetryAfterHeader(resetTime: number): string {
  return Math.ceil((resetTime - Date.now()) / 1000).toString();
}