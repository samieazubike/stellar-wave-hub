import { moderationLogCol, usersCol } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = getAuthUser(request);
  if (!auth || auth.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Fetch all moderation logs
    const logSnap = await moderationLogCol.ref.get();
    
    // Aggregate stats by admin
    const statsByAdmin = new Map<number, {
      admin_id: number;
      admin_username: string;
      total_reviews: number;
      approvals: number;
      rejections: number;
      features: number;
      delists: number;
    }>();

    logSnap.docs.forEach((doc) => {
      const log = doc.data();
      const adminId = log.admin_id as number;
      const adminUsername = log.admin_username as string;
      const action = log.action as string;

      if (!statsByAdmin.has(adminId)) {
        statsByAdmin.set(adminId, {
          admin_id: adminId,
          admin_username: adminUsername,
          total_reviews: 0,
          approvals: 0,
          rejections: 0,
          features: 0,
          delists: 0,
        });
      }

      const stats = statsByAdmin.get(adminId)!;
      stats.total_reviews++;

      switch (action) {
        case "approve":
          stats.approvals++;
          break;
        case "reject":
          stats.rejections++;
          break;
        case "feature":
          stats.features++;
          break;
        case "delist":
          stats.delists++;
          break;
      }
    });

    // Convert to array and sort by total_reviews descending
    const leaderboard = Array.from(statsByAdmin.values()).sort(
      (a, b) => b.total_reviews - a.total_reviews
    );

    // Add rank
    leaderboard.forEach((stats, index) => {
      (stats as any).rank = index + 1;
    });

    return Response.json({ leaderboard });
  } catch (err) {
    console.error("Maintainer stats error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
