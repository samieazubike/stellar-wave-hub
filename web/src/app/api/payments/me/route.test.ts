import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { signToken } from "@/lib/auth";

const { supabaseState } = vi.hoisted(() => ({
  supabaseState: {
    payments: [] as Array<Record<string, unknown>>,
    projects: [] as Array<Record<string, unknown>>,
  },
}));

vi.mock("@/lib/firebase", () => ({
  default: {
    collection: () => ({
      where: () => ({
        get: async () => ({ empty: true, docs: [] }),
      }),
    }),
  },
  getSupabase: () => ({
    from: (table: string) => {
      if (table === "payments") {
        return {
          select: () => ({
            eq: (field: string, value: unknown) => ({
              order: () => {
                const filtered = supabaseState.payments.filter(
                  (row) => row[field] === value,
                );
                return Promise.resolve({ data: filtered, error: null });
              },
            }),
          }),
        };
      }
      if (table === "projects") {
        return {
          select: () => ({
            in: (field: string, values: unknown[]) => {
              const filtered = supabaseState.projects.filter((p) =>
                values.includes(p[field]),
              );
              return Promise.resolve({ data: filtered, error: null });
            },
          }),
        };
      }
      return {
        select: () => Promise.resolve({ data: [], error: null }),
      };
    },
  }),
}));

describe("GET /api/payments/me", () => {
  beforeEach(() => {
    supabaseState.payments = [];
    supabaseState.projects = [];
  });

  it("returns 401 when Authorization header is missing", async () => {
    const request = new Request("http://localhost:3000/api/payments/me");
    const res = await GET(request);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 401 when token is invalid", async () => {
    const request = new Request("http://localhost:3000/api/payments/me", {
      headers: { Authorization: "Bearer invalid-token-string" },
    });
    const res = await GET(request);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns only the payments belonging to the authenticated user", async () => {
    const user1Token = signToken({ userId: 101, role: "user" });

    supabaseState.payments = [
      {
        id: 1,
        tx_hash: "tx1111111111111111111111111111111111111111111111111111111111111111",
        product: "spotlight",
        user_id: 101,
        project_id: 5,
        amount: 50,
        duration_days: 30,
        source_address: "GBUSER1",
        destination_address: "GBDEST",
        network: "mainnet",
        created_at: "2026-11-20T10:00:00.000Z",
      },
      {
        id: 2,
        tx_hash: "tx2222222222222222222222222222222222222222222222222222222222222222",
        product: "spotlight",
        user_id: 999, // Another user!
        project_id: 8,
        amount: 15,
        duration_days: 7,
        source_address: "GBUSEROTHER",
        destination_address: "GBDEST",
        network: "mainnet",
        created_at: "2026-11-21T10:00:00.000Z",
      },
    ];

    supabaseState.projects = [
      { numericId: 5, name: "Stellar Lumen Wave", slug: "stellar-lumen-wave" },
      { numericId: 8, name: "Other Project", slug: "other-project" },
    ];

    const request = new Request("http://localhost:3000/api/payments/me", {
      headers: { Authorization: `Bearer ${user1Token}` },
    });

    const res = await GET(request);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.payments).toBeDefined();
    expect(body.payments.length).toBe(1);
    expect(body.payments[0].id).toBe(1);
    expect(body.payments[0].project_id).toBe(5);
    expect(body.payments[0].project_name).toBe("Stellar Lumen Wave");
    expect(body.payments[0].project_slug).toBe("stellar-lumen-wave");
    expect(body.payments[0].amount).toBe(50);
    expect(body.payments[0].receipt_url).toBe(
      "https://stellar.expert/explorer/public/tx/tx1111111111111111111111111111111111111111111111111111111111111111",
    );
  });

  it("handles testnet explorer URLs correctly", async () => {
    const user1Token = signToken({ userId: 101, role: "user" });

    supabaseState.payments = [
      {
        id: 1,
        tx_hash: "tx_testnet_hash",
        product: "spotlight",
        user_id: 101,
        project_id: 5,
        amount: 15,
        duration_days: 7,
        source_address: "GBUSER1",
        destination_address: "GBDEST",
        network: "testnet",
        created_at: "2026-11-20T10:00:00.000Z",
      },
    ];

    const request = new Request("http://localhost:3000/api/payments/me", {
      headers: { Authorization: `Bearer ${user1Token}` },
    });

    const res = await GET(request);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.payments[0].receipt_url).toBe(
      "https://stellar.expert/explorer/testnet/tx/tx_testnet_hash",
    );
  });

  it("returns empty array if user has no payments", async () => {
    const userToken = signToken({ userId: 202, role: "user" });

    const request = new Request("http://localhost:3000/api/payments/me", {
      headers: { Authorization: `Bearer ${userToken}` },
    });

    const res = await GET(request);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.payments).toEqual([]);
  });
});
