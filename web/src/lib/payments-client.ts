"use client";

import {
  Asset,
  BASE_FEE,
  Horizon,
  Networks,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import type { StellarNetwork } from "./featured-pricing";

const HORIZON_URL: Record<StellarNetwork, string> = {
  mainnet: "https://horizon.stellar.org",
  testnet: "https://horizon-testnet.stellar.org",
};

const NETWORK_PASSPHRASE: Record<StellarNetwork, string> = {
  mainnet: Networks.PUBLIC,
  testnet: Networks.TESTNET,
};

export async function payWithFreighter({
  amountXlm,
  destination,
  network,
}: {
  amountXlm: number;
  destination: string;
  network: StellarNetwork;
}): Promise<string> {
  const { getAddress, isConnected, requestAccess, signTransaction } = await import(
    "@stellar/freighter-api"
  );
  const connected = await isConnected();
  if (connected.error || !connected.isConnected) {
    throw new Error("Freighter wallet not found. Install the extension.");
  }

  const access = await requestAccess();
  if (access.error) {
    throw new Error(access.error.message || "Wallet access denied");
  }

  const accountAddress = await getAddress();
  if (accountAddress.error || !accountAddress.address) {
    throw new Error("Could not retrieve the Freighter wallet address");
  }

  const amount = amountXlm.toFixed(7);
  const server = new Horizon.Server(HORIZON_URL[network]);
  const account = await server.loadAccount(accountAddress.address);
  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE[network],
  })
    .addOperation(
      Operation.payment({
        destination,
        asset: Asset.native(),
        amount,
      }),
    )
    .setTimeout(180)
    .build();

  const signed = await signTransaction(transaction.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE[network],
    address: accountAddress.address,
  });
  if (signed.error || !signed.signedTxXdr) {
    throw new Error(signed.error?.message || "Wallet signing failed");
  }

  const signedTransaction = TransactionBuilder.fromXDR(
    signed.signedTxXdr,
    NETWORK_PASSPHRASE[network],
  );
  const submitted = await server.submitTransaction(signedTransaction);
  return submitted.hash;
}
