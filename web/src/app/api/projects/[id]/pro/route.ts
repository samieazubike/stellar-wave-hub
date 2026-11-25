import { getAuthUser } from "@/lib/auth";
import { getSupabase } from "@/lib/firebase";
import { verifyStellarPayment } from "@/lib/payments";
import { getProPriceXlm } from "@/lib/pro";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const network =
      process.env.NEXT_PUBLIC_CONTRACT_NETWORK === "mainnet" ? "mainnet" : "testnet";
    return Response.json({
      priceXlm: getProPriceXlm(),
      destination: process.env.STELLAR_PAYMENT_ADDRESS || null,
      network,
      horizonUrl:
        process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL ||
        (network === "mainnet"
          ? "https://horizon.stellar.org"
          : "https://horizon-testnet.stellar.org"),
    });
  } catch (error) {
    console.error("Project Pro config error:", error);
    return Response.json(
      { error: "Pro pricing is not configured correctly" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = getAuthUser(request);
  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const projectId = Number(id);
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(projectId) || projectId <= 0) {
    return Response.json({ error: "Invalid project ID" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const txHash =
    body && typeof body === "object"
      ? (body as Record<string, unknown>).tx_hash
      : undefined;
  if (typeof txHash !== "string" || !/^[a-f0-9]{64}$/i.test(txHash)) {
    return Response.json(
      { error: "A valid Stellar transaction hash is required" },
      { status: 400 },
    );
  }

  try {
    const supabase = getSupabase();
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select('"numericId",user_id')
      .eq("numericId", projectId)
      .maybeSingle();

    if (projectError) throw projectError;
    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }
    if (Number(project.user_id) !== auth.userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const priceXlm = getProPriceXlm();
    const payment = await verifyStellarPayment(
      txHash,
      priceXlm,
      `pro:${projectId}`,
    );
    const { data: proUntil, error: redemptionError } = await supabase.rpc(
      "redeem_pro_payment",
      {
        p_tx_hash: payment.txHash,
        p_user_id: auth.userId,
        p_project_id: projectId,
        p_amount: payment.amountXlm,
        p_source_address: payment.sourceAddress,
        p_destination_address: payment.destinationAddress,
        p_network: payment.network,
      },
    );

    if (redemptionError?.code === "23505") {
      return Response.json(
        { error: "This transaction has already been redeemed" },
        { status: 409 },
      );
    }
    if (redemptionError) throw redemptionError;

    return Response.json({
      success: true,
      project_id: projectId,
      pro_until: proUntil,
      pro_tx_hash: payment.txHash,
      price_xlm: priceXlm,
    });
  } catch (error) {
    console.error("Activate project Pro error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
