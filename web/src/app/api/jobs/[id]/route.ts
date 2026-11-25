import { getAuthUser, hasMinRole } from "@/lib/auth";
import { jobsCol } from "@/lib/db";
import { isJobActive, updateJobSchema } from "@/lib/jobs";
import { getJobById, isPublicProjectStatus } from "@/lib/jobs-server";
import { parseJsonBody } from "@/lib/validation/parse-body";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

function parseId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function canManage(auth: { userId: number; role: string } | null, projectOwnerId: number | null) {
  if (!auth) return false;
  return hasMinRole(auth.role, "admin") || (projectOwnerId !== null && projectOwnerId === auth.userId);
}

/**
 * GET /api/jobs/:id
 *
 * Public for active jobs of listed projects. Closed or expired jobs are only
 * visible to the project owner and admins (everyone else gets 404).
 */
export async function GET(request: Request, { params }: Params) {
  const id = parseId((await params).id);
  if (!id) return Response.json({ error: "Job not found" }, { status: 404 });

  try {
    const found = await getJobById(id);
    if (!found) return Response.json({ error: "Job not found" }, { status: 404 });

    const isPublic = isJobActive(found.job) && isPublicProjectStatus(found.projectStatus);
    if (!isPublic && !canManage(getAuthUser(request), found.projectOwnerId)) {
      return Response.json({ error: "Job not found" }, { status: 404 });
    }

    return Response.json({ job: found.job });
  } catch (err) {
    console.error("Job GET error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/jobs/:id
 *
 * Project owner or admin. `featured_until` may only be set by admins.
 */
export async function PATCH(request: Request, { params }: Params) {
  const auth = getAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const id = parseId((await params).id);
  if (!id) return Response.json({ error: "Job not found" }, { status: 404 });

  const parsed = await parseJsonBody(request, updateJobSchema);
  if (!parsed.success) return parsed.response;

  try {
    const found = await getJobById(id);
    if (!found) return Response.json({ error: "Job not found" }, { status: 404 });
    if (!canManage(auth, found.projectOwnerId)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    if (parsed.data.featured_until !== undefined && !hasMinRole(auth.role, "admin")) {
      return Response.json({ error: "Only admins can change featured status" }, { status: 403 });
    }

    const updates = { ...parsed.data, updated_at: new Date().toISOString() };
    await jobsCol.ref.doc(String(id)).update(updates);

    const { project, ...job } = found.job;
    return Response.json({ job: { ...job, ...updates, project } });
  } catch (err) {
    console.error("Job PATCH error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/jobs/:id
 *
 * Project owner or admin.
 */
export async function DELETE(request: Request, { params }: Params) {
  const auth = getAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const id = parseId((await params).id);
  if (!id) return Response.json({ error: "Job not found" }, { status: 404 });

  try {
    const found = await getJobById(id);
    if (!found) return Response.json({ error: "Job not found" }, { status: 404 });
    if (!canManage(auth, found.projectOwnerId)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    await jobsCol.ref.doc(String(id)).delete();
    return Response.json({ message: "Job deleted" });
  } catch (err) {
    console.error("Job DELETE error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
