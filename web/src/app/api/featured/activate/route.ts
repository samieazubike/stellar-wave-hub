import { getAuthUser, hasMinRole } from "@/lib/auth";
import { getSupabase } from "@/lib/firebase";
import { verifyStellarPayment } from "@/lib/payments";
import {
  getFeaturedPaymentAddress,
  getFeaturedTiers,
} from "@/lib/featured-pricing";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = getAuthUser(request);
  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const promoCode = url.searchParams.get("promo_code");

    if (!promoCode || !promoCode.trim()) {
      return Response.json({ error: "Promo code is required" }, { status: 400 });
    }

    const code = promoCode.trim().toUpperCase();
    const supabase = getSupabase();

    const { data: promo, error } = await supabase
      .from("promo_codes")
      .select("*")
      .ilike("code", code)
      .maybeSingle();

    if (error) throw error;

    if (!promo) {
      return Response.json({ error: "Invalid promo code" }, { status: 404 });
    }

    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      return Response.json({ error: "Promo code has expired" }, { status: 400 });
    }

    if (
      promo.max_uses !== null &&
      promo.max_uses !== undefined &&
      (promo.uses ?? 0) >= promo.max_uses
    ) {
      return Response.json(
        { error: "Promo code has reached its usage limit" },
        { status: 400 }
      );
    }

    const basePrice = Number(url.searchParams.get("base_price")) || 100;
    const percentOff = Number(promo.percent_off);
    const discountAmount = (basePrice * percentOff) / 100;
    const finalPrice = Math.max(0, basePrice - discountAmount);

    return Response.json({
      valid: true,
      code: promo.code,
      percent_off: percentOff,
      base_price: basePrice,
      final_price: finalPrice,
    });
  } catch (err) {
    console.error("Validate promo code error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = getAuthUser(request);
  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const projectId = Number(body.project_id);
    const days = Number(body.days);
    const txHash =
      typeof body.tx_hash === "string" ? body.tx_hash.trim().toLowerCase() : "";
    if (!Number.isSafeInteger(projectId) || projectId <= 0) {
      return Response.json({ error: "A valid project ID is required" }, { status: 400 });
    }
    if (!Number.isSafeInteger(days) || days <= 0) {
      return Response.json({ error: "A valid spotlight duration is required" }, { status: 400 });
    }
    if (!txHash) {
      return Response.json({ error: "A Stellar transaction hash is required" }, { status: 400 });
    }

    const tiers = getFeaturedTiers();
    const tier = tiers.find((candidate) => candidate.days === days);
    if (!tier) {
      return Response.json({ error: "Unsupported spotlight duration" }, { status: 400 });
    }
    const paymentAddress = getFeaturedPaymentAddress();
    if (!paymentAddress) {
      return Response.json({ error: "Spotlight payments are not configured" }, { status: 503 });
    }

    const supabase = getSupabase();

    const { data: project, error: projError } = await supabase
      .from("projects")
      .select("*")
      .eq("numericId", projectId)
      .maybeSingle();

    if (projError) throw projError;
    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.user_id !== auth.userId && !hasMinRole(auth.role, "admin")) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    if (project.status !== "approved" && project.status !== "featured") {
      return Response.json(
        { error: "Only approved projects can be spotlighted" },
        { status: 409 },
      );
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("stellar_address")
      .eq("numericId", auth.userId)
      .maybeSingle();
    if (userError) throw userError;
    if (!user?.stellar_address) {
      return Response.json(
        { error: "Link a Stellar wallet to your profile before purchasing a spotlight" },
        { status: 409 },
      );
    }

    const verified = await verifyStellarPayment({
      transactionHash: txHash,
      fromAddress: user.stellar_address,
      toAddress: paymentAddress,
      amountXlm: tier.priceXlm,
    });
    if (!verified) {
      return Response.json(
        { error: "The transaction does not contain the required spotlight payment" },
        { status: 400 },
      );
    }

    const payment = {
      product: "spotlight",
      user_id: auth.userId,
      project_id: projectId,
      tx_hash: txHash,
      amount_xlm: tier.priceXlm,
      duration_days: tier.days,
    };
    const { error: paymentError } = await supabase.from("payments").insert(payment);
    if (paymentError?.code === "23505") {
      const { data: existingPayment, error: lookupError } = await supabase
        .from("payments")
        .select("product, user_id, project_id, amount_xlm, duration_days")
        .eq("tx_hash", txHash)
        .maybeSingle();
      if (lookupError) throw lookupError;
      if (
        existingPayment?.product !== payment.product ||
        Number(existingPayment.user_id) !== auth.userId ||
        Number(existingPayment.project_id) !== projectId ||
        Number(existingPayment.amount_xlm) !== tier.priceXlm ||
        Number(existingPayment.duration_days) !== tier.days ||
        project.featured_tx_hash !== txHash ||
        !project.featured_expires_at
      ) {
        return Response.json(
          { error: "This Stellar payment has already been redeemed" },
          { status: 409 },
        );
      }

      return Response.json({
        success: true,
        project_id: projectId,
        featured: 1,
        featured_tx_hash: txHash,
        days: tier.days,
        price_xlm: tier.priceXlm,
        expires_at: project.featured_expires_at,
      });
    }
    if (paymentError) throw paymentError;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + tier.days * 86400 * 1000).toISOString();

    const { error: updateError } = await supabase
      .from("projects")
      .update({
        featured: 1,
        status: "featured",
        featured_tx_hash: txHash,
        featured_amount: tier.priceXlm,
        featured_expires_at: expiresAt,
        promo_code: null,
        updated_at: now.toISOString(),
      })
      .eq("numericId", projectId);

    if (updateError) throw updateError;

    return Response.json({
      success: true,
      project_id: projectId,
      featured: 1,
      featured_tx_hash: txHash,
      days: tier.days,
      price_xlm: tier.priceXlm,
      expires_at: expiresAt,
    });
  } catch (err) {
    console.error("Activate featured project error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
