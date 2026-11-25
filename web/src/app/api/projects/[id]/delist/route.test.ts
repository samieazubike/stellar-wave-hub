import { describe, expect, it, vi, beforeEach } from "vitest";
import { signToken } from "@/lib/auth";
import { PUT } from "./route";

const mockInitialData = {
  numericId: 10,
  user_id: 1,
  name: "Stellar Project",
  status: "approved",
  featured: 1,
  rejection_reason: null,
  updated_at: "2026-10-20T00:00:00.000Z",
};

let currentProjectData = { ...mockInitialData };

const mockDoc = {
  exists: true,
  data: vi.fn(() => currentProjectData),
};

const mockDocRef = {
  get: vi.fn().mockImplementation(async () => ({
    exists: mockDoc.exists,
    data: () => currentProjectData,
  })),
  update: vi.fn().mockImplementation(async (updates: Record<string, unknown>) => {
    currentProjectData = {
      ...currentProjectData,
      ...updates,
    };
  }),
};

const mockLogModerationAction = vi.fn().mockResolvedValue(undefined);
const mockCreateNotification = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/db", () => ({
  projectsCol: {
    ref: {
      doc: vi.fn(() => mockDocRef),
    },
  },
  logModerationAction: (...args: unknown[]) => mockLogModerationAction(...args),
  createNotification: (...args: unknown[]) => mockCreateNotification(...args),
}));

describe("PUT /api/projects/[id]/delist - Role Access & Delist Moderation", () => {
  const params = { params: Promise.resolve({ id: "10" }) };

  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.exists = true;
    currentProjectData = { ...mockInitialData };
  });

  // Tokens for different roles
  // Project owner has userId: 1 and role: "contributor"
  const ownerToken = signToken({ userId: 1, role: "contributor" });
  // Non-owner contributor has userId: 2 and role: "contributor"
  const contributorToken = signToken({ userId: 2, role: "contributor" });
  // Maintainer has userId: 3 and role: "maintainer"
  const maintainerToken = signToken({ userId: 3, role: "maintainer" });
  // Admin has userId: 4 and role: "admin"
  const adminToken = signToken({ userId: 4, role: "admin" });

  it("denies anonymous requests with 403 Forbidden", async () => {
    const req = new Request("http://localhost/api/projects/10/delist", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Policy violation" }),
    });
    const res = await PUT(req, params);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Forbidden");
    expect(mockDocRef.get).not.toHaveBeenCalled();
  });

  it("denies contributor (non-owner) requests with 403 Forbidden", async () => {
    const req = new Request("http://localhost/api/projects/10/delist", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${contributorToken}`,
      },
      body: JSON.stringify({ reason: "Policy violation" }),
    });
    const res = await PUT(req, params);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Forbidden");
    expect(mockDocRef.get).not.toHaveBeenCalled();
  });

  it("denies project owner requests with 403 Forbidden (owner cannot delist own project)", async () => {
    // Project owner is authenticated (userId: 1, role: contributor)
    // Delist route enforces admin-only access, so even the owner cannot delist
    const req = new Request("http://localhost/api/projects/10/delist", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ reason: "Self delist" }),
    });
    const res = await PUT(req, params);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Forbidden");
    expect(mockDocRef.get).not.toHaveBeenCalled();
  });

  it("denies maintainer requests with 403 Forbidden", async () => {
    const req = new Request("http://localhost/api/projects/10/delist", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${maintainerToken}`,
      },
      body: JSON.stringify({ reason: "Maintainer delist" }),
    });
    const res = await PUT(req, params);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Forbidden");
    expect(mockDocRef.get).not.toHaveBeenCalled();
  });

  it("returns 404 for admin when project does not exist", async () => {
    mockDoc.exists = false;

    const req = new Request("http://localhost/api/projects/999/delist", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ reason: "Non-existent project" }),
    });
    const res = await PUT(req, { params: Promise.resolve({ id: "999" }) });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Project not found");
    expect(mockDocRef.update).not.toHaveBeenCalled();
  });

  it("returns 400 for admin when payload is invalid", async () => {
    const req = new Request("http://localhost/api/projects/10/delist", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ reason: 12345 }), // reason must be string
    });
    const res = await PUT(req, params);
    expect(res.status).toBe(400);
    expect(mockDocRef.update).not.toHaveBeenCalled();
  });

  it("allows admin to delist with custom reason", async () => {
    const req = new Request("http://localhost/api/projects/10/delist", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ reason: "Terms of service violation" }),
    });
    const res = await PUT(req, params);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.project.status).toBe("delisted");
    expect(body.project.featured).toBe(0);
    expect(body.project.rejection_reason).toBe("Terms of service violation");

    expect(mockDocRef.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "delisted",
        featured: 0,
        rejection_reason: "Terms of service violation",
      }),
    );
    expect(mockLogModerationAction).toHaveBeenCalledWith({
      actor_id: 4,
      action: "delist",
      project_id: 10,
      reason: "Terms of service violation",
    });
    expect(mockCreateNotification).toHaveBeenCalledWith({
      user_id: 1,
      project_id: 10,
      project_name: "Stellar Project",
      status: "delisted",
      message: 'Your project "Stellar Project" has been delisted. Reason: Terms of service violation',
    });
  });

  it("allows admin to delist without reason and uses default reason", async () => {
    const req = new Request("http://localhost/api/projects/10/delist", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({}),
    });
    const res = await PUT(req, params);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.project.status).toBe("delisted");
    expect(body.project.rejection_reason).toBe("Delisted by admin");

    expect(mockLogModerationAction).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: "Delisted by admin",
      }),
    );
  });
});
