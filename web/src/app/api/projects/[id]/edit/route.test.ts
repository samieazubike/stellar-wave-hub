import { describe, expect, it, vi, beforeEach } from "vitest";
import { signToken } from "@/lib/auth";
import { PUT } from "./route";

const mockInitialProject = {
  numericId: 10,
  user_id: 1,
  name: "Initial Project",
  description: "Initial Description",
  category: "defi",
  tags: "dex,stellar",
  stellar_account_id: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
  owner_verified_at: "2026-10-15T00:00:00.000Z",
  owner_verified_address: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
  status: "submitted",
  updated_at: "2026-10-20T00:00:00.000Z",
};

let currentProject = { ...mockInitialProject };

const mockDoc = {
  exists: true,
  data: vi.fn(() => currentProject),
};

const mockDocRef = {
  get: vi.fn().mockImplementation(async () => ({
    exists: mockDoc.exists,
    data: () => currentProject,
  })),
};

vi.mock("@/lib/db", () => ({
  projectsCol: {
    ref: {
      doc: vi.fn(() => mockDocRef),
    },
  },
}));

let mockSupabaseUpdatedResult: Record<string, unknown> | null = null;
let mockSupabaseError: unknown = null;
let lastSupabaseUpdates: Record<string, unknown> | null = null;

const mockQueryBuilder = {
  update: vi.fn().mockImplementation((updates: Record<string, unknown>) => {
    lastSupabaseUpdates = updates;
    return mockQueryBuilder;
  }),
  eq: vi.fn().mockImplementation(() => mockQueryBuilder),
  select: vi.fn().mockImplementation(() => mockQueryBuilder),
  maybeSingle: vi.fn().mockImplementation(async () => ({
    data: mockSupabaseUpdatedResult,
    error: mockSupabaseError,
  })),
};

vi.mock("@/lib/firebase", () => ({
  getSupabase: () => ({
    from: vi.fn(() => mockQueryBuilder),
  }),
}));

const mockRevalidateCache = vi.fn();
vi.mock("@/lib/public-project-cache", () => ({
  revalidatePublicProjectCache: () => mockRevalidateCache(),
}));

describe("PUT /api/projects/[id]/edit - Role Access & Project Owner Edit", () => {
  const params = { params: Promise.resolve({ id: "10" }) };

  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.exists = true;
    currentProject = { ...mockInitialProject };
    mockSupabaseError = null;
    lastSupabaseUpdates = null;
    mockSupabaseUpdatedResult = {
      ...mockInitialProject,
      name: "Updated Project",
      updated_at: "2026-10-23T12:00:00.000Z",
    };
  });

  // Role tokens:
  // Owner: userId matches project.user_id (1), role: "contributor"
  const ownerToken = signToken({ userId: 1, role: "contributor" });
  // Non-owner contributor: userId (2) !== project.user_id (1), role: "contributor"
  const contributorToken = signToken({ userId: 2, role: "contributor" });
  // Maintainer: userId (3) !== project.user_id (1), role: "maintainer"
  const maintainerToken = signToken({ userId: 3, role: "maintainer" });
  // Admin: userId (4), role: "admin"
  const adminToken = signToken({ userId: 4, role: "admin" });

  it("denies anonymous requests with 401 Unauthorized", async () => {
    const req = new Request("http://localhost/api/projects/10/edit", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Name" }),
    });
    const res = await PUT(req, params);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
    expect(mockDocRef.get).not.toHaveBeenCalled();
  });

  it("returns 404 for authenticated requests when project does not exist", async () => {
    mockDoc.exists = false;

    const req = new Request("http://localhost/api/projects/999/edit", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ name: "New Name" }),
    });
    const res = await PUT(req, { params: Promise.resolve({ id: "999" }) });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Project not found");
  });

  it("denies contributor (non-owner) requests with 403 Forbidden", async () => {
    const req = new Request("http://localhost/api/projects/10/edit", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${contributorToken}`,
      },
      body: JSON.stringify({ name: "Hacked Name" }),
    });
    const res = await PUT(req, params);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Forbidden");
    expect(mockQueryBuilder.update).not.toHaveBeenCalled();
  });

  describe("Owner Access", () => {
    it("allows owner to edit their own project", async () => {
      mockSupabaseUpdatedResult = {
        ...mockInitialProject,
        name: "Owner Edited Name",
        description: "New description by owner",
      };

      const req = new Request("http://localhost/api/projects/10/edit", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({
          name: "Owner Edited Name",
          description: "New description by owner",
        }),
      });
      const res = await PUT(req, params);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.project.name).toBe("Owner Edited Name");
      expect(mockRevalidateCache).toHaveBeenCalled();
    });

    it("allows owner to edit even when project status is approved (not submitted)", async () => {
      currentProject = {
        ...mockInitialProject,
        status: "approved",
      };
      mockSupabaseUpdatedResult = {
        ...currentProject,
        description: "Owner update to approved project",
      };

      const req = new Request("http://localhost/api/projects/10/edit", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({ description: "Owner update to approved project" }),
      });
      const res = await PUT(req, params);
      expect(res.status).toBe(200);
    });

    it("resets owner verification when owner changes stellar_account_id", async () => {
      const newAccount = "GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBWHF";
      mockSupabaseUpdatedResult = {
        ...mockInitialProject,
        stellar_account_id: newAccount,
        owner_verified_at: null,
        owner_verified_address: null,
      };

      const req = new Request("http://localhost/api/projects/10/edit", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({ stellar_account_id: newAccount }),
      });
      const res = await PUT(req, params);
      expect(res.status).toBe(200);
      expect(lastSupabaseUpdates).toMatchObject({
        stellar_account_id: newAccount,
        owner_verified_at: null,
        owner_verified_address: null,
      });
    });

    it("returns 400 for owner on empty update payload", async () => {
      const req = new Request("http://localhost/api/projects/10/edit", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({}),
      });
      const res = await PUT(req, params);
      expect(res.status).toBe(400);
      expect(mockQueryBuilder.update).not.toHaveBeenCalled();
    });
  });

  describe("Maintainer Access", () => {
    it("allows maintainer to edit category and tags when project status is submitted", async () => {
      currentProject = { ...mockInitialProject, status: "submitted" };
      mockSupabaseUpdatedResult = {
        ...currentProject,
        category: "payments",
        tags: "payments,stellar",
      };

      const req = new Request("http://localhost/api/projects/10/edit", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${maintainerToken}`,
        },
        body: JSON.stringify({ category: "payments", tags: "payments,stellar" }),
      });
      const res = await PUT(req, params);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.project.category).toBe("payments");
    });

    it("denies maintainer from editing restricted fields (e.g. name)", async () => {
      currentProject = { ...mockInitialProject, status: "submitted" };

      const req = new Request("http://localhost/api/projects/10/edit", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${maintainerToken}`,
        },
        body: JSON.stringify({ name: "Maintainer Renamed" }),
      });
      const res = await PUT(req, params);
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe("Forbidden");
      expect(mockQueryBuilder.update).not.toHaveBeenCalled();
    });

    it("denies maintainer from editing even category/tags when status is not submitted", async () => {
      currentProject = { ...mockInitialProject, status: "approved" };

      const req = new Request("http://localhost/api/projects/10/edit", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${maintainerToken}`,
        },
        body: JSON.stringify({ category: "payments" }),
      });
      const res = await PUT(req, params);
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe("Forbidden");
      expect(mockQueryBuilder.update).not.toHaveBeenCalled();
    });
  });

  describe("Admin Access", () => {
    it("allows admin to edit any field on any project regardless of status", async () => {
      currentProject = { ...mockInitialProject, status: "approved" };
      mockSupabaseUpdatedResult = {
        ...currentProject,
        name: "Admin Renamed Project",
        category: "infrastructure",
      };

      const req = new Request("http://localhost/api/projects/10/edit", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: "Admin Renamed Project",
          category: "infrastructure",
        }),
      });
      const res = await PUT(req, params);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.project.name).toBe("Admin Renamed Project");
    });

    it("returns 400 for admin on empty payload", async () => {
      const req = new Request("http://localhost/api/projects/10/edit", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({}),
      });
      const res = await PUT(req, params);
      expect(res.status).toBe(400);
      expect(mockQueryBuilder.update).not.toHaveBeenCalled();
    });
  });

  describe("Concurrency conflict", () => {
    it("returns 409 Conflict if project changed while saving", async () => {
      mockSupabaseUpdatedResult = null; // concurrency mismatch caused maybeSingle to find 0 rows

      const req = new Request("http://localhost/api/projects/10/edit", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify({ name: "Updated Name" }),
      });
      const res = await PUT(req, params);
      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.error).toContain("Project changed while saving");
    });
  });
});
