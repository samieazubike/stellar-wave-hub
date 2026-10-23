import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function load(file, mocks = {}) {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
    },
  });
  const loaded = { exports: {} };
  const localRequire = (id) => {
    if (id in mocks) return mocks[id];
    if (id.startsWith("@/")) {
      return load(`src/${id.slice(2)}.ts`, mocks);
    }
    return require(id);
  };
  new Function("require", "module", "exports", outputText)(
    localRequire,
    loaded,
    loaded.exports,
  );
  return loaded.exports;
}

describe("Category Sponsors — Migration & Schema", () => {
  test("migration file exists matching YYYYMMDDHHMM_<name>.sql pattern", () => {
    const migrationsDir = path.join(root, "data", "supabase");
    const files = fs.readdirSync(migrationsDir);
    const categoryMigration = files.find(
      (f) => /^\d{12}_.*category.*\.sql$/i.test(f),
    );
    assert.ok(
      categoryMigration,
      "Expected migration file matching YYYYMMDDHHMM_<name>.sql for category sponsors",
    );

    const content = fs.readFileSync(path.join(migrationsDir, categoryMigration), "utf8");
    assert.match(content, /create table if not exists public\.category_sponsors/i);
    assert.match(content, /category text/i);
    assert.match(content, /project_id bigint/i);
    assert.match(content, /starts_at timestamptz/i);
    assert.match(content, /ends_at timestamptz/i);
    assert.match(content, /tx_hash text/i);
    assert.match(content, /create table if not exists public\.payments/i);
  });

  test("category_sponsors and payments are registered in firebase.ts collection map", () => {
    const firebaseSource = fs.readFileSync(path.join(root, "src", "lib", "firebase.ts"), "utf8");
    assert.match(firebaseSource, /category_sponsors:\s*["']category_sponsors["']/);
    assert.match(firebaseSource, /payments:\s*["']payments["']/);
  });
});

describe("Category Sponsors — Pricing", () => {
  test("defaults to 40 XLM when env variable is not set", () => {
    const oldEnv = process.env.NEXT_PUBLIC_PRICE_CATEGORY_SPONSOR_XLM;
    delete process.env.NEXT_PUBLIC_PRICE_CATEGORY_SPONSOR_XLM;
    try {
      const pricing = load("src/lib/pricing.ts");
      assert.equal(pricing.getCategorySponsorPriceXlm(), 40);
    } finally {
      if (oldEnv !== undefined) {
        process.env.NEXT_PUBLIC_PRICE_CATEGORY_SPONSOR_XLM = oldEnv;
      }
    }
  });

  test("uses NEXT_PUBLIC_PRICE_CATEGORY_SPONSOR_XLM when configured", () => {
    const oldEnv = process.env.NEXT_PUBLIC_PRICE_CATEGORY_SPONSOR_XLM;
    process.env.NEXT_PUBLIC_PRICE_CATEGORY_SPONSOR_XLM = "75";
    try {
      const pricing = load("src/lib/pricing.ts");
      assert.equal(pricing.getCategorySponsorPriceXlm(), 75);
    } finally {
      if (oldEnv !== undefined) {
        process.env.NEXT_PUBLIC_PRICE_CATEGORY_SPONSOR_XLM = oldEnv;
      } else {
        delete process.env.NEXT_PUBLIC_PRICE_CATEGORY_SPONSOR_XLM;
      }
    }
  });
});

describe("Category Sponsors — On-Chain Payment Verification (verifyStellarPayment)", () => {
  test("verifies successful payment, required amount, and memo via Horizon", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url) => {
      const urlStr = String(url);
      if (urlStr.includes("/transactions/tx_valid_123/operations")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            _embedded: {
              records: [
                {
                  type: "payment",
                  asset_type: "native",
                  amount: "45.0000000",
                  from: "GSENDER123",
                  to: "GRECIPIENT456",
                },
              ],
            },
          }),
        };
      }
      if (urlStr.includes("/transactions/tx_valid_123")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            successful: true,
            memo: "cat::defi",
            memo_type: "text",
            source_account: "GSENDER123",
            created_at: "2026-10-23T12:00:00Z",
          }),
        };
      }
      return { ok: false, status: 404, json: async () => ({}) };
    };

    try {
      const { verifyStellarPayment } = load("src/lib/payments.ts");
      const details = await verifyStellarPayment("tx_valid_123", {
        expectedAmount: 40,
        expectedMemo: "cat::defi",
      });

      assert.equal(details.successful, true);
      assert.equal(details.amount, 45);
      assert.equal(details.asset, "XLM");
      assert.equal(details.memo, "cat::defi");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("rejects when payment amount is below required price", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url) => {
      const urlStr = String(url);
      if (urlStr.includes("/operations")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            records: [
              {
                type: "payment",
                asset_type: "native",
                amount: "20.0000000",
                from: "GSENDER",
                to: "GRECIPIENT",
              },
            ],
          }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          successful: true,
          memo: "cat::defi",
        }),
      };
    };

    try {
      const { verifyStellarPayment } = load("src/lib/payments.ts");
      await assert.rejects(
        () =>
          verifyStellarPayment("tx_low_amount", {
            expectedAmount: 40,
          }),
        /Insufficient payment amount/i,
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("rejects when transaction failed on-chain", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        successful: false,
        memo: "cat::defi",
      }),
    });

    try {
      const { verifyStellarPayment } = load("src/lib/payments.ts");
      await assert.rejects(
        () => verifyStellarPayment("tx_failed"),
        /failed on-chain/i,
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe("POST /api/sponsors/category & GET /api/sponsors/category/[category]", () => {
  function createMockDb(initialState = {}) {
    const state = {
      projects: initialState.projects || [
        { numericId: 10, name: "StellarSwap", slug: "stellarswap", category: "defi" },
        { numericId: 20, name: "AssetBridge", slug: "assetbridge", category: "payments" },
      ],
      payments: initialState.payments || [],
      category_sponsors: initialState.category_sponsors || [],
    };

    const db = {
      state,
      from(table) {
        let filters = [];
        let orderField = null;
        let ascending = true;
        let limitVal = null;

        const chain = {
          select(fields) {
            return chain;
          },
          eq(field, val) {
            filters.push((row) => String(row[field]).toLowerCase() === String(val).toLowerCase());
            return chain;
          },
          gt(field, val) {
            filters.push((row) => new Date(row[field]).getTime() > new Date(val).getTime());
            return chain;
          },
          gte(field, val) {
            filters.push((row) => new Date(row[field]).getTime() >= new Date(val).getTime());
            return chain;
          },
          lt(field, val) {
            filters.push((row) => new Date(row[field]).getTime() < new Date(val).getTime());
            return chain;
          },
          lte(field, val) {
            filters.push((row) => new Date(row[field]).getTime() <= new Date(val).getTime());
            return chain;
          },
          order(field, opts = {}) {
            orderField = field;
            ascending = opts.ascending ?? true;
            return chain;
          },
          limit(n) {
            limitVal = n;
            return chain;
          },
          async maybeSingle() {
            let rows = (state[table] || []).filter((r) => filters.every((f) => f(r)));
            return { data: rows[0] || null, error: null };
          },
          async single() {
            let rows = (state[table] || []).filter((r) => filters.every((f) => f(r)));
            if (rows.length === 0) return { data: null, error: new Error("Row not found") };
            return { data: rows[0], error: null };
          },
          async then(resolve) {
            let rows = [...(state[table] || [])].filter((r) => filters.every((f) => f(r)));
            if (orderField) {
              rows.sort((a, b) => {
                const va = a[orderField];
                const vb = b[orderField];
                if (va < vb) return ascending ? -1 : 1;
                if (va > vb) return ascending ? 1 : -1;
                return 0;
              });
            }
            if (limitVal !== null) {
              rows = rows.slice(0, limitVal);
            }
            resolve({ data: rows, error: null });
          },
          insert(payload) {
            const rows = Array.isArray(payload) ? payload : [payload];
            for (const r of rows) {
              if (table === "payments" && state.payments.some((p) => p.tx_hash === r.tx_hash)) {
                return {
                  data: null,
                  error: { code: "23505", message: "unique constraint violation on tx_hash" },
                  select() { return this; },
                  single: async () => ({
                    data: null,
                    error: { code: "23505", message: "unique constraint violation on tx_hash" },
                  }),
                };
              }
              const newRow = { id: (state[table].length + 1), ...r, created_at: new Date().toISOString() };
              state[table].push(newRow);
            }
            return {
              data: state[table][state[table].length - 1],
              error: null,
              select() { return this; },
              single: async () => ({
                data: state[table][state[table].length - 1],
                error: null,
              }),
            };
          },
        };
        return chain;
      },
    };

    return db;
  }

  test("POST /api/sponsors/category verifies payment and books first free week", async () => {
    const mockDb = createMockDb();
    const mockPayments = {
      verifyStellarPayment: async (txHash, options) => {
        assert.equal(txHash, "tx_first_booking");
        return {
          txHash,
          amount: 40,
          successful: true,
          memo: "cat::defi",
        };
      },
    };

    const route = load("src/app/api/sponsors/category/route.ts", {
      "@/lib/firebase": { getSupabase: () => mockDb },
      "@/lib/payments": mockPayments,
      "@/lib/pricing": { getCategorySponsorPriceXlm: () => 40 },
    });

    const req = new Request("http://localhost:3000/api/sponsors/category", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: "defi",
        project_id: 10,
        tx_hash: "tx_first_booking",
      }),
    });

    const res = await route.POST(req);
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.sponsor.category, "defi");
    assert.equal(body.sponsor.project_id, 10);
    assert.equal(body.sponsor.tx_hash, "tx_first_booking");

    // Starts at now, ends 7 days later
    const startMs = new Date(body.sponsor.starts_at).getTime();
    const endMs = new Date(body.sponsor.ends_at).getTime();
    const diffDays = Math.round((endMs - startMs) / (24 * 60 * 60 * 1000));
    assert.equal(diffDays, 7);

    // Verify recorded in payments table
    assert.equal(mockDb.state.payments.length, 1);
    assert.equal(mockDb.state.payments[0].product, "category_sponsor");
    assert.equal(mockDb.state.payments[0].tx_hash, "tx_first_booking");
  });

  test("POST /api/sponsors/category books the NEXT free week when a week is already booked", async () => {
    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const mockDb = createMockDb({
      category_sponsors: [
        {
          id: 1,
          category: "defi",
          project_id: 10,
          starts_at: new Date().toISOString(),
          ends_at: weekFromNow,
          tx_hash: "tx_existing_booking",
        },
      ],
    });

    const mockPayments = {
      verifyStellarPayment: async () => ({
        txHash: "tx_second_booking",
        amount: 40,
        successful: true,
      }),
    };

    const route = load("src/app/api/sponsors/category/route.ts", {
      "@/lib/firebase": { getSupabase: () => mockDb },
      "@/lib/payments": mockPayments,
      "@/lib/pricing": { getCategorySponsorPriceXlm: () => 40 },
    });

    const req = new Request("http://localhost:3000/api/sponsors/category", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: "defi",
        project_id: 20,
        tx_hash: "tx_second_booking",
      }),
    });

    const res = await route.POST(req);
    assert.equal(res.status, 201);
    const body = await res.json();

    // Must start right when the first one ends
    assert.equal(new Date(body.sponsor.starts_at).toISOString(), new Date(weekFromNow).toISOString());
    const expectedEnd = new Date(new Date(weekFromNow).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    assert.equal(new Date(body.sponsor.ends_at).toISOString(), expectedEnd);
  });

  test("POST /api/sponsors/category rejects double-redemption of the same tx_hash", async () => {
    const mockDb = createMockDb({
      payments: [
        {
          id: 1,
          tx_hash: "tx_already_used",
          product: "category_sponsor",
          amount: 40,
        },
      ],
    });

    const route = load("src/app/api/sponsors/category/route.ts", {
      "@/lib/firebase": { getSupabase: () => mockDb },
      "@/lib/payments": { verifyStellarPayment: async () => ({ successful: true }) },
      "@/lib/pricing": { getCategorySponsorPriceXlm: () => 40 },
    });

    const req = new Request("http://localhost:3000/api/sponsors/category", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: "defi",
        project_id: 10,
        tx_hash: "tx_already_used",
      }),
    });

    const res = await route.POST(req);
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.match(body.error, /already been redeemed/i);
  });

  test("POST /api/sponsors/category rejects non-existent project", async () => {
    const mockDb = createMockDb();
    const route = load("src/app/api/sponsors/category/route.ts", {
      "@/lib/firebase": { getSupabase: () => mockDb },
      "@/lib/payments": { verifyStellarPayment: async () => ({ successful: true }) },
      "@/lib/pricing": { getCategorySponsorPriceXlm: () => 40 },
    });

    const req = new Request("http://localhost:3000/api/sponsors/category", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: "defi",
        project_id: 9999,
        tx_hash: "tx_some_hash",
      }),
    });

    const res = await route.POST(req);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.match(body.error, /project not found/i);
  });

  test("POST /api/sponsors/category rejects when payment verification fails", async () => {
    const mockDb = createMockDb();
    const route = load("src/app/api/sponsors/category/route.ts", {
      "@/lib/firebase": { getSupabase: () => mockDb },
      "@/lib/payments": {
        verifyStellarPayment: async () => {
          throw new Error("Transaction memo does not match required format");
        },
      },
      "@/lib/pricing": { getCategorySponsorPriceXlm: () => 40 },
    });

    const req = new Request("http://localhost:3000/api/sponsors/category", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: "defi",
        project_id: 10,
        tx_hash: "tx_bad_memo",
      }),
    });

    const res = await route.POST(req);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.error, /memo/i);
  });

  test("POST /api/sponsors/category rejects overlapping explicit slot (double-booking)", async () => {
    const activeStart = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const activeEnd = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();

    const mockDb = createMockDb({
      category_sponsors: [
        {
          id: 1,
          category: "defi",
          project_id: 10,
          starts_at: activeStart,
          ends_at: activeEnd,
          tx_hash: "tx_booked",
        },
      ],
    });

    const route = load("src/app/api/sponsors/category/route.ts", {
      "@/lib/firebase": { getSupabase: () => mockDb },
      "@/lib/payments": { verifyStellarPayment: async () => ({ successful: true, amount: 40 }) },
      "@/lib/pricing": { getCategorySponsorPriceXlm: () => 40 },
    });

    // Try to book a slot that overlaps with the active booking
    const overlappingStart = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString();
    const req = new Request("http://localhost:3000/api/sponsors/category", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: "defi",
        project_id: 20,
        tx_hash: "tx_overlapping_slot",
        starts_at: overlappingStart,
      }),
    });

    const res = await route.POST(req);
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.match(body.error, /double-booking/i);
  });

  test("GET /api/sponsors/category/[category] returns current active sponsor with project details", async () => {
    const activeStart = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const activeEnd = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();

    const mockDb = createMockDb({
      category_sponsors: [
        {
          id: 1,
          category: "defi",
          project_id: 10,
          starts_at: activeStart,
          ends_at: activeEnd,
          tx_hash: "tx_active_123",
        },
      ],
    });

    const categoryRoute = load("src/app/api/sponsors/category/[category]/route.ts", {
      "@/lib/firebase": { getSupabase: () => mockDb },
    });

    const res = await categoryRoute.GET(new Request("http://localhost:3000/api/sponsors/category/defi"), {
      params: Promise.resolve({ category: "defi" }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.sponsor);
    assert.equal(body.sponsor.category, "defi");
    assert.equal(body.sponsor.project_id, 10);
    assert.equal(body.sponsor.project.name, "StellarSwap");
  });

  test("GET /api/sponsors/category/[category] returns { sponsor: null } when no sponsor is active", async () => {
    // Expired sponsor
    const pastStart = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const pastEnd = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const mockDb = createMockDb({
      category_sponsors: [
        {
          id: 1,
          category: "defi",
          project_id: 10,
          starts_at: pastStart,
          ends_at: pastEnd,
          tx_hash: "tx_expired",
        },
      ],
    });

    const categoryRoute = load("src/app/api/sponsors/category/[category]/route.ts", {
      "@/lib/firebase": { getSupabase: () => mockDb },
    });

    const res = await categoryRoute.GET(new Request("http://localhost:3000/api/sponsors/category/defi"), {
      params: Promise.resolve({ category: "defi" }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.sponsor, null);
  });
});
