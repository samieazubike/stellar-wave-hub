import {beforeEach, describe, expect, it, vi} from "vitest";

const {getProject, rpc, getSupabase} = vi.hoisted(() => {
	const getProject = vi.fn();
	const rpc = vi.fn();
	const getSupabase = vi.fn(() => ({rpc}));
	return {getProject, rpc, getSupabase};
});

vi.mock("@/lib/db", () => ({
	projectsCol: {
		ref: {
			doc: vi.fn(() => ({get: getProject})),
		},
	},
}));
vi.mock("@/lib/firebase", () => ({getSupabase}));

import {POST} from "./route";

function request(id: string, referrerHost = "direct") {
	return POST(new Request(`http://localhost/api/projects/${id}/view`, {
		method: "POST",
		headers: {"Content-Type": "application/json"},
		body: JSON.stringify({referrerHost}),
	}), {
		params: Promise.resolve({id}),
	});
}

beforeEach(() => {
	vi.clearAllMocks();
	getProject.mockResolvedValue({exists: true});
	rpc.mockResolvedValue({error: null});
});

describe("POST /api/projects/[id]/view", () => {
	it("increments views for an existing project", async () => {
		const response = await request("42");

		expect(response.status).toBe(200);
		expect(rpc).toHaveBeenCalledWith("increment_project_view", {
			p_project_id: 42,
			p_referrer_host: "direct",
		});
	});

	it("rejects invalid project IDs", async () => {
		for (const id of ["slug", "0", "9007199254740992"]) {
			const response = await request(id);
			expect(response.status).toBe(400);
		}

		expect(getProject).not.toHaveBeenCalled();
		expect(rpc).not.toHaveBeenCalled();
	});

	it("rejects referrer values that are not aggregate hostnames", async () => {
		const response = await request("42", "example.com/path?token=secret");

		expect(response.status).toBe(400);
		expect(getProject).not.toHaveBeenCalled();
		expect(rpc).not.toHaveBeenCalled();
	});

	it("returns 404 when the project does not exist", async () => {
		getProject.mockResolvedValue({exists: false});

		const response = await request("42");

		expect(response.status).toBe(404);
		expect(rpc).not.toHaveBeenCalled();
	});

	it("returns 500 when the database increment fails", async () => {
		rpc.mockResolvedValue({error: new Error("database unavailable")});

		const response = await request("42");

		expect(response.status).toBe(500);
		await expect(response.json()).resolves.toEqual({error: "Internal server error"});
	});
});
