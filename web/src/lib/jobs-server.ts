import { getSupabase } from "./firebase";
import {
  compareJobs,
  JOB_TYPES,
  type Job,
  type JobProjectSummary,
  type JobType,
} from "./jobs";

const PUBLIC_PROJECT_STATUSES = ["approved", "featured"];

export interface JobFilters {
  type?: JobType;
  category?: string;
  projectId?: number;
  currency?: "XLM" | "USD";
  remote?: boolean;
  q?: string;
  limit?: number;
}

export function parseJobFilters(params: URLSearchParams): JobFilters {
  const filters: JobFilters = {};

  const type = params.get("type")?.trim().toLowerCase();
  if (type && (JOB_TYPES as readonly string[]).includes(type)) filters.type = type as JobType;

  const category = params.get("category")?.trim().toLowerCase();
  if (category) filters.category = category;

  const projectId = Number(params.get("project_id"));
  if (Number.isSafeInteger(projectId) && projectId > 0) filters.projectId = projectId;

  const currency = params.get("currency")?.trim().toUpperCase();
  if (currency === "XLM" || currency === "USD") filters.currency = currency;

  const remote = params.get("remote");
  if (remote === "true" || remote === "1") filters.remote = true;
  if (remote === "false" || remote === "0") filters.remote = false;

  const q = params.get("q")?.trim();
  if (q) filters.q = q.slice(0, 100);

  const limit = Number(params.get("limit"));
  if (Number.isSafeInteger(limit) && limit > 0) filters.limit = Math.min(limit, 100);

  return filters;
}

function toProjectSummary(row: Record<string, unknown>): JobProjectSummary {
  return {
    id: Number(row.numericId),
    name: String(row.name ?? ""),
    slug: String(row.slug ?? ""),
    category: String(row.category ?? "other"),
    logo_url: (row.logo_url as string | null) ?? null,
    website_url: (row.website_url as string | null) ?? null,
    description: (row.description as string | null) ?? null,
  };
}

async function fetchProjects(ids: number[]): Promise<Map<number, Record<string, unknown>>> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return new Map();

  const { data, error } = await getSupabase()
    .from("projects")
    .select('"numericId", name, slug, category, status, logo_url, website_url, description, user_id')
    .in("numericId", unique);
  if (error) throw error;

  return new Map((data ?? []).map((row) => [Number(row.numericId), row as Record<string, unknown>]));
}

function normalizeJob(row: Record<string, unknown>): Job {
  return {
    ...(row as unknown as Job),
    id: Number(row.id),
    project_id: Number(row.project_id),
    posted_by: Number(row.posted_by),
    compensation: row.compensation == null ? null : Number(row.compensation),
  };
}

/**
 * Active, unexpired jobs from publicly listed projects, featured jobs first.
 */
export async function listActiveJobs(filters: JobFilters = {}): Promise<Job[]> {
  const now = new Date();

  let query = getSupabase()
    .from("jobs")
    .select("*")
    .eq("status", "active")
    .gt("expires_at", now.toISOString())
    .order("created_at", { ascending: false })
    .limit(500);

  if (filters.type) query = query.eq("type", filters.type);
  if (filters.projectId) query = query.eq("project_id", filters.projectId);
  if (filters.currency) query = query.eq("compensation_currency", filters.currency);
  if (filters.remote !== undefined) query = query.eq("remote", filters.remote);
  if (filters.q) {
    const term = filters.q.replace(/[%_,()]/g, " ");
    query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  const jobs = (data ?? []).map((row) => normalizeJob(row as Record<string, unknown>));
  const projects = await fetchProjects(jobs.map((job) => job.project_id));

  const visible = jobs
    .filter((job) => {
      const project = projects.get(job.project_id);
      if (!project) return false;
      if (!PUBLIC_PROJECT_STATUSES.includes(String(project.status))) return false;
      if (filters.category && String(project.category).toLowerCase() !== filters.category) return false;
      return true;
    })
    .map((job) => ({ ...job, project: toProjectSummary(projects.get(job.project_id)!) }))
    .sort((a, b) => compareJobs(a, b, now));

  return filters.limit ? visible.slice(0, filters.limit) : visible;
}

export interface JobWithOwner {
  job: Job;
  /** user_id of the project that owns the job. */
  projectOwnerId: number | null;
  projectStatus: string | null;
}

/** Fetch a job by id regardless of status, with its project attached. */
export async function getJobById(id: number): Promise<JobWithOwner | null> {
  const { data, error } = await getSupabase().from("jobs").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const job = normalizeJob(data as Record<string, unknown>);
  const projects = await fetchProjects([job.project_id]);
  const project = projects.get(job.project_id);

  return {
    job: { ...job, project: project ? toProjectSummary(project) : null },
    projectOwnerId: project ? Number(project.user_id) : null,
    projectStatus: project ? String(project.status) : null,
  };
}

export function isPublicProjectStatus(status: string | null): boolean {
  return status != null && PUBLIC_PROJECT_STATUSES.includes(status);
}
