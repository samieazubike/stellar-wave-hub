export interface FeaturedTier {
  days: number;
  priceXlm: number;
}

export type StellarNetwork = "mainnet" | "testnet";

const DEFAULT_TIERS = "7:15,30:50,90:120";

export function getFeaturedTiers(): FeaturedTier[] {
  const configured = process.env.NEXT_PUBLIC_FEATURED_TIERS ?? DEFAULT_TIERS;
  const tiers = configured.split(",").map((entry) => {
    const match = /^(\d+):(\d+(?:\.\d{1,7})?)$/.exec(entry.trim());
    if (!match) {
      throw new Error(`Invalid featured tier configuration: ${entry}`);
    }

    const days = Number(match[1]);
    const priceXlm = Number(match[2]);
    if (
      !Number.isSafeInteger(days) ||
      days <= 0 ||
      !Number.isFinite(priceXlm) ||
      priceXlm <= 0
    ) {
      throw new Error(`Invalid featured tier configuration: ${entry}`);
    }

    return { days, priceXlm };
  });

  if (tiers.length === 0 || new Set(tiers.map((tier) => tier.days)).size !== tiers.length) {
    throw new Error("Featured tiers must contain unique durations");
  }

  return tiers.sort((a, b) => a.days - b.days);
}

export function getStellarNetwork(): StellarNetwork {
  const network = process.env.NEXT_PUBLIC_CONTRACT_NETWORK ?? "testnet";
  if (network !== "mainnet" && network !== "testnet") {
    throw new Error("NEXT_PUBLIC_CONTRACT_NETWORK must be mainnet or testnet");
  }
  return network;
}

export function getFeaturedPaymentAddress(): string | null {
  return (
    process.env.FEATURED_PAYMENT_ADDRESS ??
    process.env.NEXT_PUBLIC_FEATURED_PAYMENT_ADDRESS ??
    null
  );
}
