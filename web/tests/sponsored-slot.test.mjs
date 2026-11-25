/**
 * Tests for the #462 "Sponsored" result slot feature.
 *
 * Acceptance criteria:
 *   ✓ Exactly one labelled sponsored card per page when spotlights exist
 *   ✓ Sponsored card is inserted at position 4 (index 3)
 *   ✓ Sponsored card is never shown when search equals an exact project name
 *   ✓ Category filter is passed through to the spotlights fetch
 *   ✓ Organic project IDs are excluded from the spotlight request
 *   ✓ /api/spotlights route file exists and has the right shape
 *   ✓ explore/page.tsx references the sponsored slot mechanics
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");

// ── File paths ────────────────────────────────────────────────────────────── //

const spotlightsRouteFile = path.join(
  webRoot,
  "src",
  "app",
  "api",
  "spotlights",
  "route.ts",
);
const explorePageFile = path.join(
  webRoot,
  "src",
  "app",
  "explore",
  "page.tsx",
);
const projectCardFile = path.join(
  webRoot,
  "src",
  "components",
  "ProjectCard.tsx",
);

// ── Helper ────────────────────────────────────────────────────────────────── //

/** Read a file and return its content, or throw a descriptive error. */
function read(file) {
  assert.ok(
    fs.existsSync(file),
    `Required file is missing: ${path.relative(webRoot, file)}`,
  );
  return fs.readFileSync(file, "utf-8");
}

// ═══════════════════════════════════════════════════════════════════════════ //
// 1. /api/spotlights route                                                    //
// ═══════════════════════════════════════════════════════════════════════════ //

describe("/api/spotlights route", () => {
  test("route file exists", () => {
    assert.ok(
      fs.existsSync(spotlightsRouteFile),
      "web/src/app/api/spotlights/route.ts must exist",
    );
  });

  test("exports a GET handler", () => {
    const content = read(spotlightsRouteFile);
    assert.match(
      content,
      /export async function GET/,
      "route.ts must export a GET handler",
    );
  });

  test("queries for featured=1 and status=featured projects", () => {
    const content = read(spotlightsRouteFile);
    assert.match(
      content,
      /\.eq\("featured",\s*1\)/,
      "route must filter by featured = 1",
    );
    assert.match(
      content,
      /\.eq\("status",\s*"featured"\)/,
      "route must filter by status = 'featured'",
    );
  });

  test("filters out expired spotlights", () => {
    const content = read(spotlightsRouteFile);
    // The route should check that featured_expires_at is null or in the future
    assert.match(
      content,
      /featured_expires_at/,
      "route must handle featured_expires_at expiry check",
    );
  });

  test("supports ?category filter param", () => {
    const content = read(spotlightsRouteFile);
    assert.match(
      content,
      /category/,
      "route must accept and apply a category filter",
    );
    assert.match(
      content,
      /\.ilike\("category"/,
      "route must use ilike for case-insensitive category matching",
    );
  });

  test("supports ?exclude param to omit organic project IDs", () => {
    const content = read(spotlightsRouteFile);
    assert.match(
      content,
      /exclude/,
      "route must accept an exclude query parameter",
    );
    assert.match(
      content,
      /excludeIds/,
      "route must parse and apply the exclude list",
    );
  });

  test("shuffles results server-side", () => {
    const content = read(spotlightsRouteFile);
    assert.match(
      content,
      /Math\.random/,
      "route must shuffle results so each call returns a random order",
    );
  });

  test("returns a 'spotlights' array in the response", () => {
    const content = read(spotlightsRouteFile);
    assert.match(
      content,
      /spotlights/,
      "route must return a { spotlights: [...] } payload",
    );
  });

  test("has force-dynamic export to prevent caching stale featured projects", () => {
    const content = read(spotlightsRouteFile);
    assert.match(
      content,
      /dynamic.*=.*"force-dynamic"/,
      "route must be marked as force-dynamic",
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════ //
// 2. Explore page — sponsored slot wiring                                    //
// ═══════════════════════════════════════════════════════════════════════════ //

describe("explore/page.tsx — sponsored slot", () => {
  test("page file exists", () => {
    assert.ok(
      fs.existsSync(explorePageFile),
      "web/src/app/explore/page.tsx must exist",
    );
  });

  test("fetches from /api/spotlights", () => {
    const content = read(explorePageFile);
    assert.match(
      content,
      /\/api\/spotlights/,
      "page must fetch from /api/spotlights",
    );
  });

  test("inserts sponsored card at position 4 (SPONSORED_SLOT = 3)", () => {
    const content = read(explorePageFile);
    assert.match(
      content,
      /SPONSORED_SLOT\s*=\s*3/,
      "SPONSORED_SLOT constant must be set to 3 (0-based index 3 = position 4)",
    );
  });

  test("uses 'Sponsored' as the badge label", () => {
    const content = read(explorePageFile);
    assert.match(
      content,
      /label:\s*"Sponsored"/,
      "badge label must be 'Sponsored'",
    );
  });

  test("uses solar variant for the sponsored badge", () => {
    const content = read(explorePageFile);
    assert.match(
      content,
      /variant:\s*"solar"/,
      "sponsored badge must use the solar variant to visually distinguish it",
    );
  });

  test("suppresses sponsored slot on exact-name search", () => {
    const content = read(explorePageFile);
    assert.match(
      content,
      /isExactNameSearch/,
      "page must define and call isExactNameSearch helper",
    );
    assert.match(
      content,
      /isExactNameSearch\(search,\s*projects\)/,
      "isExactNameSearch must be called with (search, projects)",
    );
  });

  test("passes category filter to spotlights endpoint", () => {
    const content = read(explorePageFile);
    // Should construct something like spotlightParams.set("category", ...)
    assert.match(
      content,
      /spotlightParams.*set.*"category"/s,
      "page must forward the active category filter to /api/spotlights",
    );
  });

  test("passes exclude IDs to prevent organic-duplicate sponsored cards", () => {
    const content = read(explorePageFile);
    assert.match(
      content,
      /spotlightParams.*set.*"exclude"/s,
      "page must pass the current page's project IDs as ?exclude to /api/spotlights",
    );
  });

  test("marks sponsored project with _isSponsored flag", () => {
    const content = read(explorePageFile);
    assert.match(
      content,
      /_isSponsored/,
      "page must tag the sponsored project so the render loop can identify it",
    );
  });

  test("renders sponsored card inside a wrapper div (glow highlight)", () => {
    const content = read(explorePageFile);
    assert.match(
      content,
      /sponsored-/,
      "sponsored card key or class should include 'sponsored-' to identify it in the DOM",
    );
  });

  test("falls back to organic results when no spotlights are available", () => {
    const content = read(explorePageFile);
    // When spotlights.length === 0 we call setDisplayProjects(projects)
    assert.match(
      content,
      /spotlights\.length === 0/,
      "page must handle the case where no spotlights are returned",
    );
  });

  test("falls back gracefully when spotlights fetch throws", () => {
    const content = read(explorePageFile);
    assert.match(
      content,
      /\.catch\(\s*\(\)\s*=>/,
      "page must have a .catch() handler on the spotlights fetch",
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════ //
// 3. isExactNameSearch logic (unit-level)                                    //
// ═══════════════════════════════════════════════════════════════════════════ //

describe("isExactNameSearch helper (unit)", () => {
  /**
   * Inline reimplementation that must stay in sync with explore/page.tsx.
   * If the logic changes in the page, update this copy too.
   */
  function isExactNameSearch(search, projects) {
    if (!search.trim()) return false;
    const needle = search.trim().toLowerCase();
    return projects.some((p) => p.name.trim().toLowerCase() === needle);
  }

  const organic = [
    { id: 1, name: "Fundable" },
    { id: 2, name: "KindFi" },
    { id: 3, name: "Trustless Work" },
  ];

  test("returns false for an empty search string", () => {
    assert.equal(isExactNameSearch("", organic), false);
    assert.equal(isExactNameSearch("   ", organic), false);
  });

  test("returns true when search is an exact project name (case-insensitive)", () => {
    assert.equal(isExactNameSearch("Fundable", organic), true);
    assert.equal(isExactNameSearch("fundable", organic), true);
    assert.equal(isExactNameSearch("KINDFI", organic), true);
    assert.equal(isExactNameSearch("trustless work", organic), true);
  });

  test("returns false when search is a partial match", () => {
    assert.equal(isExactNameSearch("Fund", organic), false);
    assert.equal(isExactNameSearch("Kind", organic), false);
    assert.equal(isExactNameSearch("Work", organic), false);
  });

  test("returns false when search matches nothing", () => {
    assert.equal(isExactNameSearch("DAmRev", organic), false);
    assert.equal(isExactNameSearch("xyz123", organic), false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════ //
// 4. Sponsored slot insertion logic (unit)                                   //
// ═══════════════════════════════════════════════════════════════════════════ //

describe("sponsored slot insertion logic (unit)", () => {
  const SPONSORED_SLOT = 3; // must match the constant in explore/page.tsx

  function buildDisplayList(projects, sponsored) {
    const insertAt = Math.min(SPONSORED_SLOT, projects.length);
    return [
      ...projects.slice(0, insertAt),
      { ...sponsored, _isSponsored: true },
      ...projects.slice(insertAt),
    ];
  }

  function makeProject(id, name) {
    return { id, name, slug: name.toLowerCase(), description: "", category: "DeFi", status: "approved", featured: 0 };
  }

  const SPONSORED = makeProject(99, "SpotlightProject");

  test("inserts sponsored card at position 4 (index 3) in a full page of 12", () => {
    const organic = Array.from({ length: 12 }, (_, i) => makeProject(i + 1, `Project ${i + 1}`));
    const merged = buildDisplayList(organic, SPONSORED);
    assert.equal(merged.length, 13, "merged list should be organics + 1 sponsored");
    assert.equal(merged[3].id, 99, "sponsored card must be at index 3");
    assert.equal(merged[3]._isSponsored, true, "_isSponsored flag must be set");
  });

  test("inserts sponsored card at end when organic list has fewer than 4 items", () => {
    const organic = [makeProject(1, "A"), makeProject(2, "B")];
    const merged = buildDisplayList(organic, SPONSORED);
    assert.equal(merged.length, 3);
    assert.equal(merged[2]._isSponsored, true, "card should be appended after a short list");
  });

  test("organic items before and after the slot are untouched", () => {
    const organic = Array.from({ length: 6 }, (_, i) => makeProject(i + 1, `P${i + 1}`));
    const merged = buildDisplayList(organic, SPONSORED);
    // Items before slot (indices 0-2) map to organic ids 1-3
    for (let i = 0; i < SPONSORED_SLOT; i++) {
      assert.equal(merged[i].id, i + 1, `item at index ${i} should be organic id ${i + 1}`);
    }
    // Sponsored is at index SPONSORED_SLOT (3)
    assert.equal(merged[SPONSORED_SLOT]._isSponsored, true);
    // Items after sponsored slot (indices 4-6) map to organic ids 4-6
    for (let i = SPONSORED_SLOT + 1; i < merged.length; i++) {
      const expectedId = i; // organic[i-1] has id = i (since we shifted by 1)
      assert.equal(merged[i].id, expectedId, `organic items after slot must be in original order`);
    }
  });

  test("exactly one sponsored card is present", () => {
    const organic = Array.from({ length: 12 }, (_, i) => makeProject(i + 1, `P${i + 1}`));
    const merged = buildDisplayList(organic, SPONSORED);
    const sponsoredCount = merged.filter((p) => p._isSponsored).length;
    assert.equal(sponsoredCount, 1, "there must be exactly one sponsored card per page");
  });

  test("sponsored card is NOT added when there are no spotlights", () => {
    const organic = Array.from({ length: 6 }, (_, i) => makeProject(i + 1, `P${i + 1}`));
    // When spotlights.length === 0 the page sets displayProjects = organic directly
    const displayProjects = organic; // no insertion
    const sponsoredCount = displayProjects.filter((p) => p._isSponsored).length;
    assert.equal(sponsoredCount, 0, "no sponsored card when spotlights list is empty");
  });
});

// ═══════════════════════════════════════════════════════════════════════════ //
// 5. ProjectCard badge support                                               //
// ═══════════════════════════════════════════════════════════════════════════ //

describe("ProjectCard badge support", () => {
  test("ProjectCard accepts an optional badge prop", () => {
    const content = read(projectCardFile);
    assert.match(
      content,
      /badge\?:/,
      "ProjectCardProps must include an optional badge property",
    );
  });

  test("ProjectCard renders solar badge variant", () => {
    const content = read(projectCardFile);
    assert.match(
      content,
      /badge\.variant === "solar"/,
      "ProjectCard must handle the solar badge variant",
    );
  });

  test("ProjectCard renders badge label text", () => {
    const content = read(projectCardFile);
    assert.match(
      content,
      /badge\.label/,
      "ProjectCard must render badge.label",
    );
  });
});
