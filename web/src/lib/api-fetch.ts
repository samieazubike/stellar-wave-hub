import { getRetryAfterSeconds } from "./retry-after.mjs";

export class ApiFetchError extends Error {
  readonly status: number;
  readonly retryAfterSeconds: number | null;

  constructor(message: string, status: number, retryAfterSeconds: number | null = null) {
    super(message);
    this.name = "ApiFetchError";
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getErrorMessage(body: unknown, status: number): string {
  if (isRecord(body)) {
    for (const message of [body.error, body.message]) {
      if (typeof message === "string" && message.trim()) return message;
    }
  }
  return `Request failed (${status})`;
}

/** Fetch and decode an API response, preserving status and Retry-After on errors. */
export async function apiFetch<T = unknown>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T | null> {
  const response = await fetch(input, init);
  let body: unknown = null;
  const responseText = await response.text().catch(() => "");
  if (responseText) {
    try {
      body = JSON.parse(responseText) as unknown;
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    const retryAfterSeconds = response.status === 429
      ? getRetryAfterSeconds(response.headers.get("Retry-After"), body)
      : null;
    throw new ApiFetchError(
      getErrorMessage(body, response.status),
      response.status,
      retryAfterSeconds,
    );
  }

  return body as T | null;
}

export function isApiFetchError(error: unknown): error is ApiFetchError {
  return error instanceof ApiFetchError;
}
