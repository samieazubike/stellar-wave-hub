import { getFeaturedTiers } from "@/lib/featured-pricing";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const network =
      process.env.NEXT_PUBLIC_CONTRACT_NETWORK === "mainnet" ? "mainnet" : "testnet";
    return Response.json({
      tiers: getFeaturedTiers(),
      destination: process.env.STELLAR_PAYMENT_ADDRESS || null,
      network,
      horizonUrl:
        process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL ||
        (network === "mainnet"
          ? "https://horizon.stellar.org"
          : "https://horizon-testnet.stellar.org"),
    });
  } catch (error) {
    console.error("Featured config error:", error);
    return Response.json(
      { error: "Featured pricing is not configured correctly" },
      { status: 500 },
    );
  }
}