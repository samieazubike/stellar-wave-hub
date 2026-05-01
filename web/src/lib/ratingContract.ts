"use client";

/**
 * Client-side helper for calling the WaveHubRegistry Soroban contract's
 * `rate_project` entrypoint. Charges the user the on-chain rating fee
 * (0.1 USDC by default) via Freighter wallet signing.
 *
 * When `NEXT_PUBLIC_CONTRACT_ID` is not set the integration is skipped
 * (off-chain rating still works) so the app runs before the contract is
 * deployed.
 */

import {
  Contract,
  Networks,
  TransactionBuilder,
  BASE_FEE,
  nativeToScVal,
  rpc as StellarRpc,
} from "@stellar/stellar-sdk";

const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID;
const NETWORK = process.env.NEXT_PUBLIC_CONTRACT_NETWORK || "testnet";

const networkPassphrase =
  NETWORK === "mainnet" ? Networks.PUBLIC : Networks.TESTNET;

const rpcUrl =
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ||
  (NETWORK === "mainnet"
    ? "https://mainnet.sorobanrpc.com"
    : "https://soroban-testnet.stellar.org");

export const ON_CHAIN_ENABLED = Boolean(CONTRACT_ID);

export function explorerTxUrl(hash: string): string {
  const base =
    NETWORK === "mainnet"
      ? "https://stellar.expert/explorer/public"
      : "https://stellar.expert/explorer/testnet";
  return `${base}/tx/${hash}`;
}

/**
 * Submit an on-chain rating via the contract. Returns the transaction hash
 * on success. Throws if the user rejects the signing prompt or the
 * transaction fails. A no-op (returns `null`) when the contract is not
 * configured.
 *
 * * `userAddress` — Stellar G... address of the rater; must match the one
 *   signed in with the wallet.
 * * `projectSlug` — Soroban `Symbol`-safe id. Max 32 chars, `[a-zA-Z0-9_]`.
 * * `score` — 1-5 inclusive.
 */
export async function rateProjectOnChain(
  userAddress: string,
  projectSlug: string,
  score: number,
): Promise<string | null> {
  if (!ON_CHAIN_ENABLED || !CONTRACT_ID) return null;

  if (!/^[a-zA-Z0-9_]{1,32}$/.test(projectSlug)) {
    throw new Error(
      "Project slug must be 1-32 characters, letters/digits/underscores only",
    );
  }

  const { isConnected, requestAccess, signTransaction } = await import(
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

  const server = new StellarRpc.Server(rpcUrl);
  const contract = new Contract(CONTRACT_ID);

  const account = await server.getAccount(userAddress);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      contract.call(
        "rate_project",
        nativeToScVal(userAddress, { type: "address" }),
        nativeToScVal(projectSlug, { type: "symbol" }),
        nativeToScVal(score, { type: "u32" }),
      ),
    )
    .setTimeout(60)
    .build();

  const prepared = await server.prepareTransaction(tx);

  const signed = await signTransaction(prepared.toXDR(), {
    networkPassphrase,
    address: userAddress,
  });
  if (signed.error || !signed.signedTxXdr) {
    throw new Error("Wallet signing failed");
  }

  const signedTx = TransactionBuilder.fromXDR(
    signed.signedTxXdr,
    networkPassphrase,
  );
  const sent = await server.sendTransaction(signedTx);

  if (sent.status === "ERROR") {
    throw new Error(`Transaction rejected: ${JSON.stringify(sent.errorResult)}`);
  }

  // Poll for final status
  const hash = sent.hash;
  for (let i = 0; i < 30; i++) {
    const status = await server.getTransaction(hash);
    if (status.status === "SUCCESS") return hash;
    if (status.status === "FAILED") {
      throw new Error("On-chain rating failed");
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("Transaction timed out — check the explorer for status");
}
