import { getAuthUser } from "@/lib/auth";
import { projectsCol, ratingsCol } from "@/lib/db";
import { getAchievements } from "@/lib/achievements";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = getAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [projectsSnap, ratingsSnap] = await Promise.all([
      projectsCol.ref.where("user_id", "==", auth.userId).get(),
      ratingsCol.ref.where("user_id", "==", auth.userId).get(),
    ]);

    const ratings = ratingsSnap.docs.map((doc) => doc.data());
    const achievements = getAchievements({
      userId: auth.userId,
      projectCount: projectsSnap.docs.length,
      // A review is a rating with written text (same rule as XP in lib/xp.ts).
      reviewCount: ratings.filter(
        (rating) => typeof rating.review_text === "string" && rating.review_text.trim().length > 0,
      ).length,
      hasOnChainReview: ratings.some(
        (rating) => typeof rating.tx_hash === "string" && rating.tx_hash.length > 0,
      ),
    });

    return Response.json({ achievements });
  } catch (err) {
    console.error("Fetch achievements error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
