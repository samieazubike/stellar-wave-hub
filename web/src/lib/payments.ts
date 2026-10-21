import { Horizon } from "@stellar/stellar-sdk";
import { getStellarNetwork, type StellarNetwork } from "./featured-pricing";

const HORIZON_URL: Record<StellarNetwork, string> = {
  mainnet: "https://horizon.stellar.org",
  testnet: "https://horizon-testnet.stellar.org",
};

function toStroops(amount: string): string | null {
  const match = /^(\d+)(?:\.(\d{1,7}))?$/.exec(amount);
  if (!match) return null;
  const whole = match[1].replace(/^0+(?=\d)/, "");
  const fraction = (match[2] ?? "").padEnd(7, "0");
  return `${whole}.${fraction}`;
}

export async function verifyStellarPayment({
  transactionHash,
  fromAddress,
  toAddress,
  amountXlm,
}: {
  transactionHash: string;
  fromAddress: string;
  toAddress: string;
  amountXlm: number;
}): Promise<boolean> {
  if (!/^[a-f\d]{64}$/i.test(transactionHash)) return false;

  const network = getStellarNetwork();
  const horizonUrl = process.env.STELLAR_HORIZON_URL || HORIZON_URL[network];
  const server = new Horizon.Server(horizonUrl);
  const transaction = await server
    .transactions()
    .transaction(transactionHash)
    .call();

  if (
    !transaction.successful ||
    transaction.source_account !== fromAddress
  ) {
    return false;
  }

  const operations = await server
    .operations()
    .forTransaction(transactionHash)
    .call();
  const expectedAmount = toStroops(amountXlm.toFixed(7));
  if (expectedAmount === null) return false;

  return operations.records.some(
    (operation) =>
      operation.type === "payment" &&
      operation.asset_type === "native" &&
      operation.from === fromAddress &&
      operation.to === toAddress &&
      toStroops(operation.amount) === expectedAmount,
  );
}
