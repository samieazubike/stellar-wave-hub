import { getAuthUser } from "@/lib/auth";
import { getSupabase } from "@/lib/firebase";
import { parseJsonBody } from "@/lib/validation/parse-body";
import { createTipSchema } from "@/lib/validation/schemas/tips";
import { verifyStellarPayment } from "@/lib/payments";

export const dynamic = "force-dynamic";

/**
 * POST /api/tips
 *
 * Body: { project_id: number, tx_hash: string }
 *
 * Flow:
 *   1. Authenticate the caller (JWT required).
 *   2. Validate the request body with Zod.
 *   3. Load the project from Supabase to get its stellar_account_id.
 *   4. Verify the Stellar payment on Horizon — amount and destination are
 *      always read from the chain, never trusted from the client.
 *   5. Guard against replay by checking the tx_hash uniqueness constraint.
 *   6. Record the payment in the `payments` table (product = 'tip').
 */
export async function POST(request: Request) {
  // ── 1. Auth ────────────────────────────────────────────────────────────────
  const auth = getAuthUser(request);
  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── 2. Validate body ───────────────────────────────────────────────────────
  const parsed = await parseJsonBody(request, createTipSchema);
  if (!parsed.success) return parsed.response;

  const { project_id, tx_hash } = parsed.data;

  const supabase = getSupabase();

  try {
    // ── 3. Load project ──────────────────────────────────────────────────────
    const { data: project, error: projError } = await supabase
      .from("projects")
      .select("numericId, name, slug, stellar_account_id, status")
      .eq("numericId", project_id)
      .maybeSingle();

    if (projError) throw projError;
    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    if (!project.stellar_account_id) {
      return Response.json(
        { error: "This project has no Stellar account linked and cannot receive tips." },
        { status: 422 },
      );
    }

    // ── 4. Verify on Horizon ─────────────────────────────────────────────────
    // Minimum tip: 1 XLM. We don't prescribe a fixed amount — anything ≥ 1 XLM
    // that arrives at the project's account with a "tip:" memo qualifies.
    let payment;
    try {
      payment = await verifyStellarPayment(tx_hash, {
        destination: project.stellar_account_id,
        minAmountXlm: 1,
        memoPrefix: "tip:",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Payment verification failed.";
      return Response.json({ error: msg }, { status: 422 });
    }

    // ── 5. Replay guard ──────────────────────────────────────────────────────
    const { data: existing } = await supabase
      .from("payments")
      .select("id")
      .eq("tx_hash", tx_hash)
      .maybeSingle();

    if (existing) {
      return Response.json(
        { error: "This transaction has already been recorded." },
        { status: 409 },
      );
    }

    // ── 6. Record the tip ────────────────────────────────────────────────────
    const { data: inserted, error: insertError } = await supabase
      .from("payments")
      .insert({
        from_address: payment.from,
        to_address: payment.to,
        amount_xlm: payment.amount,
        tx_hash: payment.tx_hash,
        memo: payment.memo,
        product: "tip",
        project_id,
        user_id: auth.userId,
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertError) {
      // Unique constraint violation means concurrent request already inserted it
      if (insertError.code === "23505") {
        return Response.json(
          { error: "This transaction has already been recorded." },
          { status: 409 },
        );
      }
      throw insertError;
    }

    return Response.json(
      {
        message: "Tip recorded successfully.",
        payment_id: inserted.id,
        amount_xlm: payment.amount,
        from: payment.from,
        to: payment.to,
        memo: payment.memo,
        tx_hash: payment.tx_hash,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("POST /api/tips error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
