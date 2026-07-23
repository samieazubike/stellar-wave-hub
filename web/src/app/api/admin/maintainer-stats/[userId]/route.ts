import { moderationLogCol } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const auth = getAuthUser(request);
  const { userId } = await params;

  // Allow admins to view any user's stats, and maintainers to view their own
  const isAdmin = auth?.role === "admin";
  const isOwnStats = auth && String(auth.userId) === userId;
  if (!auth || (!isAdmin && !isOwnStats)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Fetch moderation logs for specific admin
    const logSnap = await moderationLogCol.ref
      .where("admin_id", "==", parseInt(userId))
      .get();

    // Aggregate stats
    const stats = {
      total_reviews: 0,
      approvals: 0,
      rejections: 0,
      features: 0,
      delists: 0,
      recent_actions: [] as Array<{
        action: string;
        project_name: string;
        created_at: string;
      }>,
    };

    logSnap.docs.forEach((doc) => {
      const log = doc.data();
      const action = log.action as string;

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

    // Get recent actions (last 10)
    const recentDocs = logSnap.docs
      .sort((a, b) => {
        const aTime = new Date(a.data().created_at as string).getTime();
        const bTime = new Date(b.data().created_at as string).getTime();
        return bTime - aTime;
      })
      .slice(0, 10);

    stats.recent_actions = recentDocs.map((doc) => ({
      action: doc.data().action as string,
      project_name: doc.data().project_name as string,
      created_at: doc.data().created_at as string,
    }));

    return Response.json({ stats });
  } catch (err) {
    console.error("Individual maintainer stats error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
