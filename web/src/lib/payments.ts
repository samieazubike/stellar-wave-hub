import { Horizon } from "@stellar/stellar-sdk";
import { xlmToStroops } from "@/lib/featured-pricing";
import { getSupabase } from "@/lib/firebase";
import { notifyPurchase } from "@/lib/notify";

export interface VerifiedStellarPayment {
  txHash: string;
  amountXlm: string;
  sourceAddress: string;
  destinationAddress: string;
  network: "mainnet" | "testnet";
}

export interface PaymentRecordInput {
  tx_hash: string;
  product: string;
  user_id: number;
  project_id: number;
  amount: string | number;
  duration_days?: number;
  source_address: string;
  destination_address: string;
  network: "mainnet" | "testnet";
  created_at?: string;
}

export async function verifyStellarPayment(
  txHash: string,
  expectedAmountXlm: number,
): Promise<VerifiedStellarPayment> {
  if (!/^[a-f0-9]{64}$/i.test(txHash)) {
    throw new Error("Invalid Stellar transaction hash");
  }

  const destinationAddress = process.env.STELLAR_PAYMENT_ADDRESS;
  if (!destinationAddress) {
    throw new Error("STELLAR_PAYMENT_ADDRESS is not configured");
  }

  const network =
    process.env.NEXT_PUBLIC_CONTRACT_NETWORK === "mainnet" ? "mainnet" : "testnet";
  const server = new Horizon.Server(
    process.env.STELLAR_HORIZON_URL ||
      (network === "mainnet"
        ? "https://horizon.stellar.org"
        : "https://horizon-testnet.stellar.org"),
  );

  const transaction = await server.transactions().transaction(txHash).call();
  if (!transaction.successful) {
    throw new Error("Stellar transaction was not successful");
  }

  const operations = await server
    .operations()
    .forTransaction(txHash)
    .limit(200)
    .call();
  const expectedStroops = xlmToStroops(expectedAmountXlm);
  const payment = operations.records.find(
    (operation) =>
      operation.type === "payment" &&
      operation.transaction_successful &&
      operation.asset_type === "native" &&
      operation.to === destinationAddress &&
      xlmToStroops(operation.amount) === expectedStroops,
  );

  if (!payment || payment.type !== "payment") {
    throw new Error("Stellar transaction does not contain the required XLM payment");
  }

  return {
    txHash,
    amountXlm: payment.amount,
    sourceAddress: payment.from,
    destinationAddress,
    network,
  };
}

export async function recordPayment(
  payment: PaymentRecordInput,
  options?: { projectName?: string | null },
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("payments").insert({
    tx_hash: payment.tx_hash,
    product: payment.product,
    user_id: payment.user_id,
    project_id: payment.project_id,
    amount: payment.amount,
    duration_days: payment.duration_days,
    source_address: payment.source_address,
    destination_address: payment.destination_address,
    network: payment.network,
    created_at: payment.created_at ?? new Date().toISOString(),
  });

  if (error) {
    throw error;
  }

  void notifyPurchase({
    product: payment.product,
    amount: payment.amount,
    project_id: payment.project_id,
    project_name: options?.projectName,
    network: payment.network,
    tx_hash: payment.tx_hash,
  }).catch((err) => {
    console.error("Unhandled purchase notification error:", err);
  });
}
