import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");
const read = (...parts) => fs.readFileSync(path.join(webRoot, ...parts), "utf-8");
const exists = (...parts) => fs.existsSync(path.join(webRoot, ...parts));

describe("Supporter badge integration (#470)", () => {
  it("defines a presentational badge that renders nothing below the threshold", () => {
    assert.ok(exists("src", "components", "SupporterBadge.tsx"));
    const badge = read("src", "components", "SupporterBadge.tsx");

    assert.match(badge, /interface SupporterBadgeProps/);
    assert.match(badge, /isSupporter\?: boolean/);
    assert.match(badge, /if \(!isSupporter\) return null/);
    assert.match(badge, /export default function SupporterBadge/);
    assert.match(badge, /aria-label=\{tooltip\}/);
    assert.match(badge, /title=\{tooltip\}/);
    assert.match(badge, /Supporter/);
    assert.match(badge, /tag tag-solar/);
  });

  it("sums tips only and defaults the threshold to 10 XLM", () => {
    const helper = read("src", "lib", "supporters.ts");

    assert.match(helper, /export const SUPPORTER_MIN_XLM = 10/);
    assert.match(helper, /export const DONATION_PRODUCT = "tip"/);
    assert.match(helper, /\.from\("payments"\)/);
    assert.match(helper, /\.eq\("product", DONATION_PRODUCT\)/);
    assert.match(helper, /\.in\("user_id", ids\)/);
    assert.match(helper, /totalXlm >= threshold/);
    assert.match(helper, /export async function getSupporterStatuses/);
  });

  it("renders the badge on the private profile", () => {
    const page = read("src", "app", "profile", "page.tsx");

    assert.match(page, /import SupporterBadge from "@\/components\/SupporterBadge"/);
    assert.match(page, /fetch\("\/api\/supporters\/me"/);
    assert.match(page, /<SupporterBadge/);
    assert.match(page, /isSupporter=\{!!supporter\?\.is_supporter\}/);
  });

  it("renders the badge on public profiles", () => {
    const page = read("src", "app", "u", "[username]", "page.tsx");

    assert.match(page, /import SupporterBadge from "@\/components\/SupporterBadge"/);
    assert.match(page, /getSupporterStatus\(userId\)/);
    assert.match(page, /<SupporterBadge/);
    assert.match(page, /isSupporter=\{supporter\.is_supporter\}/);
  });

  it("renders the badge next to review authors on project pages", () => {
    const page = read("src", "app", "projects", "[slug]", "page.tsx");

    assert.match(page, /import SupporterBadge from "@\/components\/SupporterBadge"/);
    assert.match(page, /\{rating\.username\}/);
    assert.match(page, /<SupporterBadge/);
    assert.match(page, /isSupporter=\{!!rating\.is_supporter\}/);
    assert.match(page, /totalXlm=\{rating\.donation_total_xlm\}/);
  });

  it("supplies supporter fields from both rating APIs", () => {
    for (const parts of [
      ["src", "app", "api", "projects", "[id]", "route.ts"],
      ["src", "app", "api", "ratings", "project", "[projectId]", "route.ts"],
    ]) {
      const route = read(...parts);
      assert.match(route, /getSupporterStatuses/, `${parts.join("/")} must compute statuses`);
      assert.match(route, /is_supporter: supporter\?\.is_supporter \?\? false/);
      assert.match(route, /donation_total_xlm: supporter\?\.total_xlm \?\? 0/);
    }
  });

  it("exposes a private supporter-status endpoint for the signed-in user", () => {
    const route = read("src", "app", "api", "supporters", "me", "route.ts");

    assert.match(route, /getAuthUser\(request\)/);
    assert.match(route, /getSupporterStatus\(auth\.userId\)/);
    assert.match(route, /status: 401/);
    assert.match(route, /private, no-store/);
  });

  it("documents the configurable threshold in .env.example", () => {
    assert.match(read(".env.example"), /^SUPPORTER_MIN_XLM=10$/m);
  });
});
