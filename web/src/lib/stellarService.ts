import { Horizon } from "@stellar/stellar-sdk";

const HORIZON_URL =
  process.env.STELLAR_HORIZON_URL || "https://horizon.stellar.org";
const server = new Horizon.Server(HORIZON_URL);

type PaymentRecord = {
  id: string;
  type: string;
  created_at: string;
  amount?: string;
  asset_type?: string;
  asset_code?: string;
  from?: string;
  to?: string;
  transaction_hash?: string;
};

type OperationRecord = {
  id: string;
  type: string;
  created_at: string;
  function?: string;
  transaction_hash?: string;
};

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

  return (payments.records as PaymentRecord[]).map((r) => ({
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

  return (ops.records as OperationRecord[])
    .filter((r) => r.type === "invoke_host_function")
    .map((r) => ({
      id: r.id,
      type: r.type,
      created_at: r.created_at,
      function: r.function,
      transaction_hash: r.transaction_hash,
    }));
}
