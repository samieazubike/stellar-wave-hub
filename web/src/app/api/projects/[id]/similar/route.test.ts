import {beforeEach, describe, expect, it, vi} from "vitest";

const {
	projectDocGet,
	projectSlugGet,
	userDocGet,
	ratingsGet,
	supabaseIn,
} = vi.hoisted(() => ({
	projectDocGet: vi.fn(),
	projectSlugGet: vi.fn(),
	userDocGet: vi.fn(),
	ratingsGet: vi.fn(),
	supabaseIn: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
	projectsCol: {
		ref: {
			doc: vi.fn(() => ({get: projectDocGet})),
			where: vi.fn(() => ({
				limit: vi.fn(() => ({get: projectSlugGet})),
			})),
		},
	},
	usersCol: {
		ref: {
			doc: vi.fn(() => ({get: userDocGet})),
		},
	},
	ratingsCol: {
		ref: {
			get: ratingsGet,
		},
	},
}));

vi.mock("@/lib/firebase", () => ({
	getSupabase: vi.fn(() => ({
		from: vi.fn(() => ({
			select: vi.fn(() => ({
				in: supabaseIn,
			})),
		})),
	})),
}));

vi.mock("@/lib/public-project-cache", () => ({
	publicProjectCacheHeaders: {"Cache-Control": "public"},
}));

import {GET} from "./route";

function makeRequest(id: string, query = "") {
	return new Request(`http://localhost/api/projects/${id}/similar${query}`);
}

const baseProject = {
	numericId: 1,
	name: "Current DeFi",
	slug: "current-defi",
	description: "Main project",
	category: "defi",
	tags: "dex, soroban, liquidity",
	status: "approved",
	featured: 0,
	user_id: 10,
	created_at: "2026-01-01T00:00:00Z",
};

beforeEach(() => {
	vi.clearAllMocks();
	ratingsGet.mockResolvedValue({docs: []});
	userDocGet.mockResolvedValue({
		exists: true,
		data: () => ({username: "alice"}),
	});
});

describe("GET /api/projects/[id]/similar", () => {
	it("returns 404 when project is not found", async () => {
		projectDocGet.mockResolvedValueOnce({exists: false});

		const res = await GET(makeRequest("999"), {
			params: Promise.resolve({id: "999"}),
		});

		expect(res.status).toBe(404);
		expect((await res.json()).error).toBe("Project not found");
	});

	it("scores by category match + shared tags, excludes current project, and caps at 4", async () => {
		projectDocGet.mockResolvedValueOnce({
			exists: true,
			data: () => baseProject,
		});

		supabaseIn.mockResolvedValueOnce({
			data: [
				baseProject, // excluded (current project)
				{
					numericId: 2,
					name: "Same Cat + 2 Tags",
					slug: "same-cat-2-tags",
					category: "DeFi",
					tags: "DEX, Soroban",
					status: "approved",
					featured: 0,
					user_id: 11,
					created_at: "2026-01-02T00:00:00Z",
				},
				{
					numericId: 3,
					name: "Same Cat Only",
					slug: "same-cat-only",
					category: "defi",
					tags: "lending",
					status: "approved",
					featured: 0,
					user_id: 12,
					created_at: "2026-01-03T00:00:00Z",
				},
				{
					numericId: 4,
					name: "Other Cat + 2 Tags",
					slug: "other-cat-2-tags",
					category: "payments",
					tags: "soroban, liquidity",
					status: "featured",
					featured: 1,
					user_id: 13,
					created_at: "2026-01-04T00:00:00Z",
				},
				{
					numericId: 5,
					name: "Other Cat + 1 Tag",
					slug: "other-cat-1-tag",
					category: "tools",
					tags: "dex",
					status: "approved",
					featured: 0,
					user_id: 14,
					created_at: "2026-01-05T00:00:00Z",
				},
				{
					numericId: 6,
					name: "Same Cat + 1 Tag",
					slug: "same-cat-1-tag",
					category: "defi",
					tags: "liquidity",
					status: "approved",
					featured: 0,
					user_id: 15,
					created_at: "2026-01-06T00:00:00Z",
				},
				{
					numericId: 7,
					name: "Unrelated",
					slug: "unrelated",
					category: "gaming",
					tags: "nft, metaverse",
					status: "approved",
					featured: 0,
					user_id: 16,
					created_at: "2026-01-07T00:00:00Z",
				},
			],
			error: null,
		});

		const res = await GET(makeRequest("1"), {
			params: Promise.resolve({id: "1"}),
		});

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.projects).toHaveLength(4);
		expect(body.projects.map((p: {id: number}) => p.id)).toEqual([2, 6, 3, 4]);
		expect(body.projects.some((p: {id: number}) => p.id === 1)).toBe(false);
		expect(body.projects.some((p: {id: number}) => p.id === 7)).toBe(false);
	});

	it("returns empty array when no projects match category or tags", async () => {
		projectSlugGet.mockResolvedValueOnce({
			empty: false,
			docs: [{data: () => baseProject}],
		});
		supabaseIn.mockResolvedValueOnce({
			data: [
				baseProject,
				{
					numericId: 8,
					name: "Completely Different",
					slug: "completely-different",
					category: "gaming",
					tags: "arcade",
					status: "approved",
					featured: 0,
					user_id: 18,
					created_at: "2026-01-08T00:00:00Z",
				},
			],
			error: null,
		});

		const res = await GET(makeRequest("current-defi"), {
			params: Promise.resolve({id: "current-defi"}),
		});

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.projects).toEqual([]);
	});
});
