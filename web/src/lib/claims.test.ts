import { describe, expect, it } from "vitest";
import { claimExpiryCutoff, isClaimActive, parseClaimTtlMinutes } from "./claims";

const now = Date.parse("2026-10-22T12:00:00Z");
const minutesAgo = (m: number) => new Date(now - m * 60_000).toISOString();

describe("parseClaimTtlMinutes", () => {
  it("uses the default for negative, non-numeric, and non-finite values", () => {
    expect(parseClaimTtlMinutes("-5")).toBe(30);
    expect(parseClaimTtlMinutes("not-a-number")).toBe(30);
    expect(parseClaimTtlMinutes("Infinity")).toBe(30);
  });
});

describe("isClaimActive", () => {
  it("is active within the TTL", () => {
    expect(isClaimActive({ claimed_by: 7, claimed_at: minutesAgo(29) }, 30, now)).toBe(true);
  });

  it("expires at the TTL", () => {
    expect(isClaimActive({ claimed_by: 7, claimed_at: minutesAgo(30) }, 30, now)).toBe(false);
  });

  it("is inactive without a claimer or timestamp", () => {
    expect(isClaimActive({ claimed_by: null, claimed_at: minutesAgo(1) }, 30, now)).toBe(false);
    expect(isClaimActive({ claimed_by: 7, claimed_at: null }, 30, now)).toBe(false);
    expect(isClaimActive({ claimed_by: 7, claimed_at: "not a date" }, 30, now)).toBe(false);
    expect(isClaimActive(null, 30, now)).toBe(false);
  });
});

describe("claimExpiryCutoff", () => {
  it("returns the timestamp one TTL ago", () => {
    expect(claimExpiryCutoff(30, now)).toBe(minutesAgo(30));
  });
});
