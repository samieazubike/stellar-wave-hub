import { beforeEach, describe, expect, it, vi } from "vitest";

const { query, from, authUser } = vi.hoisted(() => {
  const query = {
    select: vi.fn(), eq: vi.fn(), is: vi.fn(), order: vi.fn(),
    insert: vi.fn(), update: vi.fn(), single: vi.fn(), maybeSingle: vi.fn(),
  };
  return { query, from: vi.fn(), authUser: vi.fn() };
});
vi.mock("@/lib/auth", () => ({ getAuthUser: authUser }));
vi.mock("@/lib/api-keys", () => ({
  createApiKey: () => ({ key: "swh_secret", keyHash: "hashed-secret", prefix: "swh_se" }),
}));
vi.mock("@/lib/firebase", () => ({ getSupabase: () => ({ from }) }));

import { DELETE, GET, POST } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  authUser.mockReturnValue({ userId: 7, role: "contributor" });
  from.mockReturnValue(query);
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.is.mockReturnValue(query);
  query.insert.mockReturnValue(query);
  query.update.mockReturnValue(query);
  query.single.mockResolvedValue({ data: { id: 1, name: "Website", prefix: "swh_se", tier: "free" }, error: null });
  query.order.mockResolvedValue({ data: [{ id: 1, prefix: "swh_se", revoked_at: null }], error: null });
  query.maybeSingle.mockResolvedValue({ data: { id: 1 }, error: null });
});

describe("API key issuance", () => {
  it("returns plaintext only on creation and stores its hash", async () => {
    const response = await POST(new Request("http://localhost/api/keys", {
      method: "POST", body: JSON.stringify({ name: "Website" }),
    }));
    expect(response.status).toBe(201);
    expect((await response.json()).key).toBe("swh_secret");
    expect(query.insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: 7, key_hash: "hashed-secret" }));
    expect(JSON.stringify(query.insert.mock.calls[0][0])).not.toContain("swh_secret");

    const listed = await GET(new Request("http://localhost/api/keys"));
    expect(JSON.stringify(await listed.json())).not.toContain("swh_secret");
  });

  it("revokes only a key owned by the current user", async () => {
    const response = await DELETE(new Request("http://localhost/api/keys?id=1", { method: "DELETE" }));
    expect(response.status).toBe(200);
    expect(query.eq).toHaveBeenCalledWith("user_id", 7);
    expect(query.update).toHaveBeenCalledWith({ revoked_at: expect.any(String) });
  });
});
