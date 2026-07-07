import { Horizon } from "@stellar/stellar-sdk";

const HORIZON_URL =
  process.env.STELLAR_HORIZON_URL || "https://horizon.stellar.org";
const server = new Horizon.Server(HORIZON_URL);

export async function getAccountSummary(accountId: string) {
  const account = await server.loadAccount(accountId);
  return {
    id: account.id,
    balances: account.balances.map((b) => ({
      asset_type: b.asset_type,
      asset_code: "asset_code" in b ? b.asset_code : "XLM",
      asset_issuer: "asset_issuer" in b ? b.asset_issuer : undefined,
      balance: b.balance,
    })),
    sequence: account.sequence,
  };
}

export async function getRecentTransactions(accountId: string, limit = 20) {
  const payments = await server
    .payments()
    .forAccount(accountId)
    .limit(limit)
    .order("desc")
    .call();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return payments.records.map((r: any) => ({
    id: r.id,
    type: r.type,
    created_at: r.created_at,
    amount: r.amount,
    asset_type: r.asset_type,
    asset_code: r.asset_code,
    from: r.from,
    to: r.to,
    transaction_hash: r.transaction_hash,
  }));
}

export async function getContractInvocations(accountId: string, limit = 20) {
  const ops = await server
    .operations()
    .forAccount(accountId)
    .limit(limit)
    .order("desc")
    .call();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ops.records
    .filter((r: any) => r.type === "invoke_host_function")
    .map((r: any) => ({
      id: r.id,
      type: r.type,
      created_at: r.created_at,
      function: r.function,
      transaction_hash: r.transaction_hash,
    }));
}
