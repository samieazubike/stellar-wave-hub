import { Horizon } from "@stellar/stellar-sdk";
import { xlmToStroops } from "@/lib/featured-pricing";

export interface VerifiedStellarPayment {
  txHash: string;
  amountXlm: string;
  sourceAddress: string;
  destinationAddress: string;
  network: "mainnet" | "testnet";
}

export async function verifyStellarPayment(
  txHash: string,
  expectedAmountXlm?: number,
  expectedDestination?: string,
): Promise<VerifiedStellarPayment> {
  if (!/^[a-f0-9]{64}$/i.test(txHash)) {
    throw new Error("Invalid Stellar transaction hash");
  }
  const normalizedHash = txHash.toLowerCase();

  const destinationAddress = expectedDestination || process.env.STELLAR_PAYMENT_ADDRESS;
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

  const transaction = await server.transactions().transaction(normalizedHash).call();
  if (!transaction.successful) {
    throw new Error("Stellar transaction was not successful");
  }

  const operations = await server
    .operations()
    .forTransaction(normalizedHash)
    .limit(200)
    .call();
  const expectedStroops = expectedAmountXlm === undefined
    ? null
    : xlmToStroops(expectedAmountXlm);
  const payment = operations.records.find(
    (operation) =>
      operation.type === "payment" &&
      operation.transaction_successful &&
      operation.asset_type === "native" &&
      operation.to === destinationAddress &&
      xlmToStroops(operation.amount) > BigInt(0) &&
      (expectedStroops === null || xlmToStroops(operation.amount) === expectedStroops),
  );

  if (!payment || payment.type !== "payment") {
    throw new Error("Stellar transaction does not contain the required XLM payment");
  }

  return {
    txHash: normalizedHash,
    amountXlm: payment.amount,
    sourceAddress: payment.from,
    destinationAddress,
    network,
  };
}
