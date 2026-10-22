import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");

describe("RoleBadge Component", () => {
  const roleBadgeFile = path.join(webRoot, "src", "components", "RoleBadge.tsx");
  const navbarFile = path.join(webRoot, "src", "components", "Navbar.tsx");
  const profileFile = path.join(webRoot, "src", "app", "profile", "page.tsx");

  test("should have RoleBadge component defined", () => {
    assert.ok(fs.existsSync(roleBadgeFile), "RoleBadge.tsx must exist");
    const content = fs.readFileSync(roleBadgeFile, "utf-8");

    // Check component structure
    assert.match(content, /interface RoleBadgeProps/, "Must define RoleBadgeProps interface");
    assert.match(content, /role:.*"contributor".*"maintainer".*"admin"/, "Must accept role prop with three variants");
    assert.match(content, /export default function RoleBadge/, "Must export RoleBadge function component");
  });

  test("should map roles to correct tag style classes", () => {
    assert.ok(fs.existsSync(roleBadgeFile), "RoleBadge.tsx must exist");
    const content = fs.readFileSync(roleBadgeFile, "utf-8");

    // Verify color mapping follows the design spec
    assert.match(content, /contributor.*tag-plasma/, "Contributor must use tag-plasma (cyan/blue)");
    assert.match(content, /maintainer.*tag-solar/, "Maintainer must use tag-solar (amber/orange)");
    assert.match(content, /admin.*tag-supernova/, "Admin must use tag-supernova (red)");
  });

  test("should use existing tag classes from globals.css", () => {
    assert.ok(fs.existsSync(roleBadgeFile), "RoleBadge.tsx must exist");
    const content = fs.readFileSync(roleBadgeFile, "utf-8");

    // Must use the .tag base class
    assert.match(content, /className=.*tag/, "Must use .tag base class from globals.css");
  });

  test("should include accessibility attributes", () => {
    assert.ok(fs.existsSync(roleBadgeFile), "RoleBadge.tsx must exist");
    const content = fs.readFileSync(roleBadgeFile, "utf-8");

    // Verify aria-label for screen readers
    assert.match(content, /aria-label/, "Must include aria-label for accessibility");
    assert.match(content, /role="img"/, "Must include role='img' for semantic meaning");
  });

  test("should render role labels with proper capitalization", () => {
    assert.ok(fs.existsSync(roleBadgeFile), "RoleBadge.tsx must exist");
    const content = fs.readFileSync(roleBadgeFile, "utf-8");

    // Check that labels are capitalized
    assert.match(content, /Contributor/, "Must display 'Contributor' label");
    assert.match(content, /Maintainer/, "Must display 'Maintainer' label");
    assert.match(content, /Admin/, "Must display 'Admin' label");
  });

  test("should be integrated into Navbar component", () => {
    assert.ok(fs.existsSync(navbarFile), "Navbar.tsx must exist");
    const content = fs.readFileSync(navbarFile, "utf-8");

    // Check import
    assert.match(content, /import.*RoleBadge.*from.*@\/components\/RoleBadge/, "Must import RoleBadge");

    // Check usage
    assert.match(content, /<RoleBadge\s+role={user\.role/, "Must render RoleBadge with user.role prop");
  });

  test("should be integrated into Profile page", () => {
    assert.ok(fs.existsSync(profileFile), "profile/page.tsx must exist");
    const content = fs.readFileSync(profileFile, "utf-8");

    // Check import
    assert.match(content, /import.*RoleBadge.*from.*@\/components\/RoleBadge/, "Must import RoleBadge");

    // Check usage
    assert.match(content, /<RoleBadge\s+role={user\.role/, "Must render RoleBadge with user.role prop");

    // Should replace the old inline tag
    assert.ok(
      !content.includes('className="tag tag-nova text-xs">{user.role}<'),
      "Old inline role tag should be replaced by RoleBadge component"
    );
  });

  test("should handle missing or invalid role gracefully", () => {
    assert.ok(fs.existsSync(roleBadgeFile), "RoleBadge.tsx must exist");
    const content = fs.readFileSync(roleBadgeFile, "utf-8");

    // Should have a fallback for unexpected roles
    assert.match(content, /\|\|.*tag-plasma/, "Must fallback to tag-plasma for invalid roles");
  });
});
