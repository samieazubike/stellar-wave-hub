export const EARLY_SUPPORTER_LAST_USER_ID = 100;

export interface AchievementStats {
  userId: number;
  projectCount: number;
  reviewCount: number;
  hasOnChainReview: boolean;
}

export interface Achievement {
  id: "first-review" | "ten-reviews" | "first-project" | "on-chain-reviewer" | "early-supporter";
  name: string;
  description: string;
  earned: boolean;
  progress: string;
}

export function getAchievements({
  userId,
  projectCount,
  reviewCount,
  hasOnChainReview,
}: AchievementStats): Achievement[] {
  return [
    {
      id: "first-review",
      name: "First Review",
      description: "Share your first project review.",
      earned: reviewCount >= 1,
      progress: `${Math.min(reviewCount, 1)}/1 review`,
    },
    {
      id: "ten-reviews",
      name: "10 Reviews",
      description: "Review ten projects in the community.",
      earned: reviewCount >= 10,
      progress: `${Math.min(reviewCount, 10)}/10 reviews`,
    },
    {
      id: "first-project",
      name: "First Project",
      description: "Submit your first project to the directory.",
      earned: projectCount >= 1,
      progress: `${Math.min(projectCount, 1)}/1 project`,
    },
    {
      id: "on-chain-reviewer",
      name: "On-chain Reviewer",
      description: "Submit a review recorded on Stellar.",
      earned: hasOnChainReview,
      progress: hasOnChainReview ? "Verified on Stellar" : "Not yet earned",
    },
    {
      id: "early-supporter",
      name: "Early Supporter",
      description: "Join among the first 100 Stellar Wave members.",
      earned: userId > 0 && userId <= EARLY_SUPPORTER_LAST_USER_ID,
      progress:
        userId > 0 && userId <= EARLY_SUPPORTER_LAST_USER_ID
          ? "Founding community"
          : "Founding cohort: first 100 members",
    },
  ];
}
