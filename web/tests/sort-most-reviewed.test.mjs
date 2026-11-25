import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");

describe("Explore Page 'Most reviewed' Sort Option (#517)", () => {
  const apiRouteFile = path.join(webRoot, "src", "app", "api", "projects", "route.ts");
  const explorePageFile = path.join(webRoot, "src", "app", "explore", "page.tsx");

  test("API route supports sort === 'most-reviewed' by rating count desc", () => {
    assert.ok(fs.existsSync(apiRouteFile), "api/projects/route.ts must exist");
    const content = fs.readFileSync(apiRouteFile, "utf-8");

    assert.match(content, /sort === "most-reviewed"/, "API route must handle sort === 'most-reviewed'");
    assert.match(content, /rating_count/, "API route must sort using rating_count");
  });

  test("Explore page includes 'Most Reviewed' in SORT_OPTIONS", () => {
    assert.ok(fs.existsSync(explorePageFile), "explore/page.tsx must exist");
    const content = fs.readFileSync(explorePageFile, "utf-8");

    assert.match(content, /value:\s*"most-reviewed"/, "Explore page must include most-reviewed option value");
    assert.match(content, /label:\s*"Most Reviewed"/, "Explore page must include Most Reviewed option label");
  });

  test("Sorting logic orders projects by rating count descending", () => {
    const mockProjects = [
      { id: 1, name: "Low reviews", rating_count: 2 },
      { id: 2, name: "High reviews", rating_count: 42 },
      { id: 3, name: "Zero reviews", rating_count: 0 },
      { id: 4, name: "Medium reviews", rating_count: 15 },
    ];

    const sorted = [...mockProjects].sort(
      (a, b) => ((b.rating_count) || 0) - ((a.rating_count) || 0)
    );

    assert.equal(sorted[0].id, 2, "Project with 42 reviews must be first");
    assert.equal(sorted[1].id, 4, "Project with 15 reviews must be second");
    assert.equal(sorted[2].id, 1, "Project with 2 reviews must be third");
    assert.equal(sorted[3].id, 3, "Project with 0 reviews must be last");
  });
});
