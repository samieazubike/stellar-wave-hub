import { Horizon } from "@stellar/stellar-sdk";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { getSupabase } from "@/lib/firebase";
import { heroSponsorsCol } from "@/lib/db";
import { checkRateLimit, getClientIp, rateLimitExceededResponse } from "@/lib/rate-limit";
import { parseJsonBody } from "@/lib/validation/parse-body";

export const dynamic = "force-dynamic";

const TABLE = "hero_sponsors";
const WEEKS_AHEAD = 8;
const DEFAULT_PRICE_XLM = 150;
const bookingRateLimit = { limit: 10, windowMs: 60_000 };

type HeroBooking = {
  id: number;
  week_start: string;
  project_id: number;
  headline: string | null;
  tx_hash: string;
  created_at: string;
};

function priceXlm(): number {
  const raw = Number(process.env.NEXT_PUBLIC_PRICE_HERO_SPONSOR_XLM);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_PRICE_XLM;
}

function sponsorWallet(): string | null {
  const wallet = process.env.HERO_SPONSOR_WALLET;
  return wallet && wallet.startsWith("G") ? wallet : null;
}

/** Monday (UTC) of the week containing `date`, as a YYYY-MM-DD string. */
function weekStartOf(date: Date): string {
  const day = date.getUTCDay(); // 0 = Sunday .. 6 = Saturday
  const sinceMonday = (day + 6) % 7;
  const monday = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - sinceMonday),
  );
  return monday.toISOString().slice(0, 10);
}

function addWeeks(weekStart: string, weeks: number): string {
  const date = new Date(`${weekStart}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + weeks * 7);
  return date.toISOString().slice(0, 10);
}

/** The bookable window: the current week plus the next `WEEKS_AHEAD` weeks. */
function bookableWeeks(now: Date): string[] {
  const current = weekStartOf(now);
  return Array.from({ length: WEEKS_AHEAD + 1 }, (_, i) => addWeeks(current, i));
}

/**
 * Verify a Horizon transaction actually paid at least `minXlm` XLM in native
 * asset to the sponsor wallet with the expected memo. Amounts are never
 * trusted from the client: everything is read back from Horizon.
 */
async function verifyHeroPayment(
  txHash: string,
  expectedMemo: string,
  minXlm: number,
  destination: string,
): Promise<string | null> {
  const server = new Horizon.Server(process.env.STELLAR_HORIZON_URL || "https://horizon.stellar.org");

  let transaction;
  try {
    transaction = await server.transactions().transaction(txHash).call();
  } catch {
    return "Transaction not found on Horizon";
  }

  if (!transaction.successful) return "Transaction was not successful";
  if (transaction.memo_type !== "text" || transaction.memo !== expectedMemo) {
    return `Transaction memo must be "${expectedMemo}"`;
  }

  const operations = await server.operations().forTransaction(txHash).limit(200).call();
  let paidStroops = BigInt(0);
  let sawPayment = false;
  for (const operation of operations.records) {
    if (operation.type !== "payment") continue;
    sawPayment = true;
    if (operation.to !== destination || operation.asset_type !== "native") continue;
    paidStroops += BigInt(Math.round(Number(operation.amount) * 10_000_000));
  }
  if (!sawPayment) return "Transaction contains no payment operations";
  if (paidStroops < BigInt(Math.round(minXlm * 10_000_000))) {
    return `Payment must be at least ${minXlm} XLM`;
  }
  return null;
}

/** GET /api/sponsors/hero — current week's sponsor plus the next 8 weeks' availability. */
export async function GET() {
  try {
    const currentWeek = weekStartOf(new Date());
    const lastWeek = addWeeks(currentWeek, WEEKS_AHEAD);

    const { data, error } = await getSupabase()
      .from(TABLE)
      .select("*")
      .gte("week_start", currentWeek)
      .lte("week_start", lastWeek)
      .order("week_start", { ascending: true });

    if (error) throw error;

    const rows = (data ?? []) as HeroBooking[];
    const byWeek = new Map(rows.map((row) => [row.week_start, row]));

    const weeks = bookableWeeks(new Date()).map((weekStart) => ({
      week_start: weekStart,
      available: !byWeek.has(weekStart),
    }));

    return Response.json({
      price_xlm: priceXlm(),
      current: byWeek.get(currentWeek) ?? null,
      weeks,
    });
  } catch (err) {
    console.error("Hero sponsor availability error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

const bookHeroSchema = z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "weekStart must be YYYY-MM-DD"),
  projectId: z.coerce.number().int().positive(),
  headline: z.string().max(160).optional(),
  txHash: z.string().regex(/^[0-9a-fA-F]{64}$/, "txHash must be a Stellar transaction hash"),
});

/** POST /api/sponsors/hero — verify the payment on Horizon and book one week. */
export async function POST(request: Request) {
  const auth = getAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimit = checkRateLimit(`hero-sponsor:${getClientIp(request)}`, bookingRateLimit);
  if (!rateLimit.allowed) return rateLimitExceededResponse(rateLimit.retryAfterSeconds);

  const parsed = await parseJsonBody(request, bookHeroSchema);
  if (!parsed.success) return parsed.response;
  const { weekStart, projectId, headline, txHash } = parsed.data;

  const weeks = bookableWeeks(new Date());
  if (!weeks.includes(weekStart)) {
    return Response.json(
      { error: `weekStart must be one of the next ${WEEKS_AHEAD + 1} weeks (Mondays, UTC)` },
      { status: 400 },
    );
  }

  const wallet = sponsorWallet();
  if (!wallet) {
    console.error("HERO_SPONSOR_WALLET is not configured");
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }

  const price = priceXlm();
  const invalidPayment = await verifyHeroPayment(txHash, `hero:${weekStart}`, price, wallet);
  if (invalidPayment) {
    return Response.json({ error: invalidPayment }, { status: 400 });
  }

  try {
    // A week can be booked once; a transaction hash can only redeem once.
    const existingWeek = await heroSponsorsCol.ref.where("week_start", "==", weekStart).limit(1).get();
    if (!existingWeek.empty) {
      return Response.json({ error: "That week is already booked" }, { status: 409 });
    }

    const { data: project } = await getSupabase()
      .from("projects")
      .select("numericId")
      .eq("numericId", projectId)
      .maybeSingle();
    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    const { data, error } = await getSupabase()
      .from(TABLE)
      .insert({
        week_start: weekStart,
        project_id: projectId,
        headline: headline ?? null,
        tx_hash: txHash,
      })
      .select()
      .single();

    if (error) {
      // Unique violations: the week was taken concurrently or the payment
      // was already redeemed.
      if (error.code === "23505") {
        return Response.json({ error: "That week is already booked or the payment was already used" }, { status: 409 });
      }
      throw error;
    }

    return Response.json({ booking: data as HeroBooking }, { status: 201 });
  } catch (err) {
    console.error("Hero sponsor booking error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
