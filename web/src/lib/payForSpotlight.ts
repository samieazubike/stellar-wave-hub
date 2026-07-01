/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { buildSpotlightPaymentTx } from "@/lib/featuredService";

export async function payForSpotlight(projectId: number): Promise<string> {
  const { isConnected, requestAccess, getAddress, signTransaction } = await import(
    "@stellar/freighter-api"
  );

  const conn = await isConnected();
  if (conn.error || !conn.isConnected) {
    throw new Error("Freighter wallet not found. Install the extension.");
  }

  const access = await requestAccess();
  if (access.error) {
    throw new Error(access.error.message || "Wallet access denied");
  }

  const addr = await getAddress();
  if (addr.error || !addr.address) throw new Error("Could not retrieve wallet address");

  const sourceAccountPublicKey = addr.address;

  const tx = await buildSpotlightPaymentTx({ sourceAccountPublicKey, projectId });

  // Freighter expects the XDR
  const preparedXdr = tx.toXDR();
  const signed = await signTransaction(preparedXdr, {
    address: sourceAccountPublicKey,
  } as any);


  if (signed.error || !signed.signedTxXdr) {
    throw new Error("Wallet signing failed");
  }

  const {
    Horizon,
    TransactionBuilder,
  } = await import("@stellar/stellar-sdk");
  const NETWORK = process.env.NEXT_PUBLIC_CONTRACT_NETWORK || "testnet";
  const HORIZON_URL =
    process.env.NEXT_PUBLIC_HORIZON_URL ||
    (NETWORK === "mainnet"
      ? "https://horizon.stellar.org"
      : "https://horizon-testnet.stellar.org");

  const horizon = new Horizon.Server(HORIZON_URL);
  const signedTx = TransactionBuilder.fromXDR(
    signed.signedTxXdr,
    NETWORK === "mainnet" ? "Public Global Stellar Network ; September 2015" : "Test SDF Network ; September 2015",
  );

  const sent = await horizon.submitTransaction(signedTx as any);
  if (!sent.successful) {
    throw new Error(`Transaction rejected: ${JSON.stringify(sent)}`);
  }

  return sent.hash;
}

