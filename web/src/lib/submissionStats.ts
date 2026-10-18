export const STATS_WEEKS = 12;
export const APPROVAL_STATUSES = ["approved", "featured"];

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

export interface SubmissionRecord {
  created_at?: string | null;
}

/** An approve/feature event, e.g. the notification written by the approve route. */
export interface ApprovalEvent {
  project_id?: number | null;
  status?: string;
  created_at?: string | null;
}

export interface WeeklyStat {
  week_start: string; // YYYY-MM-DD (Monday, UTC)
  submissions: number;
  approvals: number;
}

/** Monday 00:00 UTC of the week containing `date`. */
export function startOfUtcWeek(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const daysSinceMonday = (d.getUTCDay() + 6) % 7;
  return new Date(d.getTime() - daysSinceMonday * DAY_MS);
}

/**
 * Buckets submissions (by project `created_at`) and approvals (by approve/feature event
 * `created_at`) into the last `weeks` UTC weeks, oldest first. A project approved and
 * then featured in the same week counts as one approval.
 */
export function weeklySubmissionStats(
  projects: SubmissionRecord[],
  approvals: ApprovalEvent[],
  now: Date = new Date(),
  weeks: number = STATS_WEEKS,
): WeeklyStat[] {
  const firstWeek = startOfUtcWeek(now).getTime() - (weeks - 1) * WEEK_MS;
  const result: WeeklyStat[] = Array.from({ length: weeks }, (_, i) => ({
    week_start: new Date(firstWeek + i * WEEK_MS).toISOString().slice(0, 10),
    submissions: 0,
    approvals: 0,
  }));

  const weekIndex = (value?: string | null): number => {
    if (!value) return -1;
    const t = new Date(value).getTime();
    if (Number.isNaN(t) || t < firstWeek) return -1;
    const i = Math.floor((t - firstWeek) / WEEK_MS);
    return i < weeks ? i : -1;
  };

  for (const p of projects) {
    const i = weekIndex(p.created_at);
    if (i >= 0) result[i].submissions++;
  }

  const seen = new Set<string>();
  for (const e of approvals) {
    if (!e.status || !APPROVAL_STATUSES.includes(e.status)) continue;
    const i = weekIndex(e.created_at);
    if (i < 0) continue;
    const key = `${e.project_id}:${i}`;
    if (e.project_id != null && seen.has(key)) continue;
    seen.add(key);
    result[i].approvals++;
  }

  return result;
}
