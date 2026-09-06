import { getAuthUser, hasMinRole } from "@/lib/auth";
import { getSupabase } from "@/lib/firebase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = getAuthUser(request);
  if (!auth || !hasMinRole(auth.role, "admin")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const requestedLimit = Number(new URL(request.url).searchParams.get("limit") ?? 100);
    const limit = Number.isInteger(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 500)
      : 100;
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("moderation_log")
      .select("id, actor_id, action, project_id, reason, created_at, users:actor_id(username)")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    const projectIds = [...new Set((data ?? []).map((row) => Number(row.project_id)))];
    const projectById = new Map<number, { name: string; slug: string }>();

    if (projectIds.length > 0) {
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select("numericId, name, slug")
        .in("numericId", projectIds);

      if (projectsError) throw projectsError;
      for (const project of projects ?? []) {
        projectById.set(Number(project.numericId), {
          name: String(project.name),
          slug: String(project.slug),
        });
      }
    }

    const entries = (data ?? []).map((row) => {
      const actor = Array.isArray(row.users) ? row.users[0] : row.users;
      const projectId = Number(row.project_id);
      const project = projectById.get(projectId);

      return {
        id: Number(row.id),
        actor_id: Number(row.actor_id),
        actor_username: actor?.username ?? null,
        action: row.action,
        project_id: projectId,
        project_name: project?.name ?? null,
        project_slug: project?.slug ?? null,
        reason: row.reason,
        created_at: row.created_at,
      };
    });

    return Response.json({ entries });
  } catch (error) {
    console.error("Moderation log GET error:", error);
    return Response.json({ error: "Failed to load moderation log" }, { status: 500 });
  }
}
