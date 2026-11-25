import { describe, expect, it } from "vitest";
import {
  FREE_RESEARCH_IMAGE_LIMIT,
  PRO_RESEARCH_IMAGE_LIMIT,
  getResearchImageLimit,
  isPro,
} from "./pro";

describe("pro helpers", () => {
  it("returns false and free limit for null/free projects", () => {
    expect(isPro(null)).toBe(false);
    expect(isPro({})).toBe(false);
    expect(isPro({ is_pro: false, plan: "free" })).toBe(false);
    expect(getResearchImageLimit(null)).toBe(FREE_RESEARCH_IMAGE_LIMIT);
    expect(getResearchImageLimit({})).toBe(10);
  });

  it("returns true and pro limit for active pro projects", () => {
    const now = Date.parse("2026-11-24T12:00:00.000Z");
    expect(isPro({ is_pro: true }, now)).toBe(true);
    expect(isPro({ is_pro: 1 }, now)).toBe(true);
    expect(isPro({ plan: "pro" }, now)).toBe(true);
    expect(isPro({ pro_until: "2026-12-01T00:00:00.000Z" }, now)).toBe(true);
    expect(getResearchImageLimit({ is_pro: true }, now)).toBe(
      PRO_RESEARCH_IMAGE_LIMIT,
    );
    expect(getResearchImageLimit({ plan: "pro" }, now)).toBe(12);
  });

  it("treats expired pro_until as free", () => {
    const now = Date.parse("2026-11-24T12:00:00.000Z");
    expect(
      isPro({ pro_until: "2026-11-01T00:00:00.000Z", is_pro: true }, now),
    ).toBe(false);
    expect(
      getResearchImageLimit({ pro_until: "2026-11-01T00:00:00.000Z" }, now),
    ).toBe(FREE_RESEARCH_IMAGE_LIMIT);
  });
});
