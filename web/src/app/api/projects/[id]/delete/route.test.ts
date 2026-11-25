import { describe, expect, it, vi, beforeEach } from "vitest";
import { signToken } from "@/lib/auth";
import { DELETE } from "./route";

const mockBatch = {
  delete: vi.fn(),
  commit: vi.fn().mockResolvedValue(undefined),
};

const mockDoc = {
  exists: true,
  data: vi.fn(() => ({
    numericId: 10,
    user_id: 1,
    name: "Stellar Project",
  })),
};

const mockDocRef = {
  get: vi.fn().mockResolvedValue(mockDoc),
};

const mockRatingsSnap = {
  docs: [
    { ref: { id: "rating-1" } },
    { ref: { id: "rating-2" } },
  ],
};

const mockRatingsWhere = {
  get: vi.fn().mockResolvedValue(mockRatingsSnap),
};

const mockLogModerationAction = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/db", () => ({
  projectsCol: {
    ref: {
      doc: vi.fn(() => mockDocRef),
      firestore: {
        batch: vi.fn(() => mockBatch),
      },
    },
  },
  ratingsCol: {
    ref: {
      where: vi.fn(() => mockRatingsWhere),
    },
  },
  logModerationAction: (...args: unknown[]) => mockLogModerationAction(...args),
}));

describe("DELETE /api/projects/[id]/delete - Role Access & Destruction", () => {
  const params = { params: Promise.resolve({ id: "10" }) };

  beforeEach(() => {
    vi.clearAllMocks();
    mockDoc.exists = true;
    mockDocRef.get.mockResolvedValue(mockDoc);
    mockRatingsWhere.get.mockResolvedValue(mockRatingsSnap);
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
    const req = new Request("http://localhost/api/projects/10/delete", {
      method: "DELETE",
    });
    const res = await DELETE(req, params);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Forbidden");
    expect(mockDocRef.get).not.toHaveBeenCalled();
  });

  it("denies contributor (non-owner) requests with 403 Forbidden", async () => {
    const req = new Request("http://localhost/api/projects/10/delete", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${contributorToken}` },
    });
    const res = await DELETE(req, params);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Forbidden");
    expect(mockDocRef.get).not.toHaveBeenCalled();
  });

  it("denies project owner requests with 403 Forbidden (owner cannot delete own project)", async () => {
    // Project owner is authenticated (userId: 1, role: contributor)
    // The route enforces hasMinRole(auth.role, 'admin'), so even the project owner cannot delete it
    const req = new Request("http://localhost/api/projects/10/delete", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const res = await DELETE(req, params);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Forbidden");
    expect(mockDocRef.get).not.toHaveBeenCalled();
  });

  it("denies maintainer requests with 403 Forbidden", async () => {
    const req = new Request("http://localhost/api/projects/10/delete", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${maintainerToken}` },
    });
    const res = await DELETE(req, params);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Forbidden");
    expect(mockDocRef.get).not.toHaveBeenCalled();
  });

  it("allows admin to delete the project and cascades ratings", async () => {
    const req = new Request("http://localhost/api/projects/10/delete", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const res = await DELETE(req, params);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBe("Project deleted");

    expect(mockDocRef.get).toHaveBeenCalled();
    expect(mockRatingsWhere.get).toHaveBeenCalled();
    expect(mockBatch.delete).toHaveBeenCalledTimes(3); // 2 ratings + 1 project
    expect(mockBatch.commit).toHaveBeenCalled();
    expect(mockLogModerationAction).toHaveBeenCalledWith({
      actor_id: 4,
      action: "delete",
      project_id: 10,
    });
  });

  it("returns 404 for admin when project does not exist", async () => {
    mockDoc.exists = false;
    mockDocRef.get.mockResolvedValue({ exists: false });

    const req = new Request("http://localhost/api/projects/999/delete", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const res = await DELETE(req, { params: Promise.resolve({ id: "999" }) });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Project not found");
    expect(mockBatch.commit).not.toHaveBeenCalled();
  });
});
