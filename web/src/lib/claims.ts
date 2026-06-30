export const CLAIM_TIMEOUT_MS = 30 * 60 * 1000;

export function isClaimStale(claimedAt: string): boolean {
  return Date.now() - new Date(claimedAt).getTime() > CLAIM_TIMEOUT_MS;
}
