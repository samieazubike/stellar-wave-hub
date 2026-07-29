import { getSupabase } from "@/lib/firebase";
import { projectsCol } from "@/lib/db";
import { getAuthUser, hasMinRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/moderation-log — list moderation audit entries (admin only)
export async function GET(request: Request) {
  const auth = getAuthUser(request);
  if (!auth || !hasMinRole(auth.role, "admin")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const limitParam = Number(url.searchParams.get("limit") ?? "100");
    const limit = Number.isFinite(limitParam)
      ? Math.min(Math.max(limitParam, 1), 500)
      : 100;

    const supabase = getSupabase();
    // No projects FK join: deleted projects must still appear in the audit trail.
    const { data, error } = await supabase
      .from("moderation_log")
      .select(
        "id, actor_id, action, project_id, reason, created_at, users:actor_id(username)",
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    const projectCache = new Map<
      number,
      { name: string; slug: string } | null
    >();

    const entries = await Promise.all(
      (data ?? []).map(async (row: Record<string, unknown>) => {
        const actor =
          row.users && typeof row.users === "object" && !Array.isArray(row.users)
            ? (row.users as Record<string, unknown>)
            : null;

        const projectId = Number(row.project_id);
        if (!projectCache.has(projectId)) {
          const pDoc = await projectsCol.ref.doc(String(projectId)).get();
          projectCache.set(
            projectId,
            pDoc.exists
              ? {
                  name: pDoc.data()!.name as string,
                  slug: pDoc.data()!.slug as string,
                }
              : null,
          );
        }
        const project = projectCache.get(projectId);

        return {
          id: row.id,
          actor_id: row.actor_id,
          actor_username: (actor?.username as string | undefined) ?? null,
          action: row.action,
          project_id: projectId,
          project_name: project?.name ?? null,
          project_slug: project?.slug ?? null,
          reason: (row.reason as string | null) ?? null,
          created_at: row.created_at,
        };
      }),
    );

    return Response.json({ entries });
  } catch (err) {
    console.error("Moderation log GET error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
