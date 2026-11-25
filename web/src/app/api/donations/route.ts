import { getSupabase } from "@/lib/firebase";
import { verifyStellarPayment } from "@/lib/payments";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  const record = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const txHash = record.tx_hash;
  const message = record.message ?? "";
  if (typeof txHash !== "string" || !/^[a-f0-9]{64}$/i.test(txHash)) {
    return Response.json({ error: "A valid Stellar transaction hash is required" }, { status: 400 });
  }
  if (typeof message !== "string" || message.trim().length > 500) {
    return Response.json({ error: "Message must be 500 characters or fewer" }, { status: 400 });
  }
  const destination = process.env.NEXT_PUBLIC_DONATION_DESTINATION;
  if (!destination) {
    return Response.json({ error: "Donations are not configured" }, { status: 503 });
  }
  let payment;
  try {
    // The amount comes exclusively from the successful Horizon payment operation.
    payment = await verifyStellarPayment(txHash, undefined, destination);
  } catch (error) {
    console.error("Verify donation error:", error);
    return Response.json({ error: "Stellar payment could not be verified" }, { status: 400 });
  }
  try {
    const { error } = await getSupabase().from("payments").insert({
      tx_hash: payment.txHash,
      product: "donation",
      user_id: null,
      project_id: null,
      amount: payment.amountXlm,
      duration_days: null,
      message: message.trim() || null,
      source_address: payment.sourceAddress,
      destination_address: payment.destinationAddress,
      network: payment.network,
      created_at: new Date().toISOString(),
    });
    if (error?.code === "23505") {
      return Response.json({ error: "This transaction has already been redeemed" }, { status: 409 });
    }
    if (error) throw error;
    return Response.json({ success: true, tx_hash: payment.txHash, amount_xlm: payment.amountXlm }, { status: 201 });
  } catch (error) {
    console.error("Record donation error:", error);
    return Response.json({ error: "Could not verify or record the Stellar donation" }, { status: 500 });
  }
}
