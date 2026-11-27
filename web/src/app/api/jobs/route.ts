import { getAuthUser, hasMinRole } from "@/lib/auth";
import { jobsCol, nextId, projectsCol } from "@/lib/db";
import { createJobSchema, defaultExpiry } from "@/lib/jobs";
import { isPublicProjectStatus, listActiveJobs, parseJobFilters } from "@/lib/jobs-server";
import { parseJsonBody } from "@/lib/validation/parse-body";

export const dynamic = "force-dynamic";

/**
 * GET /api/jobs
 *
 * Public list of active, unexpired jobs from approved/featured projects.
 * Featured jobs are returned first, then newest first.
 *
 * Query params (all optional):
 *   type       full_time | part_time | contract | internship | bounty
 *   category   project category (defi, payments, ...)
 *   project_id numeric project id
 *   currency   XLM | USD
 *   remote     true | false
 *   q          free-text search on title and description
 *   limit      max results (1-100)
 */
export async function GET(request: Request) {
  try {
    const filters = parseJobFilters(new URL(request.url).searchParams);
    const jobs = await listActiveJobs(filters);
    return Response.json({ jobs });
  } catch (err) {
    console.error("Jobs GET error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/jobs
 *
 * Create a job for a project. Only the project owner or an admin may post.
 */
export async function POST(request: Request) {
  const auth = getAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = await parseJsonBody(request, createJobSchema);
  if (!parsed.success) return parsed.response;
  const input = parsed.data;

  try {
    const projectDoc = await projectsCol.ref.doc(String(input.project_id)).get();
    if (!projectDoc.exists) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }
    const project = projectDoc.data()!;
    const isAdmin = hasMinRole(auth.role, "admin");

    if (Number(project.user_id) !== auth.userId && !isAdmin) {
      return Response.json({ error: "You can only post jobs for your own projects" }, { status: 403 });
    }
    if (!isAdmin && !isPublicProjectStatus(String(project.status))) {
      return Response.json(
        { error: "Jobs can only be posted for approved projects" },
        { status: 400 },
      );
    }

    const id = await nextId("jobs");
    const now = new Date().toISOString();
    const job = {
      id,
      project_id: input.project_id,
      posted_by: auth.userId,
      title: input.title,
      description: input.description,
      type: input.type,
      compensation: input.compensation ?? null,
      compensation_currency: input.compensation_currency,
      compensation_period: input.compensation_period,
      location: input.location ?? null,
      remote: input.remote,
      apply_url: input.apply_url,
      status: "draft",
      featured_until: null,
      expires_at: input.expires_at ?? defaultExpiry(),
      tx_hash: null,
      created_at: now,
      updated_at: now,
    };

    await jobsCol.ref.doc(String(id)).set(job);
    return Response.json({ job }, { status: 201 });
  } catch (err) {
    console.error("Jobs POST error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
