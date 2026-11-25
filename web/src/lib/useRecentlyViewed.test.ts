import { describe, expect, it } from "vitest";
import {
  MAX_RECENTLY_VIEWED,
  mergeRecentlyViewed,
  parseRecentlyViewed,
  type RecentlyViewedProject,
} from "./useRecentlyViewed";

const project = (slug: string, id = 1): RecentlyViewedProject => ({
  id,
  slug,
  name: slug.toUpperCase(),
});

describe("parseRecentlyViewed", () => {
  it("returns an empty list for missing or invalid snapshots", () => {
    expect(parseRecentlyViewed(null)).toEqual([]);
    expect(parseRecentlyViewed("")).toEqual([]);
    expect(parseRecentlyViewed("not json")).toEqual([]);
    expect(parseRecentlyViewed(JSON.stringify({ slug: "alpha" }))).toEqual([]);
  });

  it("drops entries that do not describe a project", () => {
    const snapshot = JSON.stringify([
      { id: 1, slug: "alpha", name: "Alpha" },
      { id: 0, slug: "bad-id", name: "Bad" },
      { id: 2, slug: "", name: "Empty slug" },
      { id: 3, slug: "missing-name" },
      { id: 4, slug: "beta", name: "Beta", category: "DeFi", logo_url: null },
      "nope",
    ]);

    expect(parseRecentlyViewed(snapshot)).toEqual([
      { id: 1, slug: "alpha", name: "Alpha" },
      { id: 4, slug: "beta", name: "Beta", category: "DeFi", logo_url: null },
    ]);
  });

  it("deduplicates by slug and keeps the most recent entry", () => {
    const snapshot = JSON.stringify([
      { id: 2, slug: "alpha", name: "Alpha (new)" },
      { id: 1, slug: "beta", name: "Beta" },
      { id: 1, slug: "alpha", name: "Alpha (old)" },
    ]);

    expect(parseRecentlyViewed(snapshot)).toEqual([
      { id: 2, slug: "alpha", name: "Alpha (new)" },
      { id: 1, slug: "beta", name: "Beta" },
    ]);
  });

  it("caps the list at the maximum length", () => {
    const snapshot = JSON.stringify(
      Array.from({ length: MAX_RECENTLY_VIEWED + 3 }, (_, index) =>
        project(`project-${index}`, index + 1),
      ),
    );

    const parsed = parseRecentlyViewed(snapshot);

    expect(parsed).toHaveLength(MAX_RECENTLY_VIEWED);
    expect(parsed[0].slug).toBe("project-0");
  });
});

describe("mergeRecentlyViewed", () => {
  it("puts the newest project first and removes the older entry", () => {
    const current = [project("beta", 2), project("alpha", 1)];

    const merged = mergeRecentlyViewed(current, project("alpha", 1));

    expect(merged.map((entry) => entry.slug)).toEqual(["alpha", "beta"]);
  });

  it("keeps at most the maximum number of projects", () => {
    const current = Array.from({ length: MAX_RECENTLY_VIEWED }, (_, index) =>
      project(`project-${index}`, index + 1),
    );

    const merged = mergeRecentlyViewed(current, project("newest", 99));

    expect(merged).toHaveLength(MAX_RECENTLY_VIEWED);
    expect(merged[0].slug).toBe("newest");
    expect(merged.at(-1)?.slug).toBe(`project-${MAX_RECENTLY_VIEWED - 2}`);
  });
});
