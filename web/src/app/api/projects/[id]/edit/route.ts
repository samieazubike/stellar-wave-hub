import { projectsCol } from "@/lib/db";
import { getSupabase } from "@/lib/firebase";
import { getAuthUser } from "@/lib/auth";
import { hasMinRole } from "@/lib/roles";
import { parseJsonBody } from "@/lib/validation/parse-body";
import { editProjectSchema, type EditProjectInput } from "@/lib/validation/schemas/projects";
import { revalidatePublicProjectCache } from "@/lib/public-project-cache";
import {
  FREE_RESEARCH_IMAGE_LIMIT,
  PRO_RESEARCH_IMAGE_LIMIT,
  isPro,
} from "@/lib/pro";
export const dynamic = "force-dynamic";

/** The only fields a maintainer (who is not the owner or an admin) may curate. */
const MAINTAINER_EDITABLE_FIELDS = ["category", "tags"] as const;
type MaintainerEditableField = (typeof MAINTAINER_EDITABLE_FIELDS)[number];

function isMaintainerEditable(key: string): key is MaintainerEditableField {
  return (MAINTAINER_EDITABLE_FIELDS as readonly string[]).includes(key);
}

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
  // A maintainer acting on someone else's project gets the restricted edit;
  // owners and admins keep full edit rights.
  const isCuratingMaintainer = !isOwner && !isAdmin && hasMinRole(auth.role, "maintainer");
  if (!isOwner && !isAdmin && !isCuratingMaintainer) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  // Maintainers curate category/tags during review only (#252).
  if (isCuratingMaintainer && project.status !== "submitted") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = await parseJsonBody(request, editProjectSchema);
  if (!parsed.success) return parsed.response;

  let body: Partial<EditProjectInput> = parsed.data;
  let ignoredFields: string[] = [];
  if (isCuratingMaintainer) {
    // Strip everything except category and tags rather than rejecting the
    // whole request, so a form that sends the full project still works.
    const curated: Pick<EditProjectInput, MaintainerEditableField> = {
      category: parsed.data.category,
      tags: parsed.data.tags,
    };
    ignoredFields = Object.entries(parsed.data)
      .filter(([key, value]) => value !== undefined && !isMaintainerEditable(key))
      .map(([key]) => key);
    if (curated.category === undefined && curated.tags === undefined) {
      return Response.json(
        { error: "Maintainers can only change category and tags" },
        { status: 403 },
      );
    }
    body = curated;
  }

  try {
    const projectIsPro = isPro(project);
    const maxResearchImages = projectIsPro
      ? PRO_RESEARCH_IMAGE_LIMIT
      : FREE_RESEARCH_IMAGE_LIMIT;

    if (
      Array.isArray(body.research_images) &&
      body.research_images.length > maxResearchImages
    ) {
      return Response.json(
        {
          error: projectIsPro
            ? `Maximum ${PRO_RESEARCH_IMAGE_LIMIT} research images allowed`
            : `Maximum ${FREE_RESEARCH_IMAGE_LIMIT} research images allowed for free projects. Upgrade to Pro for up to ${PRO_RESEARCH_IMAGE_LIMIT} images.`,
        },
        { status: 400 },
      );
    }

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
    return Response.json({
      project: { ...updated, id: updated.numericId },
      ...(ignoredFields.length > 0 && { ignored_fields: ignoredFields }),
    });
  } catch (err) {
    console.error("Edit project error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
