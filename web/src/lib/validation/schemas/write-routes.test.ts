import { describe, expect, it } from "vitest";
import { createPromoCodeSchema } from "./promo-codes";
import { maintainerApplicationSchema, reviewMaintainerApplicationSchema } from "./maintainer-applications";
import { markNotificationsReadSchema } from "./notifications";
import { updateReportStatusSchema } from "./reports";

describe("createPromoCodeSchema", () => {
  it("normalizes a valid code", () => {
    const res = createPromoCodeSchema.safeParse({ code: " launch-10 ", percent_off: "10", max_uses: "", expires_at: "" });
    expect(res.success && res.data).toEqual({ code: "LAUNCH-10", percent_off: 10, max_uses: null, expires_at: null });
  });

  it.each([
    [{ code: "", percent_off: 10 }],
    [{ code: "OK", percent_off: 0 }],
    [{ code: "OK", percent_off: 101 }],
    [{ code: "BAD CODE", percent_off: 10 }],
    [{ code: "OK", percent_off: 10, max_uses: -1 }],
    [{ code: "OK", percent_off: 10, expires_at: "tomorrow" }],
  ])("rejects %j", (input) => {
    expect(createPromoCodeSchema.safeParse(input).success).toBe(false);
  });
});

describe("other write-route schemas", () => {
  it("validates maintainer applications and reviews", () => {
    expect(maintainerApplicationSchema.safeParse({ reason: "  " }).success).toBe(false);
    expect(maintainerApplicationSchema.safeParse({ reason: "I review DeFi weekly" }).success).toBe(true);
    expect(reviewMaintainerApplicationSchema.safeParse({ status: "approved" }).success).toBe(true);
    expect(reviewMaintainerApplicationSchema.safeParse({ status: "maybe" }).success).toBe(false);
  });

  it("validates notification ids", () => {
    expect(markNotificationsReadSchema.safeParse({ ids: [] }).success).toBe(false);
    const res = markNotificationsReadSchema.safeParse({ ids: [1, "2"] });
    expect(res.success && res.data.ids).toEqual(["1", "2"]);
  });

  it("validates report status updates", () => {
    expect(updateReportStatusSchema.safeParse({ id: "4", status: "resolved" }).success).toBe(true);
    expect(updateReportStatusSchema.safeParse({ id: 0, status: "resolved" }).success).toBe(false);
    expect(updateReportStatusSchema.safeParse({ id: 4, status: "open" }).success).toBe(false);
  });
});
