"use client";

import {
  Contract,
  Networks,
  TransactionBuilder,
  BASE_FEE,
  nativeToScVal,
  scValToNative,
  rpc as StellarRpc,
  Account,
  Keypair,
  xdr,
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

// ── Internal helpers ─────────────────────────────────────────────────────────

function getServer() {
  return new StellarRpc.Server(rpcUrl);
}

function getContract() {
  if (!CONTRACT_ID) throw new Error("Contract not configured");
  return new Contract(CONTRACT_ID);
}

// Simulate a read-only contract call using an ephemeral source account.
// No signing or on-chain submission needed.
async function simulateView(
  functionName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any[] = [],
): Promise<unknown> {
  if (!ON_CHAIN_ENABLED) return null;
  const server = getServer();
  const contract = getContract();

  const ephemeral = new Account(Keypair.random().publicKey(), "0");
  const tx = new TransactionBuilder(ephemeral, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(contract.call(functionName, ...args))
    .setTimeout(60)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (StellarRpc.Api.isSimulationError(sim)) {
    throw new Error(`Simulation error: ${sim.error}`);
  }
  if (!("result" in sim) || !sim.result) return null;
  return scValToNative(sim.result.retval);
}

// Build, sign via Freighter, submit, and poll an admin write transaction.
async function adminWrite(
  adminAddress: string,
  functionName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any[],
): Promise<string> {
  const { isConnected, requestAccess, signTransaction } = await import(
    "@stellar/freighter-api"
  );

  const conn = await isConnected();
  if (conn.error || !conn.isConnected)
    throw new Error("Freighter wallet not found. Install the extension.");

  const access = await requestAccess();
  if (access.error) throw new Error(access.error.message || "Wallet access denied");

  const server = getServer();
  const contract = getContract();
  const account = await server.getAccount(adminAddress);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(contract.call(functionName, ...args))
    .setTimeout(60)
    .build();

  const prepared = await server.prepareTransaction(tx);

  const signed = await signTransaction(prepared.toXDR(), {
    networkPassphrase,
    address: adminAddress,
  });
  if (signed.error || !signed.signedTxXdr) throw new Error("Wallet signing failed");

  const signedTx = TransactionBuilder.fromXDR(signed.signedTxXdr, networkPassphrase);
  const sent = await server.sendTransaction(signedTx);
  if (sent.status === "ERROR")
    throw new Error(`Transaction rejected: ${JSON.stringify(sent.errorResult)}`);

  const { hash } = sent;
  for (let i = 0; i < 30; i++) {
    const status = await server.getTransaction(hash);
    if (status.status === "SUCCESS") return hash;
    if (status.status === "FAILED") throw contractError(status);
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("Transaction timed out — check the explorer for status");
}

// ── Public reads ─────────────────────────────────────────────────────────────

export async function getRatingFee(): Promise<bigint | null> {
  if (!ON_CHAIN_ENABLED) return null;
  return (await simulateView("get_rating_fee")) as bigint | null;
}

export async function getRegistrationFee(): Promise<bigint | null> {
  if (!ON_CHAIN_ENABLED) return null;
  return (await simulateView("get_registration_fee")) as bigint | null;
}

export async function getContractVersion(): Promise<string | null> {
  if (!ON_CHAIN_ENABLED) return null;
  return (await simulateView("get_version")) as string | null;
}

export async function getWasmVersion(): Promise<number | null> {
  if (!ON_CHAIN_ENABLED) return null;
  return (await simulateView("get_wasm_version")) as number | null;
}

export async function getContractAdmin(): Promise<string | null> {
  if (!ON_CHAIN_ENABLED) return null;
  return (await simulateView("get_admin")) as string | null;
}

export async function getTreasuryBalance(): Promise<bigint | null> {
  if (!ON_CHAIN_ENABLED) return null;
  return (await simulateView("get_treasury_balance")) as bigint | null;
}

export async function getProjectsOnChain(): Promise<string[] | null> {
  if (!ON_CHAIN_ENABLED) return null;
  return (await simulateView("get_projects")) as string[] | null;
}

export async function isRegisteredOnChain(projectSlug: string): Promise<boolean> {
  if (!ON_CHAIN_ENABLED) return false;
  return ((await simulateView("is_registered", [
    nativeToScVal(slugToSymbol(projectSlug), { type: "symbol" }),
  ])) as boolean) ?? false;
}

export async function hasRatedOnChain(
  userAddress: string,
  projectSlug: string,
): Promise<boolean> {
  if (!ON_CHAIN_ENABLED) return false;
  return ((await simulateView("has_rated", [
    nativeToScVal(userAddress, { type: "address" }),
    nativeToScVal(slugToSymbol(projectSlug), { type: "symbol" }),
  ])) as boolean) ?? false;
}

export interface OnChainRating {
  count: number;
  sum: number;
  average: number;
}

export async function getProjectRatingOnChain(
  projectSlug: string,
): Promise<OnChainRating | null> {
  if (!ON_CHAIN_ENABLED) return null;
  const raw = (await simulateView("get_project_rating", [
    nativeToScVal(slugToSymbol(projectSlug), { type: "symbol" }),
  ])) as { count: bigint; sum: bigint } | null;
  if (!raw) return null;
  const count = Number(raw.count);
  const sum = Number(raw.sum);
  return { count, sum, average: count > 0 ? sum / count : 0 };
}

function scvToBase64(val: xdr.ScVal): string {
  return val.toXDR().toString("base64");
}

/**
 * Read on-chain ratings from contract events instead of simulating a contract
 * call. This avoids per-page simulation costs.
 *
 * Queries the Soroban RPC event store for "Rating" events emitted by
 * `rate_project`, filtered to the given project, and computes the aggregate
 * locally.
 */
export async function getProjectRatingFromEvents(
  projectSlug: string,
): Promise<OnChainRating | null> {
  if (!ON_CHAIN_ENABLED || !CONTRACT_ID) return null;

  const server = getServer();
  const symbol = slugToSymbol(projectSlug);

  const ratingTopic = scvToBase64(
    nativeToScVal("Rating", { type: "symbol" }),
  );
  const projectTopic = scvToBase64(
    nativeToScVal(symbol, { type: "symbol" }),
  );

  let response;
  try {
    response = await server.getEvents({
      startLedger: 1,
      filters: [
        {
          type: "contract",
          contractIds: [CONTRACT_ID],
          topics: [[ratingTopic, projectTopic]],
        },
      ],
      limit: 200,
    });
  } catch {
    return null;
  }

  let count = 0;
  let sum = 0;

  for (const event of response.events) {
    let data: unknown;
    try {
      data = scValToNative(event.value);
    } catch {
      continue;
    }
    if (Array.isArray(data) && data.length >= 2 && typeof data[1] === "number") {
      count++;
      sum += data[1];
    }
  }

  return { count, sum, average: count > 0 ? sum / count : 0 };
}

// Map contract error codes to human-readable messages.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function contractError(status: any): Error {
  const raw = JSON.stringify(status?.resultXdr ?? status ?? "");
  // Extract the error code from the XDR / diagnostic string (#N)
  const match = raw.match(/#(\d+)/);
  const code = match ? Number(match[1]) : null;
  const messages: Record<number, string> = {
    1: "Contract is already initialized.",
    2: "Contract is not initialized.",
    3: "Unauthorized — only the admin can perform this action.",
    4: "Invalid fee amount.",
    5: "This project is already registered on-chain.",
    6: "Project not found in registry — an admin must register it on-chain first.",
    7: "Nothing to withdraw.",
    8: "Score must be between 1 and 5.",
    9: "You have already rated this project on-chain.",
  };
  return new Error(code && messages[code] ? messages[code] : `On-chain transaction failed (code ${code ?? "unknown"})`);
}

// Convert a web slug (may contain hyphens) to a valid Soroban Symbol.
// Soroban Symbols allow [a-zA-Z0-9_] up to 32 chars.
function slugToSymbol(slug: string): string {
  const sym = slug.replace(/-/g, "_").slice(0, 32);
  if (!/^[a-zA-Z0-9_]{1,32}$/.test(sym)) {
    throw new Error(`"${slug}" cannot be used as a Soroban Symbol after sanitization`);
  }
  return sym;
}

// ── User write: rate_project ─────────────────────────────────────────────────

export async function rateProjectOnChain(
  userAddress: string,
  projectSlug: string,
  score: number,
): Promise<string | null> {
  if (!ON_CHAIN_ENABLED || !CONTRACT_ID) return null;

  const symbol = slugToSymbol(projectSlug);

  const { isConnected, requestAccess, signTransaction } = await import(
    "@stellar/freighter-api"
  );

  const conn = await isConnected();
  if (conn.error || !conn.isConnected)
    throw new Error("Freighter wallet not found. Install the extension.");

  const access = await requestAccess();
  if (access.error) throw new Error(access.error.message || "Wallet access denied");

  const server = getServer();
  const contract = getContract();
  const account = await server.getAccount(userAddress);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      contract.call(
        "rate_project",
        nativeToScVal(userAddress, { type: "address" }),
        nativeToScVal(symbol, { type: "symbol" }),
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
  if (signed.error || !signed.signedTxXdr) throw new Error("Wallet signing failed");

  const signedTx = TransactionBuilder.fromXDR(signed.signedTxXdr, networkPassphrase);
  const sent = await server.sendTransaction(signedTx);

  if (sent.status === "ERROR")
    throw new Error(`Transaction rejected: ${JSON.stringify(sent.errorResult)}`);

  const { hash } = sent;
  for (let i = 0; i < 30; i++) {
    const status = await server.getTransaction(hash);
    if (status.status === "SUCCESS") return hash;
    if (status.status === "FAILED") throw contractError(status);
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("Transaction timed out — check the explorer for status");
}

// ── Admin writes ─────────────────────────────────────────────────────────────

/** Set the per-rating fee. `amountStroops` is in the token's smallest unit. */
export async function setRatingFeeOnChain(
  adminAddress: string,
  amountStroops: bigint,
): Promise<string> {
  return adminWrite(adminAddress, "set_rating_fee", [
    nativeToScVal(adminAddress, { type: "address" }),
    nativeToScVal(amountStroops, { type: "i128" }),
  ]);
}

/** Set the per-registration fee. `amountStroops` is in the token's smallest unit. */
export async function setRegistrationFeeOnChain(
  adminAddress: string,
  amountStroops: bigint,
): Promise<string> {
  return adminWrite(adminAddress, "set_registration_fee", [
    nativeToScVal(adminAddress, { type: "address" }),
    nativeToScVal(amountStroops, { type: "i128" }),
  ]);
}

/** Update the treasury address that receives withdrawn fees. */
export async function setTreasuryOnChain(
  adminAddress: string,
  treasuryAddress: string,
): Promise<string> {
  return adminWrite(adminAddress, "set_treasury", [
    nativeToScVal(adminAddress, { type: "address" }),
    nativeToScVal(treasuryAddress, { type: "address" }),
  ]);
}

/** Flush all collected fees to the treasury. Returns tx hash. */
export async function withdrawFeesOnChain(adminAddress: string): Promise<string> {
  return adminWrite(adminAddress, "withdraw_fees", [
    nativeToScVal(adminAddress, { type: "address" }),
  ]);
}

/**
 * Register a project on-chain. Admin's address is used as payer.
 * `projectId` must be a valid Soroban Symbol (≤32 chars, [a-zA-Z0-9_]).
 */
export async function registerProjectOnChain(
  adminAddress: string,
  projectId: string,
  accountId: string,
): Promise<string> {
  return adminWrite(adminAddress, "register_project", [
    nativeToScVal(adminAddress, { type: "address" }),
    nativeToScVal(projectId, { type: "symbol" }),
    nativeToScVal(accountId, { type: "address" }),
    nativeToScVal(adminAddress, { type: "address" }), // payer = admin
  ]);
}

/** Remove a project from the registry. No fee refund. */
export async function removeProjectOnChain(
  adminAddress: string,
  projectId: string,
): Promise<string> {
  return adminWrite(adminAddress, "remove_project", [
    nativeToScVal(adminAddress, { type: "address" }),
    nativeToScVal(projectId, { type: "symbol" }),
  ]);
}

/** Update the semver version string stored on-chain. */
export async function upgradeVersionOnChain(
  adminAddress: string,
  newVersion: string,
): Promise<string> {
  return adminWrite(adminAddress, "upgrade_version", [
    nativeToScVal(adminAddress, { type: "address" }),
    nativeToScVal(newVersion, { type: "string" }),
  ]);
}

/** Hand off admin rights to a new address. Irreversible unless new admin acts. */
export async function transferAdminOnChain(
  adminAddress: string,
  newAdminAddress: string,
): Promise<string> {
  return adminWrite(adminAddress, "transfer_admin", [
    nativeToScVal(adminAddress, { type: "address" }),
    nativeToScVal(newAdminAddress, { type: "address" }),
  ]);
}
