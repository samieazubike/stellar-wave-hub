import {beforeEach, describe, expect, it, vi} from "vitest";

const {state, getAuthUser, setJob, projectsDoc, nextId} = vi.hoisted(() => {
	const state = {
		project: {user_id: 11, status: "approved"} as Record<string, unknown> | null,
		createdJob: null as Record<string, unknown> | null,
	};
	const getAuthUser = vi.fn((request: Request) =>
		request.headers.get("Authorization") === "Bearer owner"
			? {userId: 11, role: "contributor"}
			: null,
	);
	const setJob = vi.fn(async (job: Record<string, unknown>) => {
		state.createdJob = job;
	});
	const projectsDoc = vi.fn(() => ({
		get: vi.fn(async () => ({
			exists: state.project !== null,
			data: () => state.project,
		})),
	}));
	const nextId = vi.fn(async () => 77);
	return {state, getAuthUser, setJob, projectsDoc, nextId};
});

vi.mock("@/lib/auth", () => ({
	getAuthUser,
	hasMinRole: (role: string, minimum: string) => role === "admin" || role === minimum,
}));
vi.mock("@/lib/db", () => ({
	jobsCol: {ref: {doc: vi.fn(() => ({set: setJob}))}},
	nextId,
	projectsCol: {ref: {doc: projectsDoc}},
}));

import {POST} from "./route";

function request(body: unknown, authorization = "Bearer owner") {
	return POST(new Request("http://localhost/api/jobs", {
		method: "POST",
		headers: {
			Authorization: authorization,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	}));
}

beforeEach(() => {
	vi.clearAllMocks();
	state.project = {user_id: 11, status: "approved"};
	state.createdJob = null;
});

describe("POST /api/jobs", () => {
	it("saves a new unpaid job as a draft without trusting a client transaction hash", async () => {
		const response = await request({
			project_id: 8,
			title: "Protocol Engineer",
			description: "Build and maintain Stellar smart contracts with the team.",
			apply_url: "https://example.com/apply",
			tx_hash: "a".repeat(64),
		});
		const data = await response.json();

		expect(response.status).toBe(201);
		expect(data.job.status).toBe("draft");
		expect(data.job.tx_hash).toBeNull();
		expect(setJob).toHaveBeenCalledWith(expect.objectContaining({
			status: "draft",
			tx_hash: null,
		}));
	});

	it("rejects jobs for projects that are not publicly approved", async () => {
		state.project = {user_id: 11, status: "submitted"};

		const response = await request({
			project_id: 8,
			title: "Protocol Engineer",
			description: "Build and maintain Stellar smart contracts with the team.",
			apply_url: "https://example.com/apply",
		});

		expect(response.status).toBe(400);
		expect(setJob).not.toHaveBeenCalled();
	});
});
