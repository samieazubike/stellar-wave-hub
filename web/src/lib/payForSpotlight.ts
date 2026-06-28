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
    rpc: StellarRpc,
    TransactionBuilder,
  } = await import("@stellar/stellar-sdk");
  const NETWORK = process.env.NEXT_PUBLIC_CONTRACT_NETWORK || "testnet";
  const rpcUrl =
    process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ||
    (NETWORK === "mainnet"
      ? "https://mainnet.sorobanrpc.com"
      : "https://soroban-testnet.stellar.org");

  const server = new StellarRpc.Server(rpcUrl);
  const signedTx = TransactionBuilder.fromXDR(
    signed.signedTxXdr,
    NETWORK === "mainnet" ? "Public Global Stellar Network ; September 2015" : "Test SDF Network ; September 2015",
  );

  const sent = await server.sendTransaction(signedTx as any);
  if (sent.status === "ERROR") {
    throw new Error(`Transaction rejected: ${JSON.stringify(sent.errorResult)}`);
  }

  return sent.hash;
}

