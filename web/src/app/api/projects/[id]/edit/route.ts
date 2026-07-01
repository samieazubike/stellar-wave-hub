import { projectsCol } from "@/lib/db";
import { getAuthUser, hasMinRole } from "@/lib/auth";
import { parseJsonBody } from "@/lib/validation/parse-body";
import { editProjectSchema } from "@/lib/validation/schemas/projects";
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
  if (project.user_id !== auth.userId && !hasMinRole(auth.role, "admin")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = await parseJsonBody(request, editProjectSchema);
  if (!parsed.success) return parsed.response;

  try {
    const body = parsed.data;
    const allowed = ["name", "description", "category", "stellar_account_id", "stellar_contract_id", "stellar_network", "tags", "website_url", "github_url", "github_repos", "logo_url", "research_images"] as const;
    const maintainerAllowed = ["category", "tags"] as const;
    const editableFields = isMaintainer ? maintainerAllowed : allowed;

    const requestedFields = Object.keys(body).filter((key) => body[key as keyof typeof body] !== undefined);
    const disallowedFields = requestedFields.filter((key) => !editableFields.includes(key as (typeof allowed)[number] & (typeof maintainerAllowed)[number]));

    if (isMaintainer && disallowedFields.length > 0) {
      return Response.json({ error: "Maintainers can only update category and tags" }, { status: 403 });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    const changedFields: string[] = [];

    for (const key of editableFields) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
        if (JSON.stringify(project[key]) !== JSON.stringify(body[key])) {
          changedFields.push(key);
        }
      }
    }

    if (Object.keys(updates).length > 1) {
      await ref.update(updates);
    }

    if ((isAdmin || isMaintainer) && changedFields.some((field) => field === "category" || field === "tags")) {
      await moderationLogsCol.ref.add({
        project_id: String(project.numericId ?? id),
        project_doc_id: id,
        action: "project_edit",
        actor_user_id: auth.userId,
        actor_role: auth.role,
        changed_fields: changedFields.filter((field) => field === "category" || field === "tags"),
        old_values: Object.fromEntries(
          changedFields.filter((field) => field === "category" || field === "tags").map((field) => [field, project[field]])
        ),
        new_values: Object.fromEntries(
          changedFields.filter((field) => field === "category" || field === "tags").map((field) => [field, updates[field]])
        ),
        created_at: new Date().toISOString(),
      });
    }

    const updated = await ref.get();
    return Response.json({ project: { ...updated.data(), id: updated.data()!.numericId } });
  } catch (err) {
    console.error("Edit project error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
