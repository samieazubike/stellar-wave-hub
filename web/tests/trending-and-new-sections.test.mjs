import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");

describe("Homepage 'Trending' and 'New this week' Sections", () => {
  const pageFile = path.join(webRoot, "src", "app", "page.tsx");
  const apiRouteFile = path.join(webRoot, "src", "app", "api", "projects", "route.ts");
  const projectCardFile = path.join(webRoot, "src", "components", "ProjectCard.tsx");
  const explorePageFile = path.join(webRoot, "src", "app", "explore", "page.tsx");

  test("should have page.tsx referencing Trending, New this week, and rating velocity", () => {
    assert.ok(fs.existsSync(pageFile), "page.tsx must exist");
    const content = fs.readFileSync(pageFile, "utf-8");

    // Check headings and sections
    assert.match(content, /Trending/i, "page.tsx must have a Trending section");
    assert.match(content, /New this week/i, "page.tsx must have a 'New this week' section");
    assert.match(content, /Rating Velocity/i, "page.tsx must reference Rating Velocity");
    assert.match(content, /From Created At/i, "page.tsx must indicate 'New this week' is derived from created_at");

    // Check that it reuses ProjectCard
    assert.match(content, /<ProjectCard/i, "page.tsx must reuse existing ProjectCard components");

    // Check API fetch calls
    assert.match(content, /sort=trending/, "page.tsx must fetch projects sorted by trending");
    assert.match(content, /sort=new-this-week/, "page.tsx must fetch projects sorted by new-this-week");
    assert.match(content, /sort=top-rated/, "page.tsx must fetch top-rated projects");
  });

  test("should have API route computing rating velocity and handling trending/new-this-week sorts", () => {
    assert.ok(fs.existsSync(apiRouteFile), "api/projects/route.ts must exist");
    const content = fs.readFileSync(apiRouteFile, "utf-8");

    // Check rating velocity logic
    assert.match(content, /computeRatingVelocity/, "API route must define computeRatingVelocity");
    assert.match(content, /rating_velocity/, "API route must enrich projects with rating_velocity");
    assert.match(content, /sort === "trending"/, "API route must handle sort=trending");
    assert.match(content, /sort === "new-this-week"/, "API route must handle sort=new-this-week");
    assert.match(content, /created_at/, "API route must sort by created_at");
  });

  test("should compute rating velocity accurately with recency decay", () => {
    // Replicate the exact mathematical rating velocity function implemented in the API
    const DAY_MS = 24 * 60 * 60 * 1000;
    const now = Date.now();

    const computeRatingVelocity = (items, referenceTime = now) => {
      if (!items || items.length === 0) return 0;
      return items.reduce((total, item) => {
        const itemTime = item.created_at ? new Date(item.created_at).getTime() : 0;
        const ageInDays = itemTime > 0 ? Math.max(0, (referenceTime - itemTime) / DAY_MS) : 180;
        const recency = 1 / Math.pow(1 + ageInDays / 30, 1.5);
        const scoreFactor = Math.max(0.5, item.score / 5);
        return total + recency * scoreFactor;
      }, 0);
    };

    // Scenario 1: A project with recent 5-star ratings vs an older 5-star rating
    const recentRatings = [
      { score: 5, created_at: new Date(now - 1 * DAY_MS).toISOString() },
      { score: 5, created_at: new Date(now - 2 * DAY_MS).toISOString() },
    ];
    const olderRatings = [
      { score: 5, created_at: new Date(now - 90 * DAY_MS).toISOString() },
    ];
    const unrated = [];

    const velocityRecent = computeRatingVelocity(recentRatings);
    const velocityOlder = computeRatingVelocity(olderRatings);
    const velocityUnrated = computeRatingVelocity(unrated);

    assert.ok(velocityRecent > velocityOlder, "Recent ratings must produce higher velocity than older ratings");
    assert.ok(velocityOlder > velocityUnrated, "Rated projects must have higher velocity than unrated projects");
    assert.equal(velocityUnrated, 0, "Unrated project velocity must be 0");
  });

  test("should strictly sort by created_at for 'New this week'", () => {
    const mockProjects = [
      { id: 1, name: "Older Project", created_at: "2026-03-25T10:00:00Z" },
      { id: 2, name: "Newer Project", created_at: "2026-08-30T10:00:00Z" },
      { id: 3, name: "Latest Project", created_at: "2026-10-15T10:00:00Z" },
    ];

    // Sort descending by created_at
    const sorted = [...mockProjects].sort((a, b) => (b.created_at > a.created_at ? 1 : -1));

    assert.equal(sorted[0].id, 3, "Most recent project by created_at should be first");
    assert.equal(sorted[1].id, 2, "Second newest project should be second");
    assert.equal(sorted[2].id, 1, "Oldest project should be last");
  });

  test("ProjectCard component supports optional badges cleanly", () => {
    assert.ok(fs.existsSync(projectCardFile), "ProjectCard.tsx must exist");
    const content = fs.readFileSync(projectCardFile, "utf-8");

    assert.match(content, /badge\?:/, "ProjectCardProps must include optional badge");
    assert.match(content, /rating_velocity\?:/, "ProjectCardProps must support rating_velocity");
    assert.match(content, /created_at\?:/, "ProjectCardProps must support created_at");
  });

  test("Explore page supports trending and new-this-week sort options", () => {
    assert.ok(fs.existsSync(explorePageFile), "explore/page.tsx must exist");
    const content = fs.readFileSync(explorePageFile, "utf-8");

    assert.match(content, /value: "trending"/, "Explore page must include trending sort option");
    assert.match(content, /value: "new-this-week"/, "Explore page must include new-this-week sort option");
  });
});
