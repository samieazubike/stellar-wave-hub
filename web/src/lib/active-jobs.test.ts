import {beforeEach, describe, expect, it, vi} from "vitest";

const {supabaseState} = vi.hoisted(() => ({
	supabaseState: {
		rows: [] as Record<string, unknown>[],
		error: null as Error | null,
		table: "",
		selected: "",
		projectIds: [] as number[],
		filters: [] as Array<[string, string, unknown]>,
	},
}));

vi.mock("./firebase", () => ({
	getSupabase: () => ({
		from: (table: string) => {
			supabaseState.table = table;
			const builder: Record<string, unknown> = {};
			const self = () => builder;
			builder.select = (fields: string) => {
				supabaseState.selected = fields;
				return self();
			};
			builder.in = (field: string, values: number[]) => {
				supabaseState.projectIds = values;
				supabaseState.filters.push([field, "in", values]);
				return self();
			};
			builder.eq = (field: string, value: string) => {
				supabaseState.filters.push([field, "eq", value]);
				return self();
			};
			builder.gt = (field: string, value: string) => {
				supabaseState.filters.push([field, "gt", value]);
				return self();
			};
			builder.then = (
				resolve: (result: unknown) => unknown,
				reject: (reason: unknown) => unknown,
			) =>
				Promise.resolve({
					data: supabaseState.rows,
					error: supabaseState.error,
				}).then(resolve, reject);
			return builder;
		},
	}),
}));

import {getActiveJobsByProject} from "./active-jobs";

describe("getActiveJobsByProject", () => {
	beforeEach(() => {
		supabaseState.rows = [];
		supabaseState.error = null;
		supabaseState.table = "";
		supabaseState.selected = "";
		supabaseState.projectIds = [];
		supabaseState.filters = [];
	});

	it("returns the application URL for active, unexpired jobs only", async () => {
		const now = new Date("2026-11-25T10:00:00.000Z");
		supabaseState.rows = [
			{
				project_id: 1,
				status: "active",
				expires_at: "2026-12-01T00:00:00.000Z",
				apply_url: "https://jobs.example/z",
			},
			{
				project_id: 1,
				status: "active",
				expires_at: "2026-12-01T00:00:00.000Z",
				apply_url: "https://jobs.example/a",
			},
			{
				project_id: 2,
				status: "closed",
				expires_at: "2026-12-01T00:00:00.000Z",
				apply_url: "https://jobs.example/closed",
			},
			{
				project_id: 3,
				status: "active",
				expires_at: "2026-11-25T09:00:00.000Z",
				apply_url: "https://jobs.example/expired",
			},
			{
				project_id: 4,
				status: "active",
				expires_at: "2026-12-01T00:00:00.000Z",
				apply_url: "https://jobs.example/not-requested",
			},
		];

		const result = await getActiveJobsByProject([1, 1, 2, 3], now);

		expect(result).toEqual(
			new Map([
				[
					1,
					{
						has_active_jobs: true,
						active_job_url: "https://jobs.example/a",
					},
				],
			]),
		);
		expect(supabaseState.table).toBe("jobs");
		expect(supabaseState.selected).toBe(
			"project_id,status,expires_at,apply_url",
		);
		expect(supabaseState.projectIds).toEqual([1, 2, 3]);
		expect(supabaseState.filters).toContainEqual(["status", "eq", "active"]);
		expect(supabaseState.filters).toContainEqual([
			"expires_at",
			"gt",
			now.toISOString(),
		]);
	});

	it("returns no metadata when no project IDs are requested", async () => {
		await expect(getActiveJobsByProject([])).resolves.toEqual(new Map());
		expect(supabaseState.table).toBe("");
	});

	it("surfaces jobs query errors", async () => {
		supabaseState.error = new Error("jobs query failed");
		await expect(getActiveJobsByProject([1])).rejects.toThrow("jobs query failed");
	});
});
