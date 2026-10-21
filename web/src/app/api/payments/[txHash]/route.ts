import { getAuthUser, hasMinRole } from "@/lib/auth";
import { getSupabase } from "@/lib/firebase";

export const dynamic = "force-dynamic";

function stellarExpertUrl(txHash: string): string {
  const network = process.env.NEXT_PUBLIC_CONTRACT_NETWORK || "testnet";
  const explorer =
    network === "testnet"
      ? "https://stellar.expert/explorer/testnet"
      : "https://stellar.expert/explorer/public";
  return `${explorer}/tx/${txHash}`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ txHash: string }> },
) {
  const auth = getAuthUser(request);
  const { txHash } = await params;

  if (!auth) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const supabase = getSupabase();
    const { data: payment, error } = await supabase
      .from("payments")
      .select(
        "tx_hash, product, ref_id, payer_address, amount_xlm, user_id, created_at",
      )
      .eq("tx_hash", txHash)
      .maybeSingle();

    if (error) throw error;
    if (
      !payment ||
      (Number(payment.user_id) !== auth.userId &&
        !hasMinRole(auth.role, "admin"))
    ) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    let project: { name: string; slug: string } | null = null;
    const projectId = Number(payment.ref_id);
    if (Number.isSafeInteger(projectId) && projectId > 0) {
      const { data, error: projectError } = await supabase
        .from("projects")
        .select("name, slug")
        .eq("numericId", projectId)
        .maybeSingle();

      if (projectError) throw projectError;
      project = data;
    }

    return Response.json({
      receipt: {
        tx_hash: payment.tx_hash,
        product: payment.product,
        project,
        amount_xlm: payment.amount_xlm,
        created_at: payment.created_at,
        payer_address: payment.payer_address,
        stellar_expert_url: stellarExpertUrl(payment.tx_hash),
      },
    });
  } catch (err) {
    console.error("Payment receipt error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
