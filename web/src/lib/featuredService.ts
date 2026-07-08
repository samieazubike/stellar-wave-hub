import { Horizon, Memo, TransactionBuilder, Networks, BASE_FEE, Operation, Asset } from "@stellar/stellar-sdk";



const HORIZON_URL = process.env.STELLAR_HORIZON_URL || "https://horizon.stellar.org";
const horizon = new Horizon.Server(HORIZON_URL);

const NETWORK = process.env.NEXT_PUBLIC_CONTRACT_NETWORK || "testnet";
const networkPassphrase = NETWORK === "mainnet" ? Networks.PUBLIC : Networks.TESTNET;

function requireEnv(name: string, value: string | undefined) {
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const FEATURED_MEMO_PREFIX = "feat:";

// Avoid Next.js build-time crashes when env vars are missing locally.
// Server routes will still fail authorization/verification if misconfigured.
export const featuredDestination = (() => {
  const v = process.env.NEXT_PUBLIC_FEATURED_DESTINATION;
  if (!v) return "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
  return v;
})();


export const featuredPriceXlm = Number(
  process.env.NEXT_PUBLIC_FEATURED_PRICE_XLM ?? "50",
);
if (!Number.isFinite(featuredPriceXlm) || featuredPriceXlm <= 0) {
  throw new Error("NEXT_PUBLIC_FEATURED_PRICE_XLM must be a positive number");
}

export const featuredDurationDays = Number(process.env.FEATURED_DURATION_DAYS ?? "30");
if (!Number.isFinite(featuredDurationDays) || featuredDurationDays <= 0) {
  throw new Error("FEATURED_DURATION_DAYS must be a positive number");
}

export type SpotlightActivationInput = {
  txHash: string;
  projectId: number;
};

function toStroops(xlm: number): bigint {
  return BigInt(Math.round(xlm * 10 ** 7));
}

function parseFeaturedMemo(text: string | undefined | null): number | null {
  if (!text) return null;
  if (!text.startsWith(FEATURED_MEMO_PREFIX)) return null;
  const idStr = text.slice(FEATURED_MEMO_PREFIX.length).trim();
  const id = Number(idStr);
  return Number.isFinite(id) ? id : null;
}

export async function verifySpotlightPayment(input: SpotlightActivationInput): Promise<{
  txMemoProjectId: number;
  paymentAmountStroops: bigint;
  paymentDestination: string;
  txStatus: string;
}> {
  const { txHash, projectId } = input;
  if (!txHash) throw new Error("txHash is required");
  if (!projectId) throw new Error("projectId is required");

  // Horizon transactions() builder exposes either .transactionId() or .transaction(); this version uses .transaction()
  const tx = await horizon.transactions().transaction(txHash).call();

  if (!tx) throw new Error("Transaction not found on Horizon");

  const anyTx = tx as unknown as Record<string, unknown> & {
    _embedded?: { records?: unknown[] };
    successful?: boolean;
    status?: string;
  };


  if ((anyTx as any)._embedded?.records && Array.isArray((anyTx as any)._embedded.records) && (anyTx as any)._embedded.records.length) {
    // no-op; we rely on status fields below
  }

  // Horizon returns different shapes depending on endpoint; safest is to use top-level fields


  const status = anyTx.successful ?? anyTx.status;

  const isSuccess = status === "SUCCESS" || status === true;
  if (!isSuccess) throw new Error("Spotlight payment transaction not successful");

  // Determine memo from operations (native payments)
  // TransactionRecord typing varies; use runtime checks + cast.
  const records = (anyTx as any)._embedded?.records as unknown[] | undefined;


  if (!records || !Array.isArray(records)) {
    // Fallback: use operations endpoint
    const ops = await horizon.operations().forTransaction(txHash).call();
    const opsArr = ops.records ?? [];

    // Verify at least one matching payment op
    const expectedStroops = toStroops(featuredPriceXlm);
    const matching = opsArr.find((o: any) => {
      if (o.type !== "payment") return false;
      if (o.to !== featuredDestination) return false;
      // Native payment: asset_type === native OR missing asset fields
      if (o.asset_type && o.asset_type !== "native") return false;

      const amountStr = o.amount?.toString?.() ?? o.amount;
      const amount = amountStr ? BigInt(Math.round(Number(amountStr) * 10 ** 7)) : null;
      if (amount === null) return false;
      if (amount < expectedStroops) return false;

      const memoText = o.memo?.text;
      const pid = parseFeaturedMemo(memoText);
      return pid === projectId;
    });

    if (!matching) {
      throw new Error("No matching featured payment operation found");
    }

    const pid = parseFeaturedMemo((matching as any).memo?.text) as number;
    const amountStr = (matching as any).amount?.toString?.() ?? (matching as any).amount;
    const paymentAmountStroops = amountStr
      ? BigInt(Math.round(Number(amountStr) * 10 ** 7))
      : expectedStroops;

    return {
      txMemoProjectId: pid,
      paymentAmountStroops,
      paymentDestination: (matching as any).to,
      txStatus: String(status ?? "UNKNOWN"),
    };

  }

  // For embedded records, verify similarly
  const expectedStroops = toStroops(featuredPriceXlm);
  const paymentOps = records.filter((o: unknown) => {
    const op = o as any;
    return op?.type === "payment";
  });

  const matching = (paymentOps as any[]).find((o) => {
    if (o?.to !== featuredDestination) return false;
    if (o?.asset_type && o.asset_type !== "native") return false;
    const amountStr = o?.amount?.toString?.() ?? o?.amount;
    const amount = amountStr ? BigInt(Math.round(Number(amountStr) * 10 ** 7)) : null;
    if (amount === null || amount < expectedStroops) return false;
    const pid = parseFeaturedMemo(o?.memo?.text);
    return pid === projectId;
  });

  if (!matching) throw new Error("No matching featured payment operation found");

  const pid = parseFeaturedMemo(matching?.memo?.text) as number;
  const amountStr = matching?.amount?.toString?.() ?? matching?.amount;
  const paymentAmountStroops = amountStr
    ? BigInt(Math.round(Number(amountStr) * 10 ** 7))
    : expectedStroops;

  return {
    txMemoProjectId: pid,
    paymentAmountStroops,
    paymentDestination: matching?.to,
    txStatus: String(status ?? "UNKNOWN"),
  };

}

export function computeFeaturedUntil(now: Date = new Date()) {
  const until = new Date(now);
  until.setUTCDate(until.getUTCDate() + featuredDurationDays);
  return until.toISOString();
}

export function getFeaturedMemoForProject(projectId: number) {
  return `${FEATURED_MEMO_PREFIX}${projectId}`;
}

export function spotlightPaymentAmountStroops(): bigint {
  return toStroops(featuredPriceXlm);
}

// Client-side helper (Freighter signing) — imported by client code
export async function buildSpotlightPaymentTx(params: {
  sourceAccountPublicKey: string;
  txNetworkPassphrase?: string;
  projectId: number;
}) {
  const { sourceAccountPublicKey, projectId } = params;

  const source = await horizon.loadAccount(sourceAccountPublicKey);

  const amountXlm = featuredPriceXlm.toString();
  const memo = Memo.text(getFeaturedMemoForProject(projectId));

  const tx = new TransactionBuilder(
    source as any,

    { fee: BASE_FEE, networkPassphrase },
  )
    .addOperation(
      Operation.payment({
        destination: featuredDestination,
        // Use the SDK-native payment asset representation (no explicit {type:"native"} typing)
        asset: Asset.native(),
        amount: amountXlm,
      }) as any,
    )

    .addMemo(memo)
    .setTimeout(120)
    .build();

  return tx;
}

