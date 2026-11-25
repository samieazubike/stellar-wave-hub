import { getAuthUser, hasMinRole } from "@/lib/auth";
import { getSupabase } from "@/lib/firebase";
import { parseJsonBody } from "@/lib/validation/parse-body";
import { updateReportStatusSchema } from "@/lib/validation/schemas/reports";

export const dynamic = "force-dynamic";

const REPORT_STATUSES = ["open", "resolved", "dismissed"] as const;
type ReportStatus = (typeof REPORT_STATUSES)[number];

interface ReportRow {
  id: number;
  reporter_id: number;
  target_type: "project" | "rating";
  target_id: number;
  reason: string;
  details: string | null;
  status: ReportStatus;
  created_at: string;
  resolved_at: string | null;
  resolved_by: number | null;
}

function isReportStatus(value: unknown): value is ReportStatus {
  return typeof value === "string" &&
    REPORT_STATUSES.includes(value as ReportStatus);
}

export async function GET(request: Request) {
  const auth = getAuthUser(request);
  if (!auth || !hasMinRole(auth.role, "admin")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status") || "open";
    if (status !== "all" && !isReportStatus(status)) {
      return Response.json({ error: "Invalid report status" }, { status: 400 });
    }

    const supabase = getSupabase();
    let query = supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });
    if (status !== "all") query = query.eq("status", status);

    const { data, error } = await query;
    if (error) throw error;

    const reports = (data || []) as ReportRow[];
    if (reports.length === 0) return Response.json({ reports: [] });

    const reporterIds = [...new Set(reports.map((report) => report.reporter_id))];
    const reviewIds = [
      ...new Set(
        reports
          .filter((report) => report.target_type === "rating")
          .map((report) => report.target_id),
      ),
    ];

    const ratingsQuery = reviewIds.length > 0
      ? supabase
          .from("ratings")
          .select("*")
          .in("numericId", reviewIds)
      : null;
    const [reportersResult, ratingsResult] = await Promise.all([
      supabase
        .from("users")
        .select("*")
        .in("numericId", reporterIds),
      ratingsQuery || Promise.resolve(null),
    ]);
    if (reportersResult.error) throw reportersResult.error;
    if (ratingsResult?.error) throw ratingsResult.error;

    const ratings = ratingsResult?.data || [];
    const ratingsById = new Map(
      ratings.map((rating) => [Number(rating.numericId), rating]),
    );
    const projectIds = [
      ...new Set([
        ...reports
          .filter((report) => report.target_type === "project")
          .map((report) => report.target_id),
        ...ratings.map((rating) => Number(rating.project_id)),
      ]),
    ];

    const projectsResult = projectIds.length > 0
      ? await supabase
          .from("projects")
          .select("*")
          .in("numericId", projectIds)
      : { data: [], error: null };
    if (projectsResult.error) throw projectsResult.error;

    const reportersById = new Map(
      (reportersResult.data || []).map((reporter) => [
        Number(reporter.numericId),
        reporter.username,
      ]),
    );
    const projectsById = new Map(
      (projectsResult.data || []).map((project) => [
        Number(project.numericId),
        project,
      ]),
    );

    return Response.json({
      reports: reports.map((report) => {
        const rating = report.target_type === "rating"
          ? ratingsById.get(report.target_id)
          : null;
        const projectId = report.target_type === "project"
          ? report.target_id
          : Number(rating?.project_id);
        const project = projectsById.get(projectId);

        return {
          ...report,
          reporter_username: reportersById.get(report.reporter_id) || "Unknown user",
          target_name: report.target_type === "project"
            ? project?.name || "Project unavailable"
            : project?.name
              ? `Review on ${project.name}`
              : "Review unavailable",
          target_excerpt: report.target_type === "rating"
            ? rating?.review_text || ""
            : "",
          target_url: project?.slug
            ? report.target_type === "rating"
              ? `/projects/${encodeURIComponent(project.slug)}#rating-${report.target_id}`
              : `/projects/${encodeURIComponent(project.slug)}`
            : null,
        };
      }),
    });
  } catch (err) {
    console.error("Fetch admin reports error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = getAuthUser(request);
  if (!auth || !hasMinRole(auth.role, "admin")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = await parseJsonBody(request, updateReportStatusSchema);
  if (!parsed.success) return parsed.response;
  const { id, status } = parsed.data;

  try {

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("reports")
      .update({
        status,
        resolved_at: new Date().toISOString(),
        resolved_by: auth.userId,
      })
      .eq("id", id)
      .eq("status", "open")
      .select("id, status, resolved_at, resolved_by")
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return Response.json(
        { error: "Open report not found" },
        { status: 404 },
      );
    }

    return Response.json({ report: data });
  } catch (err) {
    console.error("Update admin report error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
