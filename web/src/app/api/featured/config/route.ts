import { featuredDestination, featuredDurationDays, featuredPriceXlm, FEATURED_MEMO_PREFIX } from "@/lib/featuredService";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    destination: featuredDestination,
    price_xlm: featuredPriceXlm,
    duration_days: featuredDurationDays,
    memo_prefix: FEATURED_MEMO_PREFIX,
    network: process.env.NEXT_PUBLIC_CONTRACT_NETWORK || "testnet",
  });
}

