import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");

describe("Maintainer Submission Notifications", () => {
  const notificationsFile = path.join(webRoot, "src", "lib", "notifications.ts");
  const projectsApiFile = path.join(webRoot, "src", "app", "api", "projects", "route.ts");

  test("should have notifications service module", () => {
    assert.ok(fs.existsSync(notificationsFile), "notifications.ts must exist at src/lib/notifications.ts");
    const content = fs.readFileSync(notificationsFile, "utf-8");

    // Check exported functions
    assert.match(content, /export.*function getMaintainerUserIds/, "Must export getMaintainerUserIds function");
    assert.match(content, /export.*function notifyMaintainersOfSubmission/, "Must export notifyMaintainersOfSubmission function");
  });

  test("getMaintainerUserIds should query admins and category-scoped maintainers", () => {
    assert.ok(fs.existsSync(notificationsFile), "notifications.ts must exist");
    const content = fs.readFileSync(notificationsFile, "utf-8");

    // Must query admins (all categories)
    assert.match(content, /role.*==.*"admin"/, "Must query users with admin role");

    // Must query maintainer_categories for category-scoped maintainers
    assert.match(content, /maintainer_categories/, "Must query maintainer_categories table");
    assert.match(content, /\.eq\("category"/, "Must filter by category");

    // Must also check maintainers
    assert.match(content, /role.*==.*"maintainer"/, "Must query users with maintainer role");
  });

  test("notifyMaintainersOfSubmission should create in-app notifications", () => {
    assert.ok(fs.existsSync(notificationsFile), "notifications.ts must exist");
    const content = fs.readFileSync(notificationsFile, "utf-8");

    // Must use createNotification
    assert.match(content, /createNotification/, "Must use createNotification utility");

    // Must include required fields
    assert.match(content, /user_id/, "Notification must include user_id");
    assert.match(content, /project_id/, "Notification must include project_id");
    assert.match(content, /project_name/, "Notification must include project_name");
    assert.match(content, /status.*submitted/, "Notification must include status='submitted'");
    assert.match(content, /message/, "Notification must include message");
  });

  test("notifyMaintainersOfSubmission should document email deferral with TODO", () => {
    assert.ok(fs.existsSync(notificationsFile), "notifications.ts must exist");
    const content = fs.readFileSync(notificationsFile, "utf-8");

    // Must have TODO comment for email
    assert.match(content, /TODO.*[Ee]mail/, "Must include TODO comment about email notification");
    assert.match(content, /email infrastructure/i, "TODO must mention that email infrastructure doesn't exist");
  });

  test("notifyMaintainersOfSubmission must be fire-and-forget with error handling", () => {
    assert.ok(fs.existsSync(notificationsFile), "notifications.ts must exist");
    const content = fs.readFileSync(notificationsFile, "utf-8");

    // Must catch and log errors without throwing
    assert.match(content, /catch.*err/, "Must have error handling");
    assert.match(content, /console\.(error|warn)/, "Must log errors");
    assert.ok(
      !content.includes("throw") || content.indexOf("throw") > content.lastIndexOf("catch"),
      "Must not re-throw errors after catch"
    );
  });

  test("project submission API route should trigger notification", () => {
    assert.ok(fs.existsSync(projectsApiFile), "api/projects/route.ts must exist");
    const content = fs.readFileSync(projectsApiFile, "utf-8");

    // Must import notification function
    assert.match(content, /import.*notifyMaintainersOfSubmission.*from.*notifications/, "Must import notifyMaintainersOfSubmission");

    // Must call notification after project is persisted
    assert.match(content, /notifyMaintainersOfSubmission/, "Must call notifyMaintainersOfSubmission");

    // Must be fire-and-forget (using .catch or chained on next line)
    const hasCatchPattern = /notifyMaintainersOfSubmission[\s\S]{0,200}\.catch/.test(content);
    assert.ok(hasCatchPattern, "Must use .catch for fire-and-forget pattern");

    // Notification must be called before response is returned
    const setCallIndex = content.indexOf("projectsCol.ref.doc(String(numericId)).set(project)");
    const notifyCallIndex = content.indexOf("notifyMaintainersOfSubmission(");
    const responseIndex = content.indexOf("return Response.json", setCallIndex);

    assert.ok(setCallIndex > 0, "Must find project persistence call");
    assert.ok(notifyCallIndex > setCallIndex, "Notification must be called after project is persisted");
    assert.ok(responseIndex > notifyCallIndex, "Response must be returned after notification call");
  });

  test("notification failure must not block submission response", () => {
    assert.ok(fs.existsSync(projectsApiFile), "api/projects/route.ts must exist");
    const content = fs.readFileSync(projectsApiFile, "utf-8");

    // The notification call must be followed by .catch and the response must not await it
    const notifyPattern = /notifyMaintainersOfSubmission\([^)]+\)\.catch/;
    assert.match(content, notifyPattern, "Notification must have .catch handler");

    // Must not be awaited
    const notifyLineMatch = content.match(/^\s*(await\s+)?notifyMaintainersOfSubmission/m);
    if (notifyLineMatch) {
      assert.ok(
        !notifyLineMatch[1],
        "notifyMaintainersOfSubmission must NOT be awaited (fire-and-forget)"
      );
    }
  });

  test("notification function should handle empty maintainer list gracefully", () => {
    assert.ok(fs.existsSync(notificationsFile), "notifications.ts must exist");
    const content = fs.readFileSync(notificationsFile, "utf-8");

    // Should check if maintainer list is empty and handle appropriately
    assert.match(content, /maintainerIds\.length.*===.*0/, "Must check for empty maintainer list");
    const hasWarningPattern = /console\.warn[\s\S]{0,200}[Nn]o maintainers/.test(content);
    assert.ok(hasWarningPattern, "Must log warning if no maintainers found");
    assert.match(content, /return/, "Must return early if no maintainers found");
  });

  test("notification should include category context in message", () => {
    assert.ok(fs.existsSync(notificationsFile), "notifications.ts must exist");
    const content = fs.readFileSync(notificationsFile, "utf-8");

    // Message should reference the category
    assert.match(content, /submission\.category/, "Notification message should include category");
  });
});

describe("Permission Matrix Documentation", () => {
  const contributingFile = path.join(webRoot, "..", "CONTRIBUTING.md");

  test("should have Roles and Permissions section in CONTRIBUTING.md", () => {
    assert.ok(fs.existsSync(contributingFile), "CONTRIBUTING.md must exist");
    const content = fs.readFileSync(contributingFile, "utf-8");

    assert.match(content, /##\s+Roles and Permissions/, "Must have 'Roles and Permissions' section");
  });

  test("should document all three roles", () => {
    assert.ok(fs.existsSync(contributingFile), "CONTRIBUTING.md must exist");
    const content = fs.readFileSync(contributingFile, "utf-8");

    assert.match(content, /Contributor/i, "Must document Contributor role");
    assert.match(content, /Maintainer/i, "Must document Maintainer role");
    assert.match(content, /Admin/i, "Must document Admin role");
  });

  test("should include permission matrix table", () => {
    assert.ok(fs.existsSync(contributingFile), "CONTRIBUTING.md must exist");
    const content = fs.readFileSync(contributingFile, "utf-8");

    // Check for table structure
    assert.match(content, /\|\s*Action\s*\|.*Contributor.*Maintainer.*Admin/, "Must have permission matrix table header");
    assert.match(content, /Submit a project/, "Must document project submission permission");
    assert.match(content, /Approve.*submissions/, "Must document approval permission");
    assert.match(content, /Assign.*roles/, "Must document role assignment permission");
    assert.match(content, /submission notifications/, "Must document notification permission");
  });

  test("permission matrix should use checkmarks for granted permissions", () => {
    assert.ok(fs.existsSync(contributingFile), "CONTRIBUTING.md must exist");
    const content = fs.readFileSync(contributingFile, "utf-8");

    // Should use ✓ or similar for granted permissions
    assert.match(content, /✓/, "Must use checkmarks (✓) to indicate granted permissions");
  });

  test("should explain category-scoped maintainer permissions", () => {
    assert.ok(fs.existsSync(contributingFile), "CONTRIBUTING.md must exist");
    const content = fs.readFileSync(contributingFile, "utf-8");

    // Should mention category scoping
    assert.match(content, /categor/i, "Must explain category-scoped permissions");
    assert.match(content, /scoped/i, "Must use the term 'scoped' to describe maintainer category restrictions");
  });

  test("should explain role assignment process", () => {
    assert.ok(fs.existsSync(contributingFile), "CONTRIBUTING.md must exist");
    const content = fs.readFileSync(contributingFile, "utf-8");

    const rolesSection = content.match(/##\s+Roles and Permissions([\s\S]*?)##\s+Contribution Workflow/);
    assert.ok(rolesSection, "Must have content between Roles section and next section");

    const rolesSectionContent = rolesSection[1];
    assert.match(rolesSectionContent, /[Rr]ole.*[Aa]ssignment/, "Must have subsection about role assignment");
    assert.match(rolesSectionContent, /[Aa]dmin/i, "Must mention that Admins manage role assignments");
  });
});
