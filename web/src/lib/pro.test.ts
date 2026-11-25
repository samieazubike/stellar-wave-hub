import { describe, expect, it } from "vitest";
import { isPro } from "./pro";

describe("isPro", () => {
	const now = Date.parse("2026-11-25T12:00:00.000Z");

	it("returns true for a future Pro expiration", () => {
		expect(isPro({ pro_until: "2026-11-26T12:00:00.000Z" }, now)).toBe(true);
	});

	it("returns false for an expired Pro plan", () => {
		expect(isPro({ pro_until: "2026-11-24T12:00:00.000Z" }, now)).toBe(false);
	});

	it("returns false when no valid Pro expiration is set", () => {
		expect(isPro({}, now)).toBe(false);
		expect(isPro({ pro_until: "not-a-date" }, now)).toBe(false);
	});
});
