import {beforeEach, describe, expect, it, vi} from "vitest";

const {verifyApiKey, getSupabase, state, range} = vi.hoisted(() => {
	const state = {
		keyValid: true,
		data: [{numericId: 7, name: "Orbit", slug: "orbit"}] as Array<Record<string, unknown>> | null,
	};
	const range = vi.fn(async () => ({data: state.data, count: 1 as number | null, error: null as Error | null}));
	const query = {
		in: vi.fn(() => query),
		order: vi.fn(() => query),
		range,
	};
	const select = vi.fn(() => query);
	const from = vi.fn(() => ({select}));
	const getSupabase = vi.fn(() => ({from}));
	const verifyApiKey = vi.fn(async (request: Request) =>
		state.keyValid && request.headers.get("X-API-Key") === "swh_live_test"
			? {id: "key-1", userId: 1, tier: "free"}
			: null,
	);
	return {verifyApiKey, getSupabase, state, range};
});

vi.mock("@/lib/api-keys", () => ({verifyApiKey}));
vi.mock("@/lib/firebase", () => ({getSupabase}));

import {GET} from "./route";

function request(query = "", apiKey = "swh_live_test") {
	return GET(new Request(`http://localhost/api/v1/projects${query}`, {
		headers: {"X-API-Key": apiKey},
	}));
}

beforeEach(() => {
	vi.clearAllMocks();
	state.keyValid = true;
	state.data = [{numericId: 7, name: "Orbit", slug: "orbit"}];
});

describe("GET /api/v1/projects", () => {
	it("requires an API key", async () => {
		const response = await GET(new Request("http://localhost/api/v1/projects"));
		expect(response.status).toBe(401);
	});

	it("returns paginated public projects", async () => {
		const response = await request("?page=2&limit=5");
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.data[0]).toMatchObject({id: 7, name: "Orbit"});
		expect(data.pagination).toEqual({page: 2, limit: 5, total: 1, pages: 1});
		expect(verifyApiKey).toHaveBeenCalled();
	});

	it("rejects invalid pagination", async () => {
		const response = await request("?limit=101");
		expect(response.status).toBe(400);
	});

	it("returns an explicit error when the project query fails", async () => {
		range.mockResolvedValueOnce({data: null, count: null, error: new Error("database down")});

		const response = await request();
		expect(response.status).toBe(500);
	});
});
