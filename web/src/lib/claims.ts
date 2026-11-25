/** Claims older than this are treated as released (no cron needed). */
export const CLAIM_TTL_MINUTES = Number(process.env.CLAIM_TTL_MINUTES) || 30;

export interface ClaimableProject {
  claimed_by?: number | string | null;
  claimed_at?: string | Date | null;
}

/** A claim is active when it has a claimer and was taken within the TTL. */
export function isClaimActive(
  project: ClaimableProject | null | undefined,
  ttlMinutes: number = CLAIM_TTL_MINUTES,
  now: number = Date.now(),
): boolean {
  if (!project || project.claimed_by == null || !project.claimed_at) {
    return false;
  }

  const claimedAt = new Date(project.claimed_at).getTime();
  if (Number.isNaN(claimedAt)) return false;

  return now - claimedAt < ttlMinutes * 60_000;
}

/** ISO timestamp before which a claim counts as expired. */
export function claimExpiryCutoff(
  ttlMinutes: number = CLAIM_TTL_MINUTES,
  now: number = Date.now(),
): string {
  return new Date(now - ttlMinutes * 60_000).toISOString();
}
