import { projectsCol } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
export const dynamic = "force-dynamic";

type ProjectRow = {
  numericId: number;
  user_id: number;
};

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

  const project = doc.data() as ProjectRow;
  if (project.user_id !== auth.userId && auth.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const allowed = [
      "name",
      "description",
      "category",
      "asset_focus",
      "asset_type",
      "issuance_model",
      "compliance_model",
      "audit_status",
      "issuer_account_id",
      "stellar_toml_url",
      "supported_markets",
      "trading_pairs",
      "on_chain_volume",
      "verification_sources",
      "stellar_account_id",
      "stellar_contract_id",
      "tags",
      "website_url",
      "github_url",
      "logo_url",
    ];
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    if (Object.keys(updates).length <= 1) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    await ref.update(updates);
    const updated = await ref.get();
    const updatedProject = updated.data() as ProjectRow & Record<string, unknown>;
    return Response.json({ project: { ...updatedProject, id: updatedProject.numericId } });
  } catch (err) {
    console.error("Edit project error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
