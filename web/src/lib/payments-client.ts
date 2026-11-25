"use client";

import {
  Asset,
  BASE_FEE,
  Horizon,
  Memo,
  Networks,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { formatXlmAmount } from "@/lib/featured-pricing";

interface PayWithFreighterOptions {
  amountXlm: number;
  destination: string;
  network: "mainnet" | "testnet";
  horizonUrl: string;
  memo: string;
}

export async function payWithFreighter({
  amountXlm,
  destination,
  network,
  horizonUrl,
  memo,
}: PayWithFreighterOptions): Promise<string> {
  const { getNetwork, isConnected, requestAccess, signTransaction } = await import(
    "@stellar/freighter-api"
  );

  const connection = await isConnected();
  if (connection.error || !connection.isConnected) {
    throw new Error("Freighter wallet not found. Please install the extension.");
  }

  const access = await requestAccess();
  if (access.error || !access.address) {
    throw new Error(access.error?.message || "Wallet access denied.");
  }

  const networkDetails = await getNetwork();
  if (networkDetails.error) {
    throw new Error(networkDetails.error.message || "Could not read Freighter network.");
  }
  const networkPassphrase = network === "mainnet" ? Networks.PUBLIC : Networks.TESTNET;
  if (networkDetails.networkPassphrase !== networkPassphrase) {
    throw new Error(`Switch Freighter to the Stellar ${network} network before paying.`);
  }

  const server = new Horizon.Server(horizonUrl);
  const account = await server.loadAccount(access.address);
  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      Operation.payment({
        destination,
        asset: Asset.native(),
        amount: formatXlmAmount(amountXlm),
      }),
    )
    .addMemo(Memo.text(memo))
    .setTimeout(180)
    .build();

  const signed = await signTransaction(transaction.toXDR(), {
    networkPassphrase,
    address: access.address,
  });
  if (signed.error || !signed.signedTxXdr) {
    throw new Error(signed.error?.message || "Wallet signing was cancelled or failed.");
  }
  if (signed.signerAddress !== access.address) {
    throw new Error("Freighter signed the payment with a different account.");
  }

  const signedTransaction = TransactionBuilder.fromXDR(
    signed.signedTxXdr,
    networkPassphrase,
  );
  const result = await server.submitTransaction(signedTransaction);
  if (!result.successful) {
    throw new Error("Stellar network did not confirm the payment.");
  }
  return result.hash;
}