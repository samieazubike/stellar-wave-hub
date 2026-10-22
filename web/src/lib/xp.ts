import { projectsCol, ratingsCol, ratingVotesCol } from "@/lib/db";

/**
 * XP Calculation Rules:
 * - Approved project (created by user, status = "approved" or "featured"): +50
 * - Review (rating with review_text): +10
 * - On-chain review (rating with tx_hash): +15
 * - Helpful vote received on one of the user's ratings: +2
 */
export const XP_RULES = {
  approvedProject: 50,
  review: 10,
  onChainReview: 15,
  helpfulVote: 2,
} as const;

export interface XpBreakdown {
  approvedProjects: number;
  reviews: number;
  onChainReviews: number;
  helpfulVotes: number;
  total: number;
}

export interface XpActivity {
  approvedProjectCount: number;
  ratings: { review_text?: unknown; tx_hash?: unknown }[];
  helpfulVotesReceived: number;
}

function nonEmpty(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/** Pure XP scoring. Used by computeXp and the leaderboard so rankings always match. */
export function scoreXp({ approvedProjectCount, ratings, helpfulVotesReceived }: XpActivity): XpBreakdown {
  const reviewsCount = ratings.filter((r) => nonEmpty(r.review_text)).length;
  const onChainReviewsCount = ratings.filter((r) => nonEmpty(r.tx_hash)).length;

  const approvedProjects = approvedProjectCount * XP_RULES.approvedProject;
  const reviews = reviewsCount * XP_RULES.review;
  const onChainReviews = onChainReviewsCount * XP_RULES.onChainReview;
  const helpfulVotes = helpfulVotesReceived * XP_RULES.helpfulVote;

  return {
    approvedProjects,
    reviews,
    onChainReviews,
    helpfulVotes,
    total: approvedProjects + reviews + onChainReviews + helpfulVotes,
  };
}

export async function computeXp(userId: number): Promise<XpBreakdown> {
  const [projectsSnap, ratingsSnap] = await Promise.all([
    projectsCol.ref
      .where("user_id", "==", userId)
      .where("status", "in", ["approved", "featured"])
      .get(),
    ratingsCol.ref.where("user_id", "==", userId).get(),
  ]);

  const ratings = ratingsSnap.docs.map((doc) => doc.data());
  const ratingIds = ratings.map((r) => Number(r.numericId)).filter(Number.isFinite);
  const votesSnap = ratingIds.length
    ? await ratingVotesCol.ref.where("rating_id", "in", ratingIds).get()
    : null;

  return scoreXp({
    approvedProjectCount: projectsSnap.size,
    ratings,
    helpfulVotesReceived: votesSnap?.size ?? 0,
  });
}
