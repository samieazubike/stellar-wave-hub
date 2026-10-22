export const MAX_RETRY_AFTER_SECONDS = Math.floor(Number.MAX_SAFE_INTEGER / 1000);

/**
 * Parse a Retry-After header as either seconds or an HTTP date.
 * Returns null when the value is absent or invalid.
 */
export function parseRetryAfterHeader(value, now = Date.now()) {
  if (typeof value !== "string" || value.trim() === "") return null;
  const trimmed = value.trim();

  if (/^\d+(?:\.\d+)?$/.test(trimmed)) {
    const seconds = Number(trimmed);
    return Number.isFinite(seconds)
      ? Math.min(MAX_RETRY_AFTER_SECONDS, Math.max(0, Math.ceil(seconds)))
      : null;
  }

  if (!/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4} \d{2}:\d{2}:\d{2} GMT$/.test(trimmed)) {
    return null;
  }
  const timestamp = Date.parse(trimmed);
  if (!Number.isFinite(timestamp) || new Date(timestamp).toUTCString() !== trimmed) {
    return null;
  }
  return Math.min(
    MAX_RETRY_AFTER_SECONDS,
    Math.max(0, Math.ceil((timestamp - now) / 1000)),
  );
}

/** Use the response body duration only when the header is missing or invalid. */
export function getRetryAfterSeconds(header, body, now = Date.now()) {
  const headerSeconds = parseRetryAfterHeader(header, now);
  if (headerSeconds !== null) return headerSeconds;

  const fallback = body && typeof body === "object" ? body.retryAfterSeconds : undefined;
  if (typeof fallback !== "number" || !Number.isFinite(fallback) || fallback < 0) {
    return null;
  }
  return Math.min(MAX_RETRY_AFTER_SECONDS, Math.max(0, Math.ceil(fallback)));
}
