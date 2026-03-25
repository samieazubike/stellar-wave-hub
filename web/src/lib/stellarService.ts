import { Horizon } from "@stellar/stellar-sdk";

const HORIZON_URL =
  process.env.STELLAR_HORIZON_URL || "https://horizon.stellar.org";
const server = new Horizon.Server(HORIZON_URL);

type HorizonRecord = Record<string, unknown>;

export async function getAccountSummary(accountId: string) {
  const account = await server.loadAccount(accountId);
  return {
    id: account.id,
    balances: account.balances.map((b) => ({
      asset_type: b.asset_type,
      asset_code: "asset_code" in b ? b.asset_code : "XLM",
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

  return payments.records.map((r) => {
    const record = r as HorizonRecord;
    return {
    id: r.id,
    type: r.type,
    created_at: r.created_at,
    amount: record.amount,
    asset_type: record.asset_type,
    asset_code: record.asset_code,
    from: record.from,
    to: record.to,
    transaction_hash: r.transaction_hash,
  };
  });
}

export async function getContractInvocations(accountId: string, limit = 20) {
  const ops = await server
    .operations()
    .forAccount(accountId)
    .limit(limit)
    .order("desc")
    .call();

  return ops.records
    .filter((r) => r.type === "invoke_host_function")
    .map((r) => {
      const record = r as HorizonRecord;
      return {
      id: r.id,
      type: r.type,
      created_at: r.created_at,
      function: record.function,
      transaction_hash: r.transaction_hash,
    };
    });
}
