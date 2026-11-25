import {beforeEach, describe, expect, it, vi} from "vitest";

const {state} = vi.hoisted(() => ({
	state: {
		project: {
			numericId: 42,
			name: "Project",
			slug: "project",
			status: "approved",
			featured: 0,
			user_id: null,
		} as Record<string, unknown>,
		activeJobMetadata: new Map(),
	},
}));

vi.mock("@/lib/auth", () => ({
	getAuthUser: () => null,
}));

vi.mock("@/lib/db", () => ({
	projectsCol: {
		ref: {
			doc: () => ({
				get: async () => ({
					exists: true,
					data: () => state.project,
				}),
			}),
		},
	},
	usersCol: {ref: {doc: vi.fn()}},
	ratingsCol: {ref: {where: () => ({get: async () => ({docs: []})})}},
	ratingVotesCol: {ref: {where: vi.fn()}},
}));

vi.mock("@/lib/active-jobs", () => ({
	getActiveJobsByProject: vi.fn(async () => state.activeJobMetadata),
}));

import {GET} from "./route";

describe("GET /api/projects/[id]", () => {
	beforeEach(() => {
		state.project = {
			numericId: 42,
			name: "Project",
			slug: "project",
			status: "approved",
			featured: 0,
			user_id: null,
		};
		state.activeJobMetadata = new Map();
	});

	it("returns the active job URL with project detail", async () => {
		state.activeJobMetadata = new Map([
			[
				42,
				{
					has_active_jobs: true,
					active_job_url: "https://jobs.example/apply",
				},
			],
		]);

		const response = await GET(
			new Request("https://hub.test/api/projects/42"),
			{params: Promise.resolve({id: "42"})},
		);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.project).toMatchObject({
			has_active_jobs: true,
			active_job_url: "https://jobs.example/apply",
		});
	});

	it("returns false metadata when the project has no active job", async () => {
		const response = await GET(
			new Request("https://hub.test/api/projects/42"),
			{params: Promise.resolve({id: "42"})},
		);
		const body = await response.json();

		expect(body.project).toMatchObject({
			has_active_jobs: false,
			active_job_url: null,
		});
	});
});
