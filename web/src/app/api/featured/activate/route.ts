import { Horizon } from "@stellar/stellar-sdk";
import { getAuthUser } from "@/lib/auth";
import { projectsCol } from "@/lib/db";
import { getSupabase } from "@/lib/firebase";
export const dynamic = "force-dynamic";

const BASE_PRICE_XLM = parseFloat(process.env.SPOTLIGHT_BASE_PRICE_XLM ?? "10");
const DESTINATION = process.env.SPOTLIGHT_DESTINATION ?? "";
const HORIZON_URL = process.env.STELLAR_HORIZON_URL ?? "https://horizon.stellar.org";

interface PromoCode {
  code: string;
  percent_off: number;
  max_uses: number | null;
  uses: number;
  expires_at: string | null;
}

async function validatePromoCode(
  supabase: ReturnType<typeof getSupabase>,
  code: string,
): Promise<{ promo: PromoCode; error?: never } | { error: string; promo?: never }> {
  const { data, error } = await supabase
    .from("promo_codes")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (error) throw error;
  if (!data) return { error: "Promo code not found" };

  const promo = data as PromoCode;

  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    return { error: "Promo code has expired" };
  }
  if (promo.max_uses !== null && promo.uses >= promo.max_uses) {
    return { error: "Promo code has reached its usage limit" };
  }

  return { promo };
}

async function verifyPayment(txHash: string, requiredXlm: number): Promise<string | null> {
  if (!DESTINATION) {
    // No destination configured — skip on-chain verification (dev/test mode)
    return null;
  }

  const server = new Horizon.Server(HORIZON_URL);

  let tx: Horizon.ServerApi.TransactionRecord;
  try {
    tx = await server.transactions().transaction(txHash).call();
  } catch {
    return "Transaction not found on the Stellar network";
  }

  if (!tx.successful) {
    return "Transaction was not successful";
  }

  const ops = await server.operations().forTransaction(txHash).call();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payment = ops.records.find((op: any) => {
    return (
      op.type === "payment" &&
      op.to === DESTINATION &&
      (op.asset_type === "native" || op.asset_code === "XLM") &&
      parseFloat(op.amount) >= requiredXlm
    );
  });

  if (!payment) {
    return `Payment of at least ${requiredXlm} XLM to the spotlight address not found in this transaction`;
  }

  return null;
}

export async function POST(request: Request) {
  const auth = getAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: { project_id: number; tx_hash?: string; promo_code?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { project_id, tx_hash, promo_code } = body;
  if (!project_id) {
    return Response.json({ error: "project_id is required" }, { status: 400 });
  }

  const ref = projectsCol.ref.doc(String(project_id));
  const doc = await ref.get();
  if (!doc.exists) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  const project = doc.data()!;
  if (project.user_id !== auth.userId && auth.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  if (project.status === "featured") {
    return Response.json({ error: "Project is already featured" }, { status: 409 });
  }
  if (project.status !== "approved") {
    return Response.json(
      { error: "Only approved projects can be spotlighted" },
      { status: 422 },
    );
  }

  const supabase = getSupabase();
  let percentOff = 0;
  let promoRecord: PromoCode | undefined;

  if (promo_code) {
    const result = await validatePromoCode(supabase, promo_code.trim().toUpperCase());
    if (result.error) {
      return Response.json({ error: result.error }, { status: 422 });
    }
    promoRecord = result.promo;
    percentOff = promoRecord.percent_off;
  }

  const requiredXlm = parseFloat(
    (BASE_PRICE_XLM * (1 - percentOff / 100)).toFixed(7),
  );

  if (requiredXlm > 0) {
    if (!tx_hash) {
      return Response.json(
        {
          error: "tx_hash is required to confirm payment",
          required_xlm: requiredXlm,
        },
        { status: 400 },
      );
    }

    const paymentError = await verifyPayment(tx_hash, requiredXlm);
    if (paymentError) {
      return Response.json({ error: paymentError, required_xlm: requiredXlm }, { status: 422 });
    }
  }

  // All checks passed — activate spotlight and consume promo code atomically
  await ref.update({
    status: "featured",
    featured: 1,
    updated_at: new Date().toISOString(),
  });

  if (promoRecord) {
    await supabase
      .from("promo_codes")
      .update({ uses: promoRecord.uses + 1 })
      .eq("code", promoRecord.code);
  }

  return Response.json({
    success: true,
    required_xlm: requiredXlm,
    percent_off: percentOff,
  });
}

/** Returns the current spotlight price (optionally with a promo code preview). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("promo_code");

  let percentOff = 0;
  let codeValid: boolean | null = null;
  let codeError: string | null = null;

  if (code) {
    const supabase = getSupabase();
    const result = await validatePromoCode(supabase, code.trim().toUpperCase());
    if (result.error) {
      codeValid = false;
      codeError = result.error;
    } else {
      codeValid = true;
      percentOff = result.promo!.percent_off;
    }
  }

  const requiredXlm = parseFloat(
    (BASE_PRICE_XLM * (1 - percentOff / 100)).toFixed(7),
  );

  return Response.json({
    base_price_xlm: BASE_PRICE_XLM,
    required_xlm: requiredXlm,
    percent_off: percentOff,
    ...(code !== null && {
      promo_code: code,
      code_valid: codeValid,
      ...(codeError && { code_error: codeError }),
    }),
  });
}
