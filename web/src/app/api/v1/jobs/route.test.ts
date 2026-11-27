import {beforeEach, describe, expect, it, vi} from "vitest";

const {verifyApiKey, listActiveJobs} = vi.hoisted(() => ({
	verifyApiKey: vi.fn(async (request: Request) =>
		request.headers.get("X-API-Key") === "valid-key"
			? {id: "key-1", userId: 1, tier: "free"}
			: null,
	),
	listActiveJobs: vi.fn(async () => [{id: 12, title: "Protocol Engineer"}]),
}));

vi.mock("@/lib/api-keys", () => ({verifyApiKey}));
vi.mock("@/lib/jobs-server", () => ({
	listActiveJobs,
	parseJobFilters: vi.fn(() => ({type: "contract"})),
}));

import {GET} from "./route";

describe("GET /api/v1/jobs", () => {
	beforeEach(() => vi.clearAllMocks());

	it("requires a valid API key", async () => {
		const response = await GET(new Request("http://localhost/api/v1/jobs"));
		expect(response.status).toBe(401);
	});

	it("returns active jobs for a valid key", async () => {
		const response = await GET(new Request("http://localhost/api/v1/jobs?type=contract", {
			headers: {"X-API-Key": "valid-key"},
		}));
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.data).toEqual([{id: 12, title: "Protocol Engineer"}]);
		expect(listActiveJobs).toHaveBeenCalledWith({type: "contract"});
	});
});
