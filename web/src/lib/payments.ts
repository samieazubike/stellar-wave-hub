export interface VerifyStellarPaymentOptions {
  expectedAmount?: number;
  expectedMemo?: string | RegExp | ((memo: string) => boolean);
  recipient?: string;
  horizonUrl?: string;
  network?: string;
}

export interface StellarPaymentDetails {
  txHash: string;
  successful: boolean;
  amount: number;
  asset: string;
  sender: string;
  recipient: string;
  memo?: string;
  memoType?: string;
  createdAt?: string;
}

/**
 * Verifies an on-chain Stellar payment transaction using the Horizon API.
 * Never trusts client-reported amounts; validates status, operations, amount, and memo directly on Horizon.
 */
export async function verifyStellarPayment(
  txHash: string,
  options: VerifyStellarPaymentOptions = {},
): Promise<StellarPaymentDetails> {
  const horizonUrl = (
    options.horizonUrl ||
    process.env.STELLAR_HORIZON_URL ||
    "https://horizon.stellar.org"
  ).replace(/\/$/, "");

  // 1. Fetch transaction metadata from Horizon
  const txRes = await fetch(`${horizonUrl}/transactions/${txHash}`, {
    cache: "no-store",
  });

  if (txRes.status === 404) {
    throw new Error(`Transaction ${txHash} not found on Stellar network`);
  }
  if (!txRes.ok) {
    throw new Error(`Failed to query Horizon for transaction ${txHash}: HTTP ${txRes.status}`);
  }

  const txData = await txRes.json();
  if (!txData.successful) {
    throw new Error(`Transaction ${txHash} failed on-chain`);
  }

  // 2. Validate memo if required
  const txMemo: string = txData.memo ?? "";
  if (options.expectedMemo !== undefined) {
    let memoValid = false;
    if (typeof options.expectedMemo === "function") {
      memoValid = options.expectedMemo(txMemo);
    } else if (options.expectedMemo instanceof RegExp) {
      memoValid = options.expectedMemo.test(txMemo);
    } else {
      memoValid = txMemo.trim().toLowerCase() === options.expectedMemo.trim().toLowerCase();
    }

    if (!memoValid) {
      throw new Error(`Transaction memo "${txMemo}" does not match required format`);
    }
  }

  // 3. Fetch operations for transaction to verify payment operation and amount
  const opsRes = await fetch(`${horizonUrl}/transactions/${txHash}/operations`, {
    cache: "no-store",
  });

  if (!opsRes.ok) {
    throw new Error(`Failed to query Horizon operations for transaction ${txHash}: HTTP ${opsRes.status}`);
  }

  const opsData = await opsRes.json();
  const records = opsData._embedded?.records ?? opsData.records ?? [];

  // Find native XLM payment or general payment operation
  const paymentOp = records.find(
    (op: any) =>
      op.type === "payment" && (op.asset_type === "native" || !op.asset_type),
  );

  if (!paymentOp) {
    throw new Error(`Transaction ${txHash} does not contain a native XLM payment operation`);
  }

  const paidAmount = Number(paymentOp.amount);
  if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
    throw new Error(`Invalid payment amount in transaction ${txHash}: ${paymentOp.amount}`);
  }

  if (options.expectedAmount !== undefined && paidAmount < options.expectedAmount) {
    throw new Error(
      `Insufficient payment amount: verified ${paidAmount} XLM, requires at least ${options.expectedAmount} XLM`,
    );
  }

  if (options.recipient && paymentOp.to !== options.recipient) {
    throw new Error(
      `Payment destination mismatch: sent to ${paymentOp.to}, expected ${options.recipient}`,
    );
  }

  return {
    txHash,
    successful: Boolean(txData.successful),
    amount: paidAmount,
    asset: paymentOp.asset_type === "native" ? "XLM" : (paymentOp.asset_code ?? "XLM"),
    sender: paymentOp.from ?? txData.source_account,
    recipient: paymentOp.to,
    memo: txMemo,
    memoType: txData.memo_type,
    createdAt: txData.created_at,
  };
}
