import {
	Account,
	BASE_FEE,
	Contract,
	Keypair,
	Networks,
	rpc,
	scValToNative,
	TransactionBuilder,
	xdr,
} from "@stellar/stellar-sdk";
import {getAuthUser, hasMinRole} from "@/lib/auth";

export const dynamic = "force-dynamic";

const HISTORY_DAYS = 90;
const LEDGER_INTERVAL_MS = 5_000;
const EVENT_PAGE_SIZE = 1_000;
const MAX_EVENT_PAGES = 100;

type TransferEvent = {
	date: string;
	from: string;
	to: string;
	amount: bigint;
};

type HistoryDay = {
	date: string;
	balance_stroops: string | null;
	fees_stroops: string | null;
};

function getRpcConfiguration() {
	const network = process.env.NEXT_PUBLIC_CONTRACT_NETWORK || "testnet";
	const rpcUrl =
		process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ||
		(network === "mainnet"
			? "https://mainnet.sorobanrpc.com"
			: "https://soroban-testnet.stellar.org");

	return {
		contractId: process.env.NEXT_PUBLIC_CONTRACT_ID,
		tokenId: process.env.NEXT_PUBLIC_USDC_SAC,
		networkPassphrase:
			network === "mainnet" ? Networks.PUBLIC : Networks.TESTNET,
		rpcUrl,
	};
}

async function getCurrentCollectedFees(
	server: rpc.Server,
	contractId: string,
	networkPassphrase: string,
): Promise<bigint> {
	const contract = new Contract(contractId);
	const source = new Account(Keypair.random().publicKey(), "0");
	const transaction = new TransactionBuilder(source, {
		fee: BASE_FEE,
		networkPassphrase,
	})
		.addOperation(contract.call("get_treasury_balance"))
		.setTimeout(60)
		.build();

	const simulation = await server.simulateTransaction(transaction);
	if (rpc.Api.isSimulationError(simulation)) {
		throw new Error(`Treasury balance simulation failed: ${simulation.error}`);
	}
	if (!("result" in simulation) || !simulation.result) {
		throw new Error("Treasury balance simulation returned no result.");
	}

	const balance = scValToNative(simulation.result.retval);
	return typeof balance === "bigint" ? balance : BigInt(String(balance));
}

function toAddress(value: unknown): string {
	if (typeof value === "string") return value;
	if (
		typeof value === "object" &&
		value !== null &&
		"toString" in value &&
		typeof value.toString === "function"
	) {
		return value.toString();
	}
	return "";
}

function parseTransferEvents(
	events: rpc.Api.EventResponse[],
	contractId: string,
	startDate: string,
	endDate: string,
): TransferEvent[] {
	const transfers: TransferEvent[] = [];

	for (const event of events) {
		if (!event.inSuccessfulContractCall || event.topic.length < 3) continue;

		const topic = event.topic.map((value) => scValToNative(value));
		if (topic[0] !== "transfer") continue;

		const from = toAddress(topic[1]);
		const to = toAddress(topic[2]);
		if (from !== contractId && to !== contractId) continue;

		const date = event.ledgerClosedAt.slice(0, 10);
		if (date < startDate || date > endDate) continue;

		const amount = scValToNative(event.value);
		const amountBigInt =
			typeof amount === "bigint" ? amount : BigInt(String(amount));
		if (amountBigInt <= BigInt(0)) continue;

		transfers.push({date, from, to, amount: amountBigInt});
	}

	return transfers;
}

function buildDailyHistory(
	now: Date,
	currentBalance: bigint,
	transfers: TransferEvent[],
	contractId: string,
	complete: boolean,
	historyAvailableFrom: string,
): HistoryDay[] {
	const lastDate = new Date(now);
	lastDate.setUTCHours(0, 0, 0, 0);
	const firstDate = new Date(lastDate);
	firstDate.setUTCDate(firstDate.getUTCDate() - HISTORY_DAYS + 1);

	const dayFlows = new Map<string, {fees: bigint; net: bigint}>();
	for (const transfer of transfers) {
		const totals =
			dayFlows.get(transfer.date) ?? {fees: BigInt(0), net: BigInt(0)};
		if (transfer.to === contractId) {
			totals.fees += transfer.amount;
			totals.net += transfer.amount;
		} else {
			totals.net -= transfer.amount;
		}
		dayFlows.set(transfer.date, totals);
	}

	const availableDate = new Date(`${historyAvailableFrom}T00:00:00.000Z`);
	if (!complete) availableDate.setUTCDate(availableDate.getUTCDate() + 1);

	let balance = currentBalance;
	const days: HistoryDay[] = [];
	for (
		let date = new Date(lastDate);
		date >= firstDate;
		date.setUTCDate(date.getUTCDate() - 1)
	) {
		const dateKey = date.toISOString().slice(0, 10);
		const known = date >= availableDate;
		const totals =
			dayFlows.get(dateKey) ?? {fees: BigInt(0), net: BigInt(0)};
		days.push({
			date: dateKey,
			balance_stroops: known ? balance.toString() : null,
			fees_stroops: known ? totals.fees.toString() : null,
		});
		balance -= totals.net;
	}

	return days.reverse();
}

export async function GET(request: Request) {
	const auth = getAuthUser(request);
	if (!auth || !hasMinRole(auth.role, "admin")) {
		return Response.json({error: "Forbidden"}, {status: 403});
	}

	const {contractId, tokenId, networkPassphrase, rpcUrl} =
		getRpcConfiguration();
	if (!contractId || !tokenId) {
		return Response.json(
			{
				error:
					"Set NEXT_PUBLIC_CONTRACT_ID and NEXT_PUBLIC_USDC_SAC to enable treasury history.",
			},
			{status: 503},
		);
	}

	try {
		const server = new rpc.Server(rpcUrl);
		const now = new Date();
		const firstDate = new Date(now);
		firstDate.setUTCHours(0, 0, 0, 0);
		firstDate.setUTCDate(firstDate.getUTCDate() - HISTORY_DAYS + 1);

		const [latestLedger, health, currentBalance] = await Promise.all([
			server.getLatestLedger(),
			server.getHealth(),
			getCurrentCollectedFees(server, contractId, networkPassphrase),
		]);

		const earliestLedger = Math.max(
			health.oldestLedger,
			latestLedger.sequence -
				Math.ceil((now.getTime() - firstDate.getTime()) / LEDGER_INTERVAL_MS) -
				10,
		);
		const transferTopic = Buffer.from(
			xdr.ScVal.scvSymbol("transfer").toXDR(),
		).toString("base64");
		const filters: rpc.Api.EventFilter[] = [
			{
				type: "contract",
				contractIds: [tokenId],
				topics: [[transferTopic]],
			},
		];

		let page = await server.getEvents({
			startLedger: earliestLedger,
			filters,
			limit: EVENT_PAGE_SIZE,
		});
		const events = [...page.events];
		let pageCount = 1;
		while (page.events.length === EVENT_PAGE_SIZE) {
			if (pageCount >= MAX_EVENT_PAGES) {
				throw new Error("Treasury history exceeded the event page limit.");
			}
			const nextPage = await server.getEvents({
				cursor: page.cursor,
				filters,
				limit: EVENT_PAGE_SIZE,
			});
			if (nextPage.cursor === page.cursor) {
				throw new Error("Stellar RPC did not advance the treasury event cursor.");
			}
			events.push(...nextPage.events);
			page = nextPage;
			pageCount += 1;
		}

		const historyAvailableFrom = page.oldestLedgerCloseTime.slice(0, 10);
		const complete =
			new Date(page.oldestLedgerCloseTime).getTime() <= firstDate.getTime();
		const lastDate = now.toISOString().slice(0, 10);
		const transfers = parseTransferEvents(
			events,
			contractId,
			firstDate.toISOString().slice(0, 10),
			lastDate,
		);
		const days = buildDailyHistory(
			now,
			currentBalance,
			transfers,
			contractId,
			complete,
			historyAvailableFrom,
		);

		return Response.json({
			days,
			complete,
			history_available_from: historyAvailableFrom,
			updated_at: now.toISOString(),
		});
	} catch (error) {
		console.error("Admin treasury history error:", error);
		return Response.json(
			{error: "Failed to load treasury history from Stellar RPC."},
			{status: 502},
		);
	}
}
