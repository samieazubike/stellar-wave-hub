import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { query, from } = vi.hoisted(() => {
  const query = {
    select: vi.fn(), eq: vi.fn(), is: vi.fn(), maybeSingle: vi.fn(), update: vi.fn(),
  };
  return { query, from: vi.fn() };
});
vi.mock("@/lib/firebase", () => ({ getSupabase: () => ({ from }) }));

import { createApiKey, verifyApiKey } from "./api-keys";

beforeEach(() => {
  vi.clearAllMocks();
  from.mockReturnValue(query);
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.is.mockReturnValue(query);
  query.update.mockReturnValue(query);
  query.maybeSingle.mockResolvedValue({ data: { id: 7 }, error: null });
});

describe("API key security", () => {
  it("generates a random key whose stored hash differs from the plaintext", () => {
    const first = createApiKey();
    const second = createApiKey();
    expect(first.key).toMatch(/^swh_[a-f0-9]{64}$/);
    expect(first.key).not.toBe(second.key);
    expect(first.keyHash).toBe(createHash("sha256").update(first.key).digest("hex"));
    expect(first.keyHash).not.toContain(first.key);
  });

  it("looks up only active hashes and rejects revoked keys", async () => {
    const { key, keyHash } = createApiKey();
    const validRequest = new Request("http://localhost/api/v1/projects", { headers: { "X-API-Key": key } });
    expect(await verifyApiKey(validRequest)).toBe(true);
    expect(query.eq).toHaveBeenCalledWith("key_hash", keyHash);
    expect(query.is).toHaveBeenCalledWith("revoked_at", null);

    query.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    expect(await verifyApiKey(validRequest)).toBe(false);
  });
});
