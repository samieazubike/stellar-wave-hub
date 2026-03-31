import { projectsCol } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const ref = projectsCol.ref.doc(id);
  const doc = await ref.get();
  if (!doc.exists) return Response.json({ error: "Project not found" }, { status: 404 });

  const project = doc.data()!;
  if (project.user_id !== auth.userId && auth.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const allowed = ["name", "description", "category", "stellar_account_id", "stellar_contract_id", "stellar_network", "tags", "website_url", "github_url", "github_repos", "logo_url", "research_images"];
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    if (Object.keys(updates).length <= 1) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    await ref.update(updates);
    const updated = await ref.get();
    return Response.json({ project: { ...updated.data(), id: updated.data()!.numericId } });
  } catch (err) {
    console.error("Edit project error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
