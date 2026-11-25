import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkRateLimit, rateLimitExceededResponse } from "./rate-limit";

describe("checkRateLimit", () => {
  let key: string;
  let sequence = 0;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    // Buckets persist on globalThis: never share a key between test cases.
    key = `rate-limit-test-${++sequence}`;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows exactly the limit, then blocks repeated attempts", () => {
    const options = { limit: 3, windowMs: 10_000 };
    for (let request = 0; request < options.limit; request++) {
      expect(checkRateLimit(key, options)).toEqual({ allowed: true });
    }
    for (let request = 0; request < 2; request++) {
      expect(checkRateLimit(key, options)).toEqual({
        allowed: false,
        retryAfterSeconds: 10,
      });
    }
  });

  it("keeps separate keys independent", () => {
    const options = { limit: 1, windowMs: 10_000 };
    expect(checkRateLimit(key, options)).toEqual({ allowed: true });
    expect(checkRateLimit(key, options).allowed).toBe(false);
    expect(checkRateLimit(`${key}-other`, options)).toEqual({ allowed: true });
  });

  it("resets at the exact window boundary without extending it on rejection", () => {
    const options = { limit: 2, windowMs: 10_000 };
    expect(checkRateLimit(key, options)).toEqual({ allowed: true });
    expect(checkRateLimit(key, options)).toEqual({ allowed: true });

    vi.advanceTimersByTime(9_999);
    expect(checkRateLimit(key, options)).toEqual({
      allowed: false,
      retryAfterSeconds: 1,
    });

    vi.advanceTimersByTime(1);
    expect(checkRateLimit(key, options)).toEqual({ allowed: true });
    expect(checkRateLimit(key, options)).toEqual({ allowed: true });
    expect(checkRateLimit(key, options).allowed).toBe(false);
  });

  it("expires staggered hits individually in a sliding window", () => {
    const options = { limit: 2, windowMs: 10_000 };
    expect(checkRateLimit(key, options)).toEqual({ allowed: true });
    vi.advanceTimersByTime(4_000);
    expect(checkRateLimit(key, options)).toEqual({ allowed: true });
    expect(checkRateLimit(key, options)).toEqual({
      allowed: false,
      retryAfterSeconds: 6,
    });

    vi.advanceTimersByTime(6_000);
    expect(checkRateLimit(key, options)).toEqual({ allowed: true });
    expect(checkRateLimit(key, options)).toEqual({
      allowed: false,
      retryAfterSeconds: 4,
    });

    vi.advanceTimersByTime(4_000);
    expect(checkRateLimit(key, options)).toEqual({ allowed: true });
    expect(checkRateLimit(key, options).allowed).toBe(false);
  });

  it("rounds Retry-After upward and keeps it at least one second", () => {
    const options = { limit: 1, windowMs: 2_500 };
    expect(checkRateLimit(key, options)).toEqual({ allowed: true });
    expect(checkRateLimit(key, options)).toEqual({
      allowed: false,
      retryAfterSeconds: 3,
    });
    vi.advanceTimersByTime(1_501);
    expect(checkRateLimit(key, options)).toEqual({
      allowed: false,
      retryAfterSeconds: 1,
    });
  });

  it("allows requests again after a long idle period", () => {
    const options = { limit: 1, windowMs: 1_000 };
    expect(checkRateLimit(key, options)).toEqual({ allowed: true });
    vi.advanceTimersByTime(60_000);
    expect(checkRateLimit(key, options)).toEqual({ allowed: true });
  });
});

describe("rateLimitExceededResponse", () => {
  it.each([1, 7, 60])("returns HTTP 429 with Retry-After %i", async (seconds) => {
    const response = rateLimitExceededResponse(seconds);

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe(String(seconds));
    expect(response.headers.get("Content-Type")).toContain("application/json");
    await expect(response.json()).resolves.toEqual({
      error: "Rate limit exceeded",
      retryAfterSeconds: seconds,
    });
  });
});
