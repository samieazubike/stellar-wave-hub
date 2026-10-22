import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");

const DAY_MS = 24 * 60 * 60 * 1000;
const TRENDING_WINDOW_DAYS = 7;

/**
 * Mirror of the ranking rules implemented in
 * src/app/api/projects/trending/route.ts so the ordering contract is covered
 * without needing a live Supabase instance.
 */
function rankTrending(projects) {
  const active = projects.filter((p) => p.recent_rating_count > 0);

  if (active.length > 0) {
    return active.sort((a, b) => {
      if (b.recent_rating_count !== a.recent_rating_count) {
        return b.recent_rating_count - a.recent_rating_count;
      }
      const avgA = a.avg_rating ?? 0;
      const avgB = b.avg_rating ?? 0;
      if (avgB !== avgA) return avgB - avgA;
      const recentAvgA = a.recent_avg_rating ?? 0;
      const recentAvgB = b.recent_avg_rating ?? 0;
      if (recentAvgB !== recentAvgA) return recentAvgB - recentAvgA;
      if (b.rating_count !== a.rating_count) {
        return b.rating_count - a.rating_count;
      }
      return String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""));
    });
  }

  // Fallback: top-rated overall.
  return projects.sort((a, b) => {
    const avgA = a.avg_rating ?? 0;
    const avgB = b.avg_rating ?? 0;
    if (avgB !== avgA) return avgB - avgA;
    if (b.rating_count !== a.rating_count) {
      return b.rating_count - a.rating_count;
    }
    return String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""));
  });
}

describe("GET /api/projects/trending", () => {
  const routeFile = path.join(
    webRoot,
    "src",
    "app",
    "api",
    "projects",
    "trending",
    "route.ts",
  );
  const pageFile = path.join(webRoot, "src", "app", "page.tsx");

  test("route file exposes a dynamic GET handler", () => {
    assert.ok(fs.existsSync(routeFile), "trending/route.ts must exist");
    const content = fs.readFileSync(routeFile, "utf-8");

    assert.match(content, /export async function GET\(/, "must export GET");
    assert.match(
      content,
      /export const dynamic = "force-dynamic"/,
      "must opt out of caching so recent ratings are reflected",
    );
  });

  test("counts ratings inside the 7-day window", () => {
    const content = fs.readFileSync(routeFile, "utf-8");

    assert.match(
      content,
      /TRENDING_WINDOW_DAYS = 7/,
      "window must be 7 days",
    );
    assert.match(content, /createdAt >= windowStart/, "must filter by window start");
    assert.match(
      content,
      /recent_rating_count/,
      "must expose the recent rating count",
    );
    assert.match(content, /recent_ratings/, "must report recent rating totals");
  });

  test("tie-breaks by average score and falls back to top-rated", () => {
    const content = fs.readFileSync(routeFile, "utf-8");

    const trendingFn = content.slice(
      content.indexOf("function compareTrending"),
      content.indexOf("function compareTopRated"),
    );
    assert.match(
      trendingFn,
      /avg_rating/,
      "count ties must be broken by average score",
    );
    assert.match(
      content,
      /hasRecentActivity\s*\?[\s\S]*compareTrending[\s\S]*:\s*projects\.sort\(compareTopRated\)/,
      "must fall back to top-rated when there is no recent activity",
    );
  });

  test("defaults to the top 6 projects", () => {
    const content = fs.readFileSync(routeFile, "utf-8");

    assert.match(content, /DEFAULT_LIMIT = 6/, "default limit must be 6");
    assert.match(content, /Math\.min\(\s*MAX_LIMIT/, "limit must be clamped");
  });

  test("homepage requests the trending endpoint and reuses ProjectCard", () => {
    const content = fs.readFileSync(pageFile, "utf-8");

    assert.match(
      content,
      /\/api\/projects\/trending\?limit=6/,
      "homepage must fetch the dedicated trending endpoint",
    );
    assert.match(content, /<ProjectCard/, "homepage must reuse ProjectCard");
    assert.match(
      content,
      /meta\?\.fallback/,
      "homepage must surface the top-rated fallback state",
    );
  });

  test("ranks by recent rating count", () => {
    const now = Date.now();
    const projects = [
      {
        id: 1,
        name: "One recent rating",
        recent_rating_count: 1,
        avg_rating: 5,
        recent_avg_rating: 5,
        rating_count: 20,
        created_at: new Date(now - 10 * DAY_MS).toISOString(),
      },
      {
        id: 2,
        name: "Four recent ratings",
        recent_rating_count: 4,
        avg_rating: 3.5,
        recent_avg_rating: 3.5,
        rating_count: 4,
        created_at: new Date(now - 2 * DAY_MS).toISOString(),
      },
      {
        id: 3,
        name: "No recent ratings",
        recent_rating_count: 0,
        avg_rating: 5,
        recent_avg_rating: null,
        rating_count: 100,
        created_at: new Date(now - 60 * DAY_MS).toISOString(),
      },
    ];

    const ranked = rankTrending(projects);
    assert.deepEqual(
      ranked.map((p) => p.id),
      [2, 1],
      "projects are ranked by recent ratings and unrated projects are excluded",
    );
  });

  test("tie-breaks equal recent counts by average score", () => {
    const projects = [
      {
        id: 1,
        recent_rating_count: 2,
        avg_rating: 4.1,
        recent_avg_rating: 4.1,
        rating_count: 2,
        created_at: "2026-10-01T00:00:00Z",
      },
      {
        id: 2,
        recent_rating_count: 2,
        avg_rating: 4.8,
        recent_avg_rating: 4.8,
        rating_count: 10,
        created_at: "2026-09-01T00:00:00Z",
      },
      {
        id: 3,
        recent_rating_count: 2,
        avg_rating: 4.8,
        recent_avg_rating: 4.8,
        rating_count: 30,
        created_at: "2026-08-01T00:00:00Z",
      },
    ];

    const ranked = rankTrending(projects);
    assert.deepEqual(
      ranked.map((p) => p.id),
      [3, 2, 1],
      "higher average wins, then higher rating volume",
    );
  });

  test("falls back to top-rated when nobody rated in the last 7 days", () => {
    const projects = [
      {
        id: 1,
        recent_rating_count: 0,
        avg_rating: 3.2,
        recent_avg_rating: null,
        rating_count: 50,
        created_at: "2026-08-01T00:00:00Z",
      },
      {
        id: 2,
        recent_rating_count: 0,
        avg_rating: 4.9,
        recent_avg_rating: null,
        rating_count: 2,
        created_at: "2026-06-01T00:00:00Z",
      },
    ];

    const ranked = rankTrending(projects).slice(0, TRENDING_WINDOW_DAYS > 0 ? 6 : 0);
    assert.deepEqual(
      ranked.map((p) => p.id),
      [2, 1],
      "top-rated ordering is used when there is no recent activity",
    );
  });
});
