/**
 * Supporter eligibility from donated XLM.
 *
 * Donations are the `tip` payments recorded by /api/tips. Sponsorships and
 * Pro subscriptions are purchases, not donations, so they do not count toward
 * the badge. Only the server should call these helpers.
 */

import { getSupabase } from "@/lib/firebase";

export const SUPPORTER_MIN_XLM = 10;
export const DONATION_PRODUCT = "tip";

export interface SupporterStatus {
  is_supporter: boolean;
  total_xlm: number;
  threshold: number;
}

const notSupporter = (threshold: number): SupporterStatus => ({
  is_supporter: false,
  total_xlm: 0,
  threshold,
});

/** Threshold from configuration; an invalid value fails loudly. */
export function getSupporterThreshold(): number {
  const configured = process.env.SUPPORTER_MIN_XLM;
  if (configured === undefined || configured.trim() === "") return SUPPORTER_MIN_XLM;

  const threshold = Number(configured);
  if (!Number.isFinite(threshold) || threshold <= 0) {
    throw new Error("SUPPORTER_MIN_XLM must be a positive finite number of XLM");
  }
  return threshold;
}

/** Sum donated XLM per user in one query. Invalid rows are ignored. */
export async function getDonationTotals(
  userIds: Array<number | string | null | undefined>,
): Promise<Map<number, number>> {
  const ids = [...new Set(userIds.map(Number))].filter(
    (id) => Number.isInteger(id) && id > 0,
  );
  if (ids.length === 0) return new Map();

  const { data, error } = await getSupabase()
    .from("payments")
    .select("user_id, amount")
    .eq("product", DONATION_PRODUCT)
    .in("user_id", ids);

  if (error) throw new Error(`Failed to load donation totals: ${error.message}`);

  const totals = new Map<number, number>();
  for (const row of data ?? []) {
    const id = Number(row.user_id);
    const amount = Number(row.amount);
    if (!Number.isInteger(id) || id <= 0) continue;
    if (!Number.isFinite(amount) || amount <= 0) continue;
    totals.set(id, (totals.get(id) ?? 0) + amount);
  }
  return totals;
}

/** Eligibility for several users, computed with a single payment query. */
export async function getSupporterStatuses(
  userIds: Array<number | string | null | undefined>,
): Promise<Map<number, SupporterStatus>> {
  const ids = [...new Set(userIds.map(Number))].filter(
    (id) => Number.isInteger(id) && id > 0,
  );
  const threshold = getSupporterThreshold();
  if (ids.length === 0) return new Map();

  const totals = await getDonationTotals(ids);
  const statuses = new Map<number, SupporterStatus>();
  for (const id of ids) {
    const totalXlm = totals.get(id) ?? 0;
    statuses.set(id, {
      is_supporter: totalXlm >= threshold,
      total_xlm: totalXlm,
      threshold,
    });
  }
  return statuses;
}

/** Eligibility for one user. */
export async function getSupporterStatus(
  userId: number | string | null | undefined,
): Promise<SupporterStatus> {
  const threshold = getSupporterThreshold();
  const statuses = await getSupporterStatuses([userId]);
  return statuses.get(Number(userId)) ?? notSupporter(threshold);
}
