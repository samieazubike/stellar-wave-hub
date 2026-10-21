import {
  getFeaturedPaymentAddress,
  getFeaturedTiers,
  getStellarNetwork,
} from "@/lib/featured-pricing";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json({
      tiers: getFeaturedTiers(),
      paymentAddress: getFeaturedPaymentAddress(),
      network: getStellarNetwork(),
    });
  } catch (error) {
    console.error("Get featured configuration error:", error);
    return Response.json(
      { error: "Featured spotlight is not configured correctly" },
      { status: 500 },
    );
  }
}
