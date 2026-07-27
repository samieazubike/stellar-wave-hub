import { checkRateLimit, getClientIdentifier } from "../src/lib/rateLimit";

function runTests() {
  console.log("--- Starting Rate Limiting Unit Tests ---");

  const key = "test:ip:127.0.0.1:auth";
  const limit = 5;
  const windowMs = 60 * 1000;

  // 1. Send 5 requests (should succeed)
  for (let i = 1; i <= limit; i++) {
    const res = checkRateLimit(key, limit, windowMs);
    console.log(`Request ${i}: success=${res.success}, remaining=${res.remaining}`);
    if (!res.success) {
      console.error(`FAILED: Request ${i} should have succeeded!`);
      process.exit(1);
    }
  }

  // 2. Send 6th request (should fail with 429 & retryAfter)
  const throttled = checkRateLimit(key, limit, windowMs);
  console.log(
    `Request 6 (Throttled): success=${throttled.success}, remaining=${throttled.remaining}, retryAfter=${throttled.retryAfter}s`
  );

  if (throttled.success || throttled.retryAfter <= 0) {
    console.error("FAILED: 6th request should have been throttled with retryAfter > 0!");
    process.exit(1);
  }

  // 3. Test user identifier vs IP identifier
  const reqDummy = new Request("http://localhost/api/auth/login", {
    headers: { "x-forwarded-for": "203.0.113.195, 10.0.0.1" },
  });

  const ipId = getClientIdentifier(reqDummy, null);
  const userId = getClientIdentifier(reqDummy, 42);

  console.log(`Client Identifier (IP): ${ipId}`);
  console.log(`Client Identifier (User): ${userId}`);

  if (ipId !== "ip:203.0.113.195") {
    console.error(`FAILED: Expected ip:203.0.113.195, got ${ipId}`);
    process.exit(1);
  }

  if (userId !== "user:42") {
    console.error(`FAILED: Expected user:42, got ${userId}`);
    process.exit(1);
  }

  console.log("--- ALL RATE LIMITING TESTS PASSED ---");
}

runTests();
