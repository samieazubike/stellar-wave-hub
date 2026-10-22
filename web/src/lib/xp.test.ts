import { describe, expect, it } from "vitest";
import { scoreXp } from "./xp";

describe("scoreXp", () => {
  it("applies each XP rule", () => {
    const xp = scoreXp({
      approvedProjectCount: 2,
      ratings: [
        { review_text: "Great project", tx_hash: "abc" },
        { review_text: "   ", tx_hash: null },
        { review_text: null, tx_hash: "def" },
      ],
      helpfulVotesReceived: 3,
    });
    expect(xp).toEqual({ approvedProjects: 100, reviews: 10, onChainReviews: 30, helpfulVotes: 6, total: 146 });
  });

  it("is zero with no activity", () => {
    expect(scoreXp({ approvedProjectCount: 0, ratings: [], helpfulVotesReceived: 0 }).total).toBe(0);
  });
});
