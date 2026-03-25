import { projectsCol } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import {
	isAllowedProjectCategory,
	normalizeProjectCategory,
	normalizeProjectTags,
	normalizeProjectText,
} from "@/lib/projects";
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
    const allowed = ["name", "description", "category", "stellar_account_id", "stellar_contract_id", "tags", "website_url", "github_url", "logo_url"];
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.category !== undefined && !isAllowedProjectCategory(body.category)) {
      return Response.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    if (
      body.description !== undefined &&
      String(body.description).trim().length < 200
    ) {
      return Response.json(
        { error: "Description must be at least 200 characters" },
        { status: 400 }
      );
    }

    for (const key of allowed) {
      if (body[key] === undefined) continue;

      if (key === "category") {
        updates[key] = normalizeProjectCategory(body[key]);
        continue;
      }

      if (key === "tags") {
        updates[key] = normalizeProjectTags(body[key]);
        continue;
      }

      if (
        key === "website_url" ||
        key === "github_url" ||
        key === "logo_url" ||
        key === "stellar_account_id" ||
        key === "stellar_contract_id"
      ) {
        updates[key] = normalizeProjectText(body[key]);
        continue;
      }

      if (key === "name" || key === "description") {
        updates[key] = String(body[key]).trim();
        continue;
      }

      updates[key] = body[key];
    }

    const nextAccountId =
      updates.stellar_account_id !== undefined
        ? updates.stellar_account_id
        : project.stellar_account_id;
    const nextContractId =
      updates.stellar_contract_id !== undefined
        ? updates.stellar_contract_id
        : project.stellar_contract_id;

    if (!nextAccountId && !nextContractId) {
      return Response.json(
        {
          error: "Provide at least one Stellar account ID or Soroban contract ID",
        },
        { status: 400 }
      );
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
