import { describe, expect, it } from "vitest";
import { hasMinRole } from "./roles";

describe("hasMinRole", () => {
  it.each([
    ["contributor", "contributor", true],
    ["contributor", "maintainer", false],
    ["contributor", "admin", false],
    ["maintainer", "contributor", true],
    ["maintainer", "maintainer", true],
    ["maintainer", "admin", false],
    ["admin", "contributor", true],
    ["admin", "maintainer", true],
    ["admin", "admin", true],
  ] as const)("hasMinRole(%s, %s) returns %s", (userRole, minRole, expected) => {
    expect(hasMinRole(userRole, minRole)).toBe(expected);
  });

  it.each(["unknown", "", "Admin", " admin ", "constructor", "toString", "__proto__"])(
    "rejects unknown user role %j for every known minimum",
    (userRole) => {
      for (const minRole of ["contributor", "maintainer", "admin"]) {
        expect(hasMinRole(userRole, minRole)).toBe(false);
      }
    },
  );

  // Characterize the existing -1 fallback; callers must supply a known minimum.
  it.each(["contributor", "maintainer", "admin", "unknown", ""])(
    "treats an unknown minimum as level -1 for user role %j",
    (userRole) => {
      expect(hasMinRole(userRole, "unknown")).toBe(true);
      expect(hasMinRole(userRole, "")).toBe(true);
    },
  );
});
