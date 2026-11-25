/** Claims older than this are treated as released (no cron needed). */
export function parseClaimTtlMinutes(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 30;
}

export const CLAIM_TTL_MINUTES = parseClaimTtlMinutes(process.env.CLAIM_TTL_MINUTES);

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
