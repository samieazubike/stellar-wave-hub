import fs from 'fs';

const file = '/home/truphile/Documents/DripWaves/stellar-wave-hub/web/src/lib/ratingContract.ts';
let content = fs.readFileSync(file, 'utf8');

// Replace top level synchronous variables
content = content.replace(
  `const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID;
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
  return \`\${base}/tx/\${hash}\`;
}

// ── Internal helpers ─────────────────────────────────────────────────────────

function getServer() {
  return new StellarRpc.Server(rpcUrl);
}

function getContract() {
  if (!CONTRACT_ID) throw new Error("Contract not configured");
  return new Contract(CONTRACT_ID);
}`,
  `export interface ContractConfig {
  contractId: string | null;
  network: string;
}

let cachedConfig: ContractConfig | null = null;
let configPromise: Promise<ContractConfig> | null = null;

export async function getContractConfig(): Promise<ContractConfig> {
  if (cachedConfig) return cachedConfig;
  if (configPromise) return configPromise;

  configPromise = fetch("/api/config")
    .then((r) => r.json())
    .then((data) => {
      cachedConfig = {
        contractId: data.contract_id || process.env.NEXT_PUBLIC_CONTRACT_ID || null,
        network: data.contract_network || process.env.NEXT_PUBLIC_CONTRACT_NETWORK || "testnet",
      };
      return cachedConfig;
    })
    .catch(() => {
      cachedConfig = {
        contractId: process.env.NEXT_PUBLIC_CONTRACT_ID || null,
        network: process.env.NEXT_PUBLIC_CONTRACT_NETWORK || "testnet",
      };
      return cachedConfig;
    });

  return configPromise;
}

export function explorerTxUrl(hash: string): string {
  const network = cachedConfig?.network || process.env.NEXT_PUBLIC_CONTRACT_NETWORK || "testnet";
  const base =
    network === "mainnet"
      ? "https://stellar.expert/explorer/public"
      : "https://stellar.expert/explorer/testnet";
  return \`\${base}/tx/\${hash}\`;
}

// ── Internal helpers ─────────────────────────────────────────────────────────

async function getServerAndContract() {
  const cfg = await getContractConfig();
  if (!cfg.contractId) throw new Error("Contract not configured");
  
  const networkPassphrase = cfg.network === "mainnet" ? Networks.PUBLIC : Networks.TESTNET;
  const rpcUrl =
    process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ||
    (cfg.network === "mainnet"
      ? "https://mainnet.sorobanrpc.com"
      : "https://soroban-testnet.stellar.org");

  const server = new StellarRpc.Server(rpcUrl);
  const contract = new Contract(cfg.contractId);
  return { server, contract, networkPassphrase, contractId: cfg.contractId };
}`
);

// Replace simulateView
content = content.replace(
  `async function simulateView(
  functionName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any[] = [],
): Promise<unknown> {
  if (!ON_CHAIN_ENABLED) return null;
  const server = getServer();
  const contract = getContract();`,
  `async function simulateView(
  functionName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any[] = [],
): Promise<unknown> {
  const cfg = await getContractConfig();
  if (!cfg.contractId) return null;
  const { server, contract, networkPassphrase } = await getServerAndContract();`
);

// Replace adminWrite
content = content.replace(
  `  const access = await requestAccess();
  if (access.error) throw new Error(access.error.message || "Wallet access denied");

  const server = getServer();
  const contract = getContract();
  const account = await server.getAccount(adminAddress);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })`,
  `  const access = await requestAccess();
  if (access.error) throw new Error(access.error.message || "Wallet access denied");

  const { server, contract, networkPassphrase } = await getServerAndContract();
  const account = await server.getAccount(adminAddress);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })`
);

// Fix signedTx networkPassphrase issue in adminWrite
content = content.replace(
  `  const signedTx = TransactionBuilder.fromXDR(signed.signedTxXdr, networkPassphrase);`,
  `  const signedTx = TransactionBuilder.fromXDR(signed.signedTxXdr, networkPassphrase);` // Wait, networkPassphrase is in scope now
);

// Remove ON_CHAIN_ENABLED from views
content = content.replace(/if \(\!ON_CHAIN_ENABLED\) return null;\n\s*/g, '');
content = content.replace(/if \(\!ON_CHAIN_ENABLED\) return false;\n\s*/g, 'if (!(await getContractConfig()).contractId) return false;\n  ');

// Fix getProjectRatingFromEvents
content = content.replace(
  `export async function getProjectRatingFromEvents(
  projectSlug: string,
): Promise<OnChainRating | null> {
  if (!ON_CHAIN_ENABLED || !CONTRACT_ID) return null;

  const server = getServer();`,
  `export async function getProjectRatingFromEvents(
  projectSlug: string,
): Promise<OnChainRating | null> {
  const cfg = await getContractConfig();
  if (!cfg.contractId) return null;

  const { server, contractId } = await getServerAndContract();`
);

content = content.replace(
  `contractIds: [CONTRACT_ID],`,
  `contractIds: [contractId],`
);

// Fix rateProjectOnChain
content = content.replace(
  `export async function rateProjectOnChain(
  userAddress: string,
  projectSlug: string,
  score: number,
): Promise<string | null> {
  if (!ON_CHAIN_ENABLED || !CONTRACT_ID) return null;`,
  `export async function rateProjectOnChain(
  userAddress: string,
  projectSlug: string,
  score: number,
): Promise<string | null> {
  const cfg = await getContractConfig();
  if (!cfg.contractId) return null;`
);

content = content.replace(
  `  const access = await requestAccess();
  if (access.error) throw new Error(access.error.message || "Wallet access denied");

  const server = getServer();
  const contract = getContract();
  const account = await server.getAccount(userAddress);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })`,
  `  const access = await requestAccess();
  if (access.error) throw new Error(access.error.message || "Wallet access denied");

  const { server, contract, networkPassphrase } = await getServerAndContract();
  const account = await server.getAccount(userAddress);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })`
);

fs.writeFileSync(file, content);
console.log("ratingContract.ts updated");
