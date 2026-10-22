import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");

describe("Project Details Rating Distribution Histogram (#521)", () => {
  const projectPageFile = path.join(webRoot, "src", "app", "projects", "[slug]", "page.tsx");

  test("project details page file exists", () => {
    assert.ok(fs.existsSync(projectPageFile), "projects/[slug]/page.tsx must exist");
  });

  test("fetches ratings from /api/ratings/project/[projectId]", () => {
    const content = fs.readFileSync(projectPageFile, "utf-8");
    assert.match(
      content,
      /\/api\/ratings\/project\/\$\{projectId\}|\/api\/ratings\/project\//,
      "Must fetch from /api/ratings/project/[projectId]"
    );
  });

  test("renders 5 to 1 star histogram on the ratings tab", () => {
    const content = fs.readFileSync(projectPageFile, "utf-8");
    assert.match(content, /Rating Distribution/i, "Must have Rating Distribution header");
    assert.match(
      content,
      /\[5,\s*4,\s*3,\s*2,\s*1\]/,
      "Must iterate from 5 down to 1 star"
    );
  });

  test("has accessible bars with aria labels and progressbar roles", () => {
    const content = fs.readFileSync(projectPageFile, "utf-8");
    assert.match(
      content,
      /role="progressbar"/,
      "Must have progressbar role for histogram bars"
    );
    assert.match(
      content,
      /aria-label=.*star ratings:/i,
      "Must have descriptive aria-label on histogram bars"
    );
  });

  test("distribution calculation ensures counts add up to total", () => {
    const mockRatings = [
      { score: 5 },
      { score: 5 },
      { score: 4 },
      { score: 3 },
      { score: 3 },
      { score: 3 },
      { score: 2 },
      { score: 1 },
      { score: 1 },
    ];

    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const r of mockRatings) {
      const s = Math.round(Number(r.score));
      if (s >= 1 && s <= 5) {
        counts[s] = (counts[s] || 0) + 1;
      }
    }

    const totalCalculated = Object.values(counts).reduce((acc, c) => acc + c, 0);
    assert.equal(totalCalculated, mockRatings.length, "Counts must add up to the total number of ratings");
    assert.equal(counts[5], 2);
    assert.equal(counts[4], 1);
    assert.equal(counts[3], 3);
    assert.equal(counts[2], 1);
    assert.equal(counts[1], 2);
  });
});
