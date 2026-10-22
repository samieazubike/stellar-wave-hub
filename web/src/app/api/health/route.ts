import pkg from "../../../../package.json";
import {getSupabase} from "@/lib/firebase";

export const dynamic = "force-dynamic";

const CHECK_TIMEOUT_MS = 3000;

const HORIZON_URL = process.env.STELLAR_HORIZON_URL || "https://horizon.stellar.org";

const CONTRACT_NETWORK = process.env.NEXT_PUBLIC_CONTRACT_NETWORK || "testnet";
const SOROBAN_RPC_URL =
	process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ||
	(CONTRACT_NETWORK === "mainnet"
		? "https://mainnet.sorobanrpc.com"
		: "https://soroban-testnet.stellar.org");

type CheckResult = {
	status: "up" | "down";
	latency_ms: number;
};

// Runs a probe with a hard timeout. Error details are deliberately dropped so
// connection strings, keys or internal hostnames never reach the response.
async function runCheck(probe: (signal: AbortSignal) => Promise<void>): Promise<CheckResult> {
	const started = Date.now();
	try {
		await probe(AbortSignal.timeout(CHECK_TIMEOUT_MS));
		return {status: "up", latency_ms: Date.now() - started};
	} catch {
		return {status: "down", latency_ms: Date.now() - started};
	}
}

async function checkDb(signal: AbortSignal) {
	const {error} = await getSupabase()
		.from("projects")
		.select("numericId", {head: true})
		.limit(1)
		.abortSignal(signal);
	if (error) throw error;
}

async function checkHorizon(signal: AbortSignal) {
	const res = await fetch(HORIZON_URL, {signal, cache: "no-store"});
	if (!res.ok) throw new Error(`Horizon responded ${res.status}`);
}

async function checkContractRpc(signal: AbortSignal) {
	const res = await fetch(SOROBAN_RPC_URL, {
		method: "POST",
		headers: {"Content-Type": "application/json"},
		body: JSON.stringify({jsonrpc: "2.0", id: 1, method: "getHealth"}),
		signal,
		cache: "no-store",
	});
	if (!res.ok) throw new Error(`RPC responded ${res.status}`);
	const body = await res.json();
	if (body?.result?.status !== "healthy") throw new Error("RPC not healthy");
}

export async function GET() {
	const [db, horizon, contract] = await Promise.all([
		runCheck(checkDb),
		runCheck(checkHorizon),
		runCheck(checkContractRpc),
	]);

	// The DB is the only hard dependency: Horizon and the contract RPC are
	// reported for visibility but a degraded upstream doesn't fail the probe.
	const ok = db.status === "up";

	return Response.json(
		{ok, db, horizon, contract, version: pkg.version},
		{
			status: ok ? 200 : 503,
			headers: {"Cache-Control": "no-store, max-age=0"},
		},
	);
}
