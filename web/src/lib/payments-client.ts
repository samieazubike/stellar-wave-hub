"use client";

/**
 * Client-side Stellar payment helper.
 *
 * Builds a native XLM payment transaction, requests signature from Freighter,
 * then submits it to Horizon. Returns the confirmed transaction hash.
 */
import {
  TransactionBuilder,
  Networks,
  BASE_FEE,
  Asset,
  Operation,
  Memo,
  Horizon,
} from "@stellar/stellar-sdk";

const HORIZON_URL =
  process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL ||
  process.env.NEXT_PUBLIC_HORIZON_URL ||
  "https://horizon.stellar.org";

const NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK || "public";

const networkPassphrase =
  NETWORK === "testnet" ? Networks.TESTNET : Networks.PUBLIC;

function getHorizonServer() {
  return new Horizon.Server(HORIZON_URL);
}

export interface PayWithFreighterOptions {
  /** Sender's Stellar public key. Obtained from Freighter `getPublicKey()`. */
  fromAddress: string;
  /** Recipient's Stellar public key. */
  toAddress: string;
  /** Amount in XLM (e.g. 10 for 10 XLM). */
  amountXlm: number;
  /**
   * Optional text memo to include (max 28 bytes). E.g. "tip:my-project".
   * Automatically truncated to 28 bytes to avoid Horizon rejections.
   */
  memo?: string;
}

/**
 * Pay XLM from `fromAddress` to `toAddress` using the Freighter browser
 * extension. Builds the transaction, signs it via Freighter, submits to
 * Horizon, and returns the transaction hash.
 *
 * Throws a human-readable error if:
 * - Freighter is not installed / access denied.
 * - The transaction fails on-chain.
 */
export async function payWithFreighter(
  options: PayWithFreighterOptions,
): Promise<string> {
  const { fromAddress, toAddress, amountXlm, memo } = options;

  if (amountXlm <= 0) throw new Error("Amount must be greater than 0.");

  // Lazy-load Freighter to avoid SSR errors
  const { isConnected, requestAccess, signTransaction } = await import(
    "@stellar/freighter-api"
  );

  const conn = await isConnected();
  if (conn.error || !conn.isConnected) {
    throw new Error(
      "Freighter wallet not found. Install the Freighter browser extension.",
    );
  }

  const access = await requestAccess();
  if (access.error) {
    throw new Error(access.error.message || "Wallet access denied.");
  }

  const server = getHorizonServer();

  // Load source account to get the current sequence number
  let account: Horizon.AccountResponse;
  try {
    account = await server.loadAccount(fromAddress);
  } catch {
    throw new Error(
      "Could not load Stellar account. Make sure the account is funded.",
    );
  }

  // Truncate memo to 28 bytes (Stellar limit for text memos)
  const memoText = memo
    ? memo.slice(0, 28)
    : undefined;

  const txBuilder = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      Operation.payment({
        destination: toAddress,
        asset: Asset.native(),
        amount: amountXlm.toFixed(7),
      }),
    )
    .setTimeout(180); // 3 min window

  if (memoText) {
    txBuilder.addMemo(Memo.text(memoText));
  }

  const tx = txBuilder.build();

  // Sign via Freighter
  const signed = await signTransaction(tx.toXDR(), {
    networkPassphrase,
    address: fromAddress,
  });

  if (signed.error || !signed.signedTxXdr) {
    throw new Error(
      signed.error?.message || "Freighter signing was cancelled or failed.",
    );
  }

  // Submit to Horizon
  const signedTx = TransactionBuilder.fromXDR(signed.signedTxXdr, networkPassphrase);

  let result: Horizon.HorizonApi.TransactionResponse;
  try {
    result = await server.submitTransaction(signedTx);
  } catch (err: unknown) {
    // Horizon returns detailed error information
    const horizonErr = err as { response?: { data?: { extras?: { result_codes?: unknown } } } };
    const codes = horizonErr?.response?.data?.extras?.result_codes;
    if (codes) {
      throw new Error(`Transaction failed: ${JSON.stringify(codes)}`);
    }
    throw new Error("Transaction submission failed. Please try again.");
  }

  if (!result.successful) {
    throw new Error("Transaction was not successful. Please try again.");
  }

  return result.hash;
}
