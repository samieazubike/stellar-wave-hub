import { z } from "zod";

// Shared job-board types, constants and validation. Kept free of database
// imports so client components can use the labels and helpers too.

export const JOB_TYPES = ["full_time", "part_time", "contract", "internship", "bounty"] as const;
export type JobType = (typeof JOB_TYPES)[number];

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
  bounty: "Bounty",
};

export const JOB_CURRENCIES = ["XLM", "USD"] as const;
export type JobCurrency = (typeof JOB_CURRENCIES)[number];

export const JOB_PERIODS = ["hour", "month", "year", "fixed"] as const;
export type JobPeriod = (typeof JOB_PERIODS)[number];

export const JOB_STATUSES = ["draft", "active", "closed"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

/** Longest a posting may stay open without being renewed. */
export const MAX_JOB_DURATION_DAYS = 90;
export const DEFAULT_JOB_DURATION_DAYS = 30;

export interface JobProjectSummary {
  id: number;
  name: string;
  slug: string;
  category: string;
  logo_url: string | null;
  website_url: string | null;
  description?: string | null;
}

export interface Job {
  id: number;
  project_id: number;
  posted_by: number;
  title: string;
  description: string;
  type: JobType;
  compensation: number | null;
  compensation_currency: JobCurrency;
  compensation_period: JobPeriod;
  location: string | null;
  remote: boolean;
  apply_url: string;
  status: JobStatus;
  featured_until: string | null;
  expires_at: string;
  tx_hash: string | null;
  created_at: string;
  updated_at: string;
  project?: JobProjectSummary | null;
}

const httpUrl = z
  .string()
  .trim()
  .url("Apply URL must be a valid URL")
  .max(500)
  .refine((value) => /^https?:\/\//i.test(value), "Apply URL must start with http:// or https://");

function maxExpiry(): Date {
  return new Date(Date.now() + MAX_JOB_DURATION_DAYS * 24 * 60 * 60 * 1000);
}

const expiresAt = z
  .string()
  .datetime({ offset: true, message: "expires_at must be an ISO 8601 date-time" })
  .refine((value) => new Date(value).getTime() > Date.now(), "expires_at must be in the future")
  .refine(
    (value) => new Date(value).getTime() <= maxExpiry().getTime(),
    `expires_at must be within ${MAX_JOB_DURATION_DAYS} days`,
  );

const jobFields = {
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(120),
  description: z.string().trim().min(20, "Description must be at least 20 characters").max(10000),
  type: z.enum(JOB_TYPES),
  compensation: z.number().nonnegative().finite().nullable(),
  compensation_currency: z.enum(JOB_CURRENCIES),
  compensation_period: z.enum(JOB_PERIODS),
  location: z.string().trim().max(120).nullable(),
  remote: z.boolean(),
  apply_url: httpUrl,
  expires_at: expiresAt,
  tx_hash: z
    .string()
    .trim()
    .regex(/^[a-f0-9]{64}$/i, "tx_hash must be a 64-character hex Stellar transaction hash")
    .nullable(),
};

export const createJobSchema = z.object({
  project_id: z.number().int().positive(),
  title: jobFields.title,
  description: jobFields.description,
  type: jobFields.type.default("full_time"),
  compensation: jobFields.compensation.optional(),
  compensation_currency: jobFields.compensation_currency.default("USD"),
  compensation_period: jobFields.compensation_period.default("year"),
  location: jobFields.location.optional(),
  remote: jobFields.remote.default(true),
  apply_url: jobFields.apply_url,
  expires_at: jobFields.expires_at.optional(),
  tx_hash: jobFields.tx_hash.optional(),
});

export const updateJobSchema = z
  .object({
    title: jobFields.title.optional(),
    description: jobFields.description.optional(),
    type: jobFields.type.optional(),
    compensation: jobFields.compensation.optional(),
    compensation_currency: jobFields.compensation_currency.optional(),
    compensation_period: jobFields.compensation_period.optional(),
    location: jobFields.location.optional(),
    remote: jobFields.remote.optional(),
    apply_url: jobFields.apply_url.optional(),
    expires_at: jobFields.expires_at.optional(),
    tx_hash: jobFields.tx_hash.optional(),
    status: z.enum(JOB_STATUSES).optional(),
    // Admin only: set after a paid "Featured job" upgrade is confirmed.
    featured_until: z
      .string()
      .datetime({ offset: true, message: "featured_until must be an ISO 8601 date-time" })
      .nullable()
      .optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Provide at least one field to update");

export function defaultExpiry(): string {
  return new Date(Date.now() + DEFAULT_JOB_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

export function isJobActive(job: Pick<Job, "status" | "expires_at">, now = new Date()): boolean {
  return job.status === "active" && new Date(job.expires_at).getTime() > now.getTime();
}

export function isJobFeatured(job: Pick<Job, "featured_until">, now = new Date()): boolean {
  return !!job.featured_until && new Date(job.featured_until).getTime() > now.getTime();
}

/** Featured jobs first, then newest first. */
export function compareJobs(a: Job, b: Job, now = new Date()): number {
  const featuredDiff = Number(isJobFeatured(b, now)) - Number(isJobFeatured(a, now));
  if (featuredDiff !== 0) return featuredDiff;
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

const PERIOD_SUFFIX: Record<JobPeriod, string> = {
  hour: "/hr",
  month: "/mo",
  year: "/yr",
  fixed: "",
};

export function formatCompensation(
  job: Pick<Job, "compensation" | "compensation_currency" | "compensation_period">,
): string | null {
  if (job.compensation == null) return null;
  const amount = Number(job.compensation).toLocaleString("en-US", { maximumFractionDigits: 2 });
  const value =
    job.compensation_currency === "USD" ? `$${amount}` : `${amount} XLM`;
  return `${value}${PERIOD_SUFFIX[job.compensation_period] ?? ""}`;
}
