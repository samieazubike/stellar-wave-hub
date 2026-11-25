import { getProducts } from "@/lib/pricing";

export const dynamic = "force-dynamic";

/** Public price list for every paid product (mirrors `lib/pricing.ts`). */
export async function GET() {
  try {
    return Response.json({ currency: "XLM", products: getProducts() });
  } catch (error) {
    console.error("Pricing config error:", error);
    return Response.json({ error: "Pricing is not configured correctly" }, { status: 500 });
  }
}
