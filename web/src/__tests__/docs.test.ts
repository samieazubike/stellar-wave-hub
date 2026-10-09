import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const repoRoot = path.resolve(__dirname, "../../..");

describe("README.md - Roles & Permissions section", () => {
  const readme = fs.readFileSync(
    path.join(repoRoot, "README.md"),
    "utf-8"
  );

  it("contains a Roles & Permissions heading", () => {
    expect(readme).toContain("## Roles & Permissions");
  });

  it("contains a table with role names", () => {
    expect(readme).toContain("| **Contributor**");
    expect(readme).toContain("| **Maintainer**");
    expect(readme).toContain("| **Admin**");
  });

  it("describes how roles are assigned", () => {
    expect(readme).toContain("How roles are assigned");
  });

  it("contains table separators in the section", () => {
    expect(readme).toContain("|---");
    expect(readme).toContain("`hasMinRole()`");
  });
});

describe("docs/MAINTAINERS.md - Roles & Permissions section", () => {
  const maintainers = fs.readFileSync(
    path.join(repoRoot, "docs", "MAINTAINERS.md"),
    "utf-8"
  );

  it("contains a Roles & Permissions heading", () => {
    expect(maintainers).toContain("## Roles & Permissions");
  });

  it("contains a table with all three roles", () => {
    expect(maintainers).toContain("Contributor");
    expect(maintainers).toContain("Maintainer");
    expect(maintainers).toContain("Admin");
  });

  it("references code locations for permission checks", () => {
    expect(maintainers).toContain("web/src/lib/roles.ts");
    expect(maintainers).toContain("web/src/app/admin/page.tsx");
  });
});
