import { getAuthUser, hasMinRole } from "@/lib/auth";
import { getSupabase } from "@/lib/firebase";
export const dynamic = "force-dynamic";

type ModeratorStats = {
  actor_id: number;
  username: string | null;
  approvals: number;
  rejections: number;
  delists: number;
  total_actions: number;
  last_action_at: string | null;
};

/**
 * GET /api/admin/maintainer-stats
 * Per-moderator counts aggregated from the moderation_log table.
 *
 * Query params:
 * - since: ISO date; only count actions at or after it
 * - me=1:  only the caller's own row (the only form maintainers may use)
 */
export async function GET(request: Request) {
  const auth = getAuthUser(request);
  if (!auth || !hasMinRole(auth.role, "maintainer")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const me = url.searchParams.get("me");
  const meOnly = me === "1" || me === "true";
  if (auth.role !== "admin" && !meOnly) {
    return Response.json(
      { error: "Maintainers may only query their own stats (?me=1)" },
      { status: 403 },
    );
  }

  const sinceParam = url.searchParams.get("since");
  let since: string | null = null;
  if (sinceParam) {
    const parsed = new Date(sinceParam);
    if (Number.isNaN(parsed.getTime())) {
      return Response.json({ error: "Invalid since date" }, { status: 400 });
    }
    since = parsed.toISOString();
  }

  try {
    let query = getSupabase().from("moderation_log").select("actor_id, action, created_at");
    if (meOnly) query = query.eq("actor_id", auth.userId);
    if (since) query = query.gte("created_at", since);

    const { data, error } = await query;
    if (error) throw error;

    const byActor = new Map<number, ModeratorStats>();
    const statsFor = (actorId: number) => {
      let row = byActor.get(actorId);
      if (!row) {
        row = {
          actor_id: actorId,
          username: null,
          approvals: 0,
          rejections: 0,
          delists: 0,
          total_actions: 0,
          last_action_at: null,
        };
        byActor.set(actorId, row);
      }
      return row;
    };
    if (meOnly) statsFor(auth.userId);

    for (const entry of data ?? []) {
      const row = statsFor(Number(entry.actor_id));
      row.total_actions++;
      if (!row.last_action_at || entry.created_at > row.last_action_at) {
        row.last_action_at = entry.created_at;
      }
      // A feature is an approval that also sets the spotlight.
      if (entry.action === "approve" || entry.action === "feature") row.approvals++;
      else if (entry.action === "reject") row.rejections++;
      else if (entry.action === "delist") row.delists++;
    }

    if (byActor.size > 0) {
      const { data: users, error: usersError } = await getSupabase()
        .from("users")
        .select("numericId, username")
        .in("numericId", [...byActor.keys()]);
      if (usersError) throw usersError;
      for (const u of users ?? []) {
        const row = byActor.get(Number(u.numericId));
        if (row) row.username = u.username ?? null;
      }
    }

    const stats = [...byActor.values()].sort((a, b) => b.total_actions - a.total_actions);
    return Response.json({ stats });
  } catch (err) {
    console.error("Maintainer stats error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
