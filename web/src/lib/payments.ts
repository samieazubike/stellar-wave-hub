/**
 * Server-side Stellar payment verification via Horizon.
 *
 * Never trust amounts or destinations from the client. Always verify on-chain.
 */
import { Horizon } from "@stellar/stellar-sdk";

const HORIZON_URL =
  process.env.STELLAR_HORIZON_URL || "https://horizon.stellar.org";

const server = new Horizon.Server(HORIZON_URL);

export interface PaymentVerification {
  /** The transaction hash that was verified. */
  tx_hash: string;
  /** Actual XLM amount transferred (string, e.g. "10.0000000"). */
  amount: string;
  /** Sender's Stellar account ID. */
  from: string;
  /** Receiver's Stellar account ID. */
  to: string;
  /** Memo text attached to the transaction, if any. */
  memo: string | null;
}

export interface VerifyOptions {
  /** Expected destination account. The payment must go to this address. */
  destination: string;
  /** Minimum accepted amount in XLM. The on-chain amount must be ≥ this. */
  minAmountXlm: number;
  /**
   * Optional memo prefix check (e.g. "tip:"). When provided, the transaction
   * memo must start with this string (case-insensitive).
   */
  memoPrefix?: string;
}

/**
 * Verify that a Stellar payment transaction:
 *   1. Exists on-chain (fetched from Horizon).
 *   2. Is a native XLM payment (asset_type === "native").
 *   3. Went to `options.destination`.
 *   4. Transferred at least `options.minAmountXlm` XLM.
 *   5. (Optional) Has a memo starting with `options.memoPrefix`.
 *
 * Throws a descriptive error when any check fails so the caller can surface
 * a 400 / 422 response without exposing internal details.
 */
export async function verifyStellarPayment(
  txHash: string,
  options: VerifyOptions,
): Promise<PaymentVerification> {
  if (!txHash || !/^[0-9a-fA-F]{64}$/.test(txHash)) {
    throw new Error("Invalid transaction hash format.");
  }

  // Load the transaction from Horizon
  let tx: Awaited<ReturnType<typeof server.transactions>>;
  let txRecord: Horizon.ServerApi.TransactionRecord;
  try {
    txRecord = await server.transactions().transaction(txHash).call();
  } catch {
    throw new Error("Transaction not found on the Stellar network.");
  }

  // Fetch the payments within this transaction
  // A single transaction may have multiple operations; we look for the
  // relevant native-XLM payment destined for our account.
  let paymentsPage: Horizon.ServerApi.CollectionPage<Horizon.ServerApi.OperationRecord>;
  try {
    paymentsPage = await server
      .payments()
      .forTransaction(txHash)
      .limit(20)
      .call();
  } catch {
    throw new Error("Could not fetch payment operations for this transaction.");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payments = paymentsPage.records as any[];

  // Find the native payment that goes to our destination
  const match = payments.find(
    (p) =>
      p.type === "payment" &&
      p.asset_type === "native" &&
      p.to === options.destination,
  );

  if (!match) {
    throw new Error(
      `No XLM payment to ${options.destination} found in transaction ${txHash}.`,
    );
  }

  const amountXlm = parseFloat(match.amount);
  if (isNaN(amountXlm) || amountXlm < options.minAmountXlm) {
    throw new Error(
      `Payment amount ${match.amount} XLM is less than the required minimum of ${options.minAmountXlm} XLM.`,
    );
  }

  const memoText = txRecord.memo ?? null;

  if (options.memoPrefix) {
    if (
      !memoText ||
      !memoText.toLowerCase().startsWith(options.memoPrefix.toLowerCase())
    ) {
      throw new Error(
        `Transaction memo must start with "${options.memoPrefix}".`,
      );
    }
  }

  return {
    tx_hash: txHash,
    amount: match.amount as string,
    from: match.from as string,
    to: match.to as string,
    memo: memoText,
  };
}
