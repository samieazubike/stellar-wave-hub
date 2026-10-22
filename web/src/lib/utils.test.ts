import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
	it("joins class names", () => {
		expect(cn("flex", "items-center")).toBe("flex items-center");
	});

	it("lets later Tailwind utilities win over conflicting earlier ones", () => {
		expect(cn("px-2", "px-4")).toBe("px-4");
	});

	it("ignores falsy values", () => {
		expect(cn("text-sm", false, undefined, null, "")).toBe("text-sm");
	});
});
