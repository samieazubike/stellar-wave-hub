"use client";

import { isConnected, requestAccess, getAddress, signTransaction } from "@stellar/freighter-api";
import {
  Asset,
  BASE_FEE,
  Horizon,
  Memo,
  Networks,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";

export interface PayWithFreighterParams {
  amount: number | string;
  recipient: string;
  memo?: string;
  network?: "PUBLIC" | "TESTNET";
}

export interface PayWithFreighterResult {
  txHash: string;
  signedXdr?: string;
}

/**
 * Builds and submits an XLM payment transaction signed via Freighter browser extension.
 */
export async function payWithFreighter(
  params: PayWithFreighterParams,
): Promise<PayWithFreighterResult> {
  const connected = await isConnected();
  if (!connected) {
    throw new Error("Freighter wallet is not connected or installed.");
  }

  const access = await requestAccess();
  if (!access) {
    throw new Error("Access to Freighter wallet was rejected.");
  }

  const addrObj = await getAddress();
  const userAddress = typeof addrObj === "string" ? addrObj : addrObj?.address;
  if (!userAddress) {
    throw new Error("Could not retrieve active wallet address from Freighter.");
  }

  const isPublic =
    params.network === "PUBLIC" ||
    process.env.NEXT_PUBLIC_CONTRACT_NETWORK === "public";
  const networkPassphrase = isPublic ? Networks.PUBLIC : Networks.TESTNET;
  const horizonUrl = (
    process.env.STELLAR_HORIZON_URL ||
    (isPublic
      ? "https://horizon.stellar.org"
      : "https://horizon-testnet.stellar.org")
  ).replace(/\/$/, "");

  const server = new Horizon.Server(horizonUrl);
  const sourceAccount = await server.loadAccount(userAddress);

  let builder = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      Operation.payment({
        destination: params.recipient,
        asset: Asset.native(),
        amount: String(params.amount),
      }),
    )
    .setTimeout(180);

  if (params.memo) {
    builder = builder.addMemo(Memo.text(params.memo.slice(0, 28)));
  }

  const transaction = builder.build();
  const signedResult = await signTransaction(transaction.toXDR(), {
    networkPassphrase,
  });

  const signedXdr =
    typeof signedResult === "string"
      ? signedResult
      : (signedResult as any)?.signedTxXdr;

  if (!signedXdr) {
    throw new Error(
      (signedResult as any)?.error || "Transaction signing failed",
    );
  }

  const txToSubmit = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);
  const result = await server.submitTransaction(txToSubmit);

  return {
    txHash: result.hash,
    signedXdr,
  };
}
