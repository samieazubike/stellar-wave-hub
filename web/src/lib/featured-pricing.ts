export const FEATURED_DURATIONS = [7, 30, 90] as const;

export type FeaturedDuration = (typeof FEATURED_DURATIONS)[number];

export interface FeaturedTier {
  days: FeaturedDuration;
  priceXlm: number;
}

const DEFAULT_TIERS: FeaturedTier[] = [
  { days: 7, priceXlm: 15 },
  { days: 30, priceXlm: 50 },
  { days: 90, priceXlm: 120 },
];

export function getFeaturedTiers(
  value = process.env.NEXT_PUBLIC_FEATURED_TIERS,
): FeaturedTier[] {
  if (!value) return DEFAULT_TIERS.map((tier) => ({ ...tier }));

  const tiers = new Map<number, number>();
  for (const entry of value.split(",")) {
    const match = /^\s*(\d+)\s*:\s*(\d+(?:\.\d{1,7})?)\s*$/.exec(entry);
    if (!match) {
      throw new Error("NEXT_PUBLIC_FEATURED_TIERS must use days:price pairs");
    }

    const days = Number(match[1]);
    const priceXlm = Number(match[2]);
    if (
      !FEATURED_DURATIONS.includes(days as FeaturedDuration) ||
      !Number.isFinite(priceXlm) ||
      priceXlm <= 0 ||
      tiers.has(days)
    ) {
      throw new Error("NEXT_PUBLIC_FEATURED_TIERS contains an invalid tier");
    }
    tiers.set(days, priceXlm);
  }

  if (tiers.size !== FEATURED_DURATIONS.length) {
    throw new Error("NEXT_PUBLIC_FEATURED_TIERS must include 7, 30, and 90 days");
  }

  return FEATURED_DURATIONS.map((days) => ({
    days,
    priceXlm: tiers.get(days)!,
  }));
}

export function xlmToStroops(amount: number | string): bigint {
  const value = String(amount);
  const match = /^(0|[1-9]\d*)(?:\.(\d{1,7}))?$/.exec(value);
  if (!match) throw new Error("XLM amount must have at most 7 decimal places");
  return BigInt(match[1]) * BigInt(10_000_000) + BigInt((match[2] ?? "").padEnd(7, "0"));
}

export function formatXlmAmount(amount: number): string {
  return amount.toFixed(7).replace(/\.?0+$/, "");
}