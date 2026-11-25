import { getSupabase } from "@/lib/firebase";
import { getSpotlightTiers } from "@/lib/pricing";
import {
  applyPromoDiscount,
  findPromoCode,
  promoCodeRejection,
} from "@/lib/promo-codes";

export const dynamic = "force-dynamic";

function resolveBasePrice(url: URL): { basePrice: number; days?: number } | { error: string } {
  const daysParam = url.searchParams.get("days");
  if (daysParam !== null) {
    const days = Number(daysParam);
    const tier = Number.isInteger(days)
      ? getSpotlightTiers().find((candidate) => candidate.days === days)
      : undefined;
    if (!tier) return { error: "Unsupported spotlight duration" };
    return { basePrice: tier.priceXlm, days: tier.days };
  }

  const baseParam = url.searchParams.get("base_price");
  if (baseParam !== null) {
    const basePrice = Number(baseParam);
    if (!Number.isFinite(basePrice) || basePrice <= 0) {
      return { error: "Base price must be a positive amount" };
    }
    return { basePrice };
  }

  return { basePrice: getSpotlightTiers().find((tier) => tier.days === 30)!.priceXlm, days: 30 };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const rawCode = url.searchParams.get("code") ?? url.searchParams.get("promo_code");
    if (!rawCode?.trim()) {
      return Response.json({ error: "Promo code is required" }, { status: 400 });
    }

    const pricing = resolveBasePrice(url);
    if ("error" in pricing) {
      return Response.json({ error: pricing.error }, { status: 400 });
    }

    const promo = await findPromoCode(getSupabase(), rawCode);
    if (!promo) {
      return Response.json({ error: "Invalid promo code" }, { status: 404 });
    }

    const rejection = promoCodeRejection(promo);
    if (rejection) {
      return Response.json({ error: rejection }, { status: 400 });
    }

    const percentOff = Number(promo.percent_off);
    const { discountAmount, finalPrice } = applyPromoDiscount(
      pricing.basePrice,
      percentOff,
    );

    return Response.json({
      valid: true,
      code: promo.code,
      percent_off: percentOff,
      base_price: pricing.basePrice,
      discount_amount: discountAmount,
      final_price: finalPrice,
      ...(pricing.days ? { days: pricing.days } : {}),
    });
  } catch (err) {
    console.error("Validate promo code error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
