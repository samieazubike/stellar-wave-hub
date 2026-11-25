import {beforeEach, describe, expect, it, vi} from "vitest";

const {state, getAuthUser, getSupabase, verifyStellarPayment, notifyPurchase, rpc} = vi.hoisted(() => {
	const state = {
		job: {
			id: 42,
			project_id: 8,
			posted_by: 11,
			title: "Protocol Engineer",
			status: "draft",
			expires_at: null,
			featured_until: null,
			tx_hash: null,
		} as Record<string, unknown> | null,
		redemption: {
			expires_at: "2026-12-25T00:00:00.000Z",
			featured_until: "2026-12-25T00:00:00.000Z",
			project_id: 8,
			title: "Protocol Engineer",
		} as Record<string, unknown>,
		error: null as {code?: string; message?: string} | null,
	};
	const getAuthUser = vi.fn((request: Request) =>
		request.headers.get("Authorization") === "Bearer owner"
			? {userId: 11, role: "contributor"}
			: null,
	);
	const rpc = vi.fn(async () => ({data: state.redemption, error: state.error}));
	const getSupabase = vi.fn(() => ({
		from: vi.fn(() => ({
			select: vi.fn(() => ({
				eq: vi.fn(() => ({
					maybeSingle: vi.fn(async () => ({data: state.job, error: null})),
				})),
			})),
		})),
		rpc,
	}));
	const verifyStellarPayment = vi.fn(async () => ({
		txHash: "a".repeat(64),
		amountXlm: "30",
		sourceAddress: "Gsource",
		destinationAddress: "Gdestination",
		network: "testnet" as const,
	}));
	const notifyPurchase = vi.fn();
	return {state, getAuthUser, getSupabase, verifyStellarPayment, notifyPurchase, rpc};
});

vi.mock("@/lib/auth", () => ({
	getAuthUser,
	hasMinRole: (role: string, minimum: string) => role === "admin" || role === minimum,
}));
vi.mock("@/lib/firebase", () => ({getSupabase}));
vi.mock("@/lib/pricing", () => ({
	buildMemo: (product: string, id: number) => `${product === "job_post" ? "job" : product}:${id}`,
	getPrice: () => 30,
}));
vi.mock("@/lib/payments", () => ({verifyStellarPayment}));
vi.mock("@/lib/notify", () => ({notifyPurchase}));

import {POST} from "./route";

const txHash = "a".repeat(64);

function request(
	body: unknown = {tx_hash: txHash, featured: true},
	authorization = "Bearer owner",
) {
	return POST(new Request("http://localhost/api/jobs/42/activate", {
		method: "POST",
		headers: {
			Authorization: authorization,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	}), {params: Promise.resolve({id: "42"})});
}

beforeEach(() => {
	vi.clearAllMocks();
	state.job = {
		id: 42,
		project_id: 8,
		posted_by: 11,
		title: "Protocol Engineer",
		status: "draft",
		expires_at: null,
		featured_until: null,
		tx_hash: null,
	};
	state.error = null;
});

describe("POST /api/jobs/[id]/activate", () => {
	it("requires an authenticated owner", async () => {
		expect((await request({tx_hash: txHash, featured: false}, "")).status).toBe(401);
	});

	it("verifies the job memo and atomically activates the paid featured job", async () => {
		const response = await request();
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(verifyStellarPayment).toHaveBeenCalledWith(txHash, 30, "job:42");
		expect(rpc).toHaveBeenCalledWith("redeem_job_payment", expect.objectContaining({
			p_tx_hash: txHash,
			p_user_id: 11,
			p_job_id: 42,
			p_amount: "30",
			p_featured: true,
		}));
		expect(data.featured_until).toBe(state.redemption.featured_until);
		expect(notifyPurchase).toHaveBeenCalledWith(expect.objectContaining({product: "job_post"}));
	});

	it("rejects a job owned by another user", async () => {
		state.job = {...state.job!, posted_by: 12};

		const response = await request();

		expect(response.status).toBe(403);
		expect(verifyStellarPayment).not.toHaveBeenCalled();
	});

	it("rejects invalid payment details without activating the draft", async () => {
		const response = await request({tx_hash: "not-a-hash", featured: false});

		expect(response.status).toBe(400);
		expect(verifyStellarPayment).not.toHaveBeenCalled();
	});

	it("requires an explicit boolean for the Featured option", async () => {
		const response = await request({tx_hash: txHash, featured: "yes"});

		expect(response.status).toBe(400);
		expect(verifyStellarPayment).not.toHaveBeenCalled();
	});

	it("does not activate if payment verification fails", async () => {
		verifyStellarPayment.mockRejectedValueOnce(new Error("memo mismatch"));

		const response = await request({tx_hash: txHash, featured: false});

		expect(response.status).toBe(422);
		expect(rpc).not.toHaveBeenCalled();
	});

	it("returns conflict when a transaction was already redeemed", async () => {
		state.error = {code: "23505", message: "duplicate key"};

		const response = await request();

		expect(response.status).toBe(409);
	});

	it("is idempotent when the same transaction already activated the job", async () => {
		state.job = {...state.job!, status: "active", tx_hash: txHash};

		const response = await request();

		expect(response.status).toBe(200);
		expect(verifyStellarPayment).not.toHaveBeenCalled();
		expect(rpc).not.toHaveBeenCalled();
	});
});
