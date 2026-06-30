import { usersCol, projectsCol } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { getSupabase } from "@/lib/firebase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = getAuthUser(request);
  if (!auth || auth.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const limit = Math.min(
      Math.max(Number(url.searchParams.get("limit") ?? 100), 1),
      500,
    );

    const supabase = getSupabase();
    const { data: rows, error } = await supabase
      .from("moderation_log")
      .select("id, actor_id, action, project_id, reason, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    const actorCache = new Map<number, string>();
    const projectCache = new Map<number, { name: string; slug: string | null }>();

    const entries = await Promise.all(
      (rows ?? []).map(async (row) => {
        const actorId = row.actor_id as number;
        const projectId = row.project_id as number;

        if (!actorCache.has(actorId)) {
          const userDoc = await usersCol.ref.doc(String(actorId)).get();
          actorCache.set(
            actorId,
            userDoc.exists ? (userDoc.data()!.username as string) : "unknown",
          );
        }

        if (!projectCache.has(projectId)) {
          const projectDoc = await projectsCol.ref.doc(String(projectId)).get();
          if (projectDoc.exists) {
            const data = projectDoc.data()!;
            projectCache.set(projectId, {
              name: data.name as string,
              slug: (data.slug as string) ?? null,
            });
          } else {
            projectCache.set(projectId, {
              name: `Project #${projectId}`,
              slug: null,
            });
          }
        }

        const project = projectCache.get(projectId)!;

        return {
          id: row.id,
          actor_id: actorId,
          actor_username: actorCache.get(actorId),
          action: row.action,
          project_id: projectId,
          project_name: project.name,
          project_slug: project.slug,
          reason: row.reason,
          created_at: row.created_at,
        };
      }),
    );

    return Response.json({ entries });
  } catch (err) {
    console.error("Moderation log fetch error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
