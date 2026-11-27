import {beforeEach, describe, expect, it, vi} from "vitest";

const {from, getSupabase, getAuthUser, state} = vi.hoisted(() => {
	const state = {
		project: {
			numericId: 7,
			user_id: 11,
			name: "Orbit",
			slug: "orbit",
			pro_until: null as string | null,
		} as Record<string, unknown> | null,
		dailyViews: [] as Array<Record<string, unknown>>,
		referrers: [] as Array<Record<string, unknown>>,
		tips: 0,
		ratings: 0,
	};

	const from = vi.fn((table: string) => {
		const result = table === "projects"
			? {data: state.project, error: null}
			: table === "project_views_daily"
				? {data: state.dailyViews, error: null}
				: table === "project_views_referrers_daily"
					? {data: state.referrers, error: null}
					: {count: table === "payments" ? state.tips : state.ratings, error: null};
		const query = {
			select: vi.fn(() => query),
			eq: vi.fn(() => query),
			gte: vi.fn(() => query),
			lte: vi.fn(() => query),
			order: vi.fn(() => query),
			maybeSingle: vi.fn(async () => result),
			then: (resolve: (value: typeof result) => unknown, reject: (reason: unknown) => unknown) =>
				Promise.resolve(result).then(resolve, reject),
		};
		return query;
	});

	const getSupabase = vi.fn(() => ({from}));
	const getAuthUser = vi.fn((request: Request) => {
		const authorization = request.headers.get("Authorization");
		if (authorization === "Bearer owner") return {userId: 11, role: "contributor"};
		if (authorization === "Bearer other") return {userId: 12, role: "contributor"};
		return null;
	});
	return {from, getSupabase, getAuthUser, state};
});

vi.mock("@/lib/firebase", () => ({getSupabase}));
vi.mock("@/lib/auth", () => ({getAuthUser}));

import {GET} from "./route";

function request(path: string, token?: string) {
	const id = path.includes("/orbit/") ? "orbit" : "7";
	return GET(new Request(`http://localhost${path}`, {
		headers: token ? {Authorization: `Bearer ${token}`} : undefined,
	}), {params: Promise.resolve({id})});
}

beforeEach(() => {
	vi.clearAllMocks();
	state.project = {
		numericId: 7,
		user_id: 11,
		name: "Orbit",
		slug: "orbit",
		pro_until: null,
	};
	state.dailyViews = [];
	state.referrers = [];
	state.tips = 0;
	state.ratings = 0;
});

describe("GET /api/projects/[id]/analytics", () => {
	it("requires an authenticated owner", async () => {
		expect((await request("/api/projects/7/analytics")).status).toBe(401);

		const response = await request("/api/projects/7/analytics", "other");
		expect(response.status).toBe(403);
	});

	it("caps free analytics at seven days without returning Pro metrics", async () => {
		const response = await request("/api/projects/7/analytics?days=90", "owner");
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.days).toBe(7);
		expect(data.upgradeRequired).toBe(true);
		expect(data.dailyViews).toHaveLength(7);
		expect(data.referrers).toEqual([]);
		expect(data.conversions).toBeNull();
		expect(from).not.toHaveBeenCalledWith("project_views_referrers_daily");
	});

	it("resolves owner analytics by project slug", async () => {
		const response = await request("/api/projects/orbit/analytics", "owner");
		expect(response.status).toBe(200);
	});

	it("returns 90 days, aggregated referrers, and conversions for Pro owners", async () => {
		state.project = {...state.project!, pro_until: "2099-01-01T00:00:00.000Z"};
		state.dailyViews = [{day: "2026-11-25", views: 10}];
		state.referrers = [
			{referrer_host: "search.example", views: 6},
			{referrer_host: "direct", views: 4},
		];
		state.tips = 2;
		state.ratings = 3;

		const response = await request("/api/projects/7/analytics", "owner");
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.days).toBe(90);
		expect(data.totalViews).toBe(10);
		expect(data.referrers).toEqual([
			{host: "search.example", views: 6},
			{host: "direct", views: 4},
		]);
		expect(data.conversions).toEqual({
			tips: 2,
			ratings: 3,
			tipRate: 20,
			ratingRate: 30,
		});
	});

	it("rejects a non-positive days value", async () => {
		const response = await request("/api/projects/7/analytics?days=0", "owner");
		expect(response.status).toBe(400);
	});
});
