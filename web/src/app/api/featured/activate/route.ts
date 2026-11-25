import { getAuthUser, hasMinRole } from "@/lib/auth";
import { getSupabase } from "@/lib/firebase";
import { getSpotlightTiers } from "@/lib/pricing";
import { recordPayment, verifyStellarPayment } from "@/lib/payments";
import {
  applyPromoDiscount,
  consumePromoCode,
  findPromoCode,
  promoCodeRejection,
  releasePromoCode,
  type PromoCode,
} from "@/lib/promo-codes";
import { GET as getPromoQuote } from "../quote/route";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = getAuthUser(request);
  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return getPromoQuote(request);
}

export async function POST(request: Request) {
  const auth = getAuthUser(request);
  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }
    const { project_id, days, tx_hash, promoCode, promo_code } =
      body && typeof body === "object" ? body as Record<string, unknown> : {};

    if (
      typeof project_id !== "number" ||
      !Number.isSafeInteger(project_id) ||
      project_id <= 0
    ) {
      return Response.json({ error: "Project ID is required" }, { status: 400 });
    }
    if (typeof days !== "number" || !Number.isInteger(days)) {
      return Response.json({ error: "A spotlight duration is required" }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data: project, error: projError } = await supabase
      .from("projects")
      .select('"numericId",user_id,name,featured_expires_at')
      .eq("numericId", Number(project_id))
      .maybeSingle();

    if (projError) throw projError;
    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    if (Number(project.user_id) !== auth.userId && !hasMinRole(auth.role, "admin")) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const tier = getSpotlightTiers().find((candidate) => candidate.days === days);
    if (!tier) {
      return Response.json({ error: "Unsupported spotlight duration" }, { status: 400 });
    }

    const rawPromo = typeof promoCode === "string" ? promoCode : promo_code;
    let promo: PromoCode | null = null;
    let promoClaimed = false;

    if (typeof rawPromo === "string" && rawPromo.trim()) {
      promo = await findPromoCode(supabase, rawPromo);
      if (!promo) {
        return Response.json({ error: "Invalid promo code" }, { status: 404 });
      }

      const rejection = promoCodeRejection(promo);
      if (rejection) {
        return Response.json({ error: rejection }, { status: 400 });
      }

      promoClaimed = await consumePromoCode(supabase, promo);
      if (!promoClaimed) {
        return Response.json(
          { error: "Promo code has reached its usage limit" },
          { status: 409 },
        );
      }
    }

    const basePrice = tier.priceXlm;
    const percentOff = promo ? Number(promo.percent_off) : 0;
    const { discountAmount, finalPrice } = applyPromoDiscount(basePrice, percentOff);

    const releaseClaim = async () => {
      if (!promoClaimed || !promo) return;
      try {
        await releasePromoCode(supabase, promo);
      } catch (releaseError) {
        console.error("Failed to release promo code use:", releaseError);
      }
    };

    if (finalPrice > 0 && (typeof tx_hash !== "string" || !/^[a-f0-9]{64}$/i.test(tx_hash))) {
      await releaseClaim();
      return Response.json(
        { error: "A valid Stellar transaction hash is required" },
        { status: 400 },
      );
    }

    let payment: Awaited<ReturnType<typeof verifyStellarPayment>> | null = null;
    if (finalPrice > 0) {
      try {
        payment = await verifyStellarPayment(tx_hash as string, finalPrice);
      } catch (paymentError) {
        await releaseClaim();
        throw paymentError;
      }
    }

    // Activate the featured spotlight for the project. When the current
    // spotlight is still active, the purchased days stack onto the current
    // expiry instead of restarting from now (issue #453).
    const now = new Date();
    const currentExpiry = project.featured_expires_at
      ? new Date(String(project.featured_expires_at))
      : null;
    const extended = Boolean(currentExpiry && currentExpiry.getTime() > now.getTime());
    const base = extended && currentExpiry ? currentExpiry : now;
    const expiresAt = new Date(base.getTime() + days * 86400 * 1000).toISOString();

    if (payment) {
      try {
        await recordPayment(
          {
            tx_hash: payment.txHash,
            product: "spotlight",
            user_id: auth.userId,
            project_id: Number(project_id),
            amount: payment.amountXlm,
            duration_days: days,
            source_address: payment.sourceAddress,
            destination_address: payment.destinationAddress,
            network: payment.network,
            created_at: now.toISOString(),
          },
          { projectName: typeof project.name === "string" ? project.name : undefined },
        );
      } catch (paymentError) {
        await releaseClaim();
        if ((paymentError as { code?: string })?.code === "23505") {
          return Response.json({ error: "This transaction has already been redeemed" }, { status: 409 });
        }
        throw paymentError;
      }
    }

    const { error: updateError } = await supabase
      .from("projects")
      .update({
        featured: 1,
        status: "featured",
        featured_tx_hash: payment?.txHash ?? null,
        featured_amount: finalPrice,
        featured_expires_at: expiresAt,
        promo_code: promo?.code ?? null,
        updated_at: now.toISOString(),
      })
      .eq("numericId", Number(project_id));

    if (updateError) {
      if (payment) {
        const { error: cleanupError } = await supabase
          .from("payments")
          .delete()
          .eq("tx_hash", payment.txHash);
        if (cleanupError) {
          console.error("Failed to release unactivated spotlight payment:", cleanupError);
        }
      }
      await releaseClaim();
      throw updateError;
    }

    return Response.json({
      success: true,
      project_id: Number(project_id),
      featured: 1,
      featured_tx_hash: payment?.txHash ?? null,
      price_xlm: finalPrice,
      base_price: basePrice,
      discount_xlm: discountAmount,
      promo_code: promo?.code ?? null,
      days,
      expires_at: expiresAt,
      extended,
    });
  } catch (err) {
    console.error("Activate featured project error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
