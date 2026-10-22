import test from "node:test";
import assert from "node:assert/strict";
import { ApiFetchError, apiFetch } from "../src/lib/api-fetch.ts";
import {
  getRetryAfterSeconds,
  MAX_RETRY_AFTER_SECONDS,
  parseRetryAfterHeader,
} from "../src/lib/retry-after.mjs";

test("parses Retry-After seconds", () => {
  assert.equal(parseRetryAfterHeader("15", 0), 15);
  assert.equal(parseRetryAfterHeader("1.2", 0), 2);
});

test("parses Retry-After as an HTTP date", () => {
  const now = Date.parse("Wed, 21 Oct 2015 07:27:00 GMT");
  assert.equal(parseRetryAfterHeader("Wed, 21 Oct 2015 07:28:00 GMT", now), 60);
  assert.equal(parseRetryAfterHeader("Wed, 21 Oct 2015 07:26:00 GMT", now), 0);
  assert.equal(parseRetryAfterHeader("Mon, 21 Oct 2015 07:28:00 GMT", now), null);
  assert.equal(parseRetryAfterHeader("Mon, 32 Oct 2015 07:28:00 GMT", now), null);
  assert.equal(
    getRetryAfterSeconds("Wed, 21 Oct 2015 07:26:00 GMT", { retryAfterSeconds: 9 }, now),
    0,
  );
});

test("uses JSON retryAfterSeconds when the header is missing or invalid", () => {
  assert.equal(getRetryAfterSeconds(null, { retryAfterSeconds: 9 }, 0), 9);
  assert.equal(getRetryAfterSeconds("tomorrow", { retryAfterSeconds: 4.2 }, 0), 5);
  assert.equal(getRetryAfterSeconds("invalid", { retryAfterSeconds: "4" }, 0), null);
  assert.equal(getRetryAfterSeconds(null, null, 0), null);
  assert.equal(getRetryAfterSeconds(null, { retryAfterSeconds: -2 }, 0), null);
  assert.equal(getRetryAfterSeconds(null, { retryAfterSeconds: Infinity }, 0), null);
  assert.equal(
    getRetryAfterSeconds(null, { retryAfterSeconds: Number.MAX_VALUE }, 0),
    MAX_RETRY_AFTER_SECONDS,
  );
});

test("a valid Retry-After header takes precedence over JSON fallback", () => {
  assert.equal(getRetryAfterSeconds("3", { retryAfterSeconds: 9 }, 0), 3);
});

test("apiFetch preserves 429 status, message, retry duration, and makes one request", async (t) => {
  let requestCount = 0;
  t.mock.method(globalThis, "fetch", async () => {
    requestCount += 1;
    return new Response(JSON.stringify({ error: "Please slow down" }), {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": "15" },
    });
  });

  await assert.rejects(apiFetch("/limited"), (error) => {
    assert.ok(error instanceof ApiFetchError);
    assert.equal(error.status, 429);
    assert.equal(error.retryAfterSeconds, 15);
    assert.equal(error.message, "Please slow down");
    return true;
  });
  assert.equal(requestCount, 1);
});

test("apiFetch handles malformed response JSON safely", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response("not json", {
    status: 429,
    headers: { "Retry-After": "invalid" },
  }));

  await assert.rejects(apiFetch("/limited"), (error) => {
    assert.ok(error instanceof ApiFetchError);
    assert.equal(error.status, 429);
    assert.equal(error.retryAfterSeconds, null);
    assert.equal(error.message, "Request failed (429)");
    return true;
  });
});

test("apiFetch uses the JSON retry duration when the header is invalid", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ retryAfterSeconds: 8 }), {
    status: 429,
    headers: { "Retry-After": "invalid" },
  }));
  await assert.rejects(apiFetch("/limited"), (error) => {
    assert.ok(error instanceof ApiFetchError);
    assert.equal(error.retryAfterSeconds, 8);
    return true;
  });
});

test("apiFetch retains ordinary server errors", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ message: "Invalid input" }), {
    status: 422,
  }));
  await assert.rejects(apiFetch("/invalid"), (error) => {
    assert.ok(error instanceof ApiFetchError);
    assert.equal(error.status, 422);
    assert.equal(error.retryAfterSeconds, null);
    assert.equal(error.message, "Invalid input");
    return true;
  });
});

test("apiFetch handles empty successful bodies", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response(null, { status: 204 }));
  assert.equal(await apiFetch("/empty"), null);
});

test("apiFetch returns successful JSON responses", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  }));
  assert.deepEqual(await apiFetch("/success"), { ok: true });
});
