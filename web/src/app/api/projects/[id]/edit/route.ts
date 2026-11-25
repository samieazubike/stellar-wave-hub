import { projectsCol } from "@/lib/db";
import { getSupabase } from "@/lib/firebase";
import { getAuthUser, hasMinRole } from "@/lib/auth";
import { parseJsonBody } from "@/lib/validation/parse-body";
import { editProjectSchema } from "@/lib/validation/schemas/projects";
import { revalidatePublicProjectCache } from "@/lib/public-project-cache";
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
  const isOwner = project.user_id === auth.userId;
  const isAdmin = hasMinRole(auth.role, "admin");
  if (!isOwner && !isAdmin && !hasMinRole(auth.role, "maintainer")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = await parseJsonBody(request, editProjectSchema);
  if (!parsed.success) return parsed.response;
  if (
    !isOwner &&
    !isAdmin &&
    (project.status !== "submitted" ||
      Object.keys(parsed.data).some((key) => key !== "category" && key !== "tags"))
  ) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = parsed.data;
    const allowed = ["name", "description", "category", "stellar_account_id", "stellar_contract_id", "stellar_network", "tags", "website_url", "github_url", "github_repos", "logo_url", "research_images"] as const;
    const updates: Record<string, unknown> = {
      updated_at: new Date(Math.max(Date.now(), Date.parse(project.updated_at) + 1)).toISOString(),
    };

    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    if (body.stellar_account_id !== undefined && body.stellar_account_id !== project.stellar_account_id) {
      updates.owner_verified_at = null;
      updates.owner_verified_address = null;
    }

    // Compare the version read above so a concurrent verification or edit
    // cannot leave verification attached to a different account.
    const { data: updated, error: updateError } = await getSupabase().from("projects")
      .update(updates).eq("numericId", project.numericId)
      .eq("updated_at", project.updated_at).select("*").maybeSingle();
    if (updateError) throw updateError;
    if (!updated) {
      return Response.json({ error: "Project changed while saving. Please reload and try again." }, { status: 409 });
    }
    revalidatePublicProjectCache();
    return Response.json({ project: { ...updated, id: updated.numericId } });
  } catch (err) {
    console.error("Edit project error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
