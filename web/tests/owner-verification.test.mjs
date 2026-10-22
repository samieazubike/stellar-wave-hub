import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { Account, BASE_FEE, Keypair, Networks, Operation, TransactionBuilder } from "@stellar/stellar-sdk";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function load(file, mocks = {}) {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX },
  });
  const loaded = { exports: {} };
  const localRequire = (id) => {
    if (id in mocks) return mocks[id];
    if (id.startsWith("@/")) return load(`src/${id.slice(2)}.ts`, mocks);
    return require(id);
  };
  new Function("require", "module", "exports", outputText)(localRequire, loaded, loaded.exports);
  return loaded.exports;
}

const owner = Keypair.random();
const other = Keypair.random();
function challenge(key = owner, projectId = "7", name) {
  const server = Keypair.random();
  const tx = new TransactionBuilder(new Account(server.publicKey(), "0"), {
    fee: BASE_FEE, networkPassphrase: Networks.TESTNET,
  }).addOperation(Operation.manageData({
    name: name ?? `stellar_wave_hub_verify_owner:${projectId}`, value: "nonce", source: key.publicKey(),
  })).setTimeout(300).build();
  tx.sign(server);
  return tx;
}

function setup() {
  const tx = challenge();
  const state = {
    auth: { userId: 12, role: "contributor" },
    project: { numericId: 7, user_id: 12, stellar_account_id: owner.publicKey(), updated_at: "2026-10-20T00:00:00.000Z", owner_verified_at: null, owner_verified_address: null },
    challenge: { publicKey: owner.publicKey(), challenge: tx.toXDR(), expires_at: Date.now() + 300000 },
    beforeDelete: null,
    beforeUpdate: null,
  };
  tx.sign(owner);
  const snapshot = (value) => ({ exists: !!value, data: () => value ? { ...value } : undefined });
  const db = { from(table) {
    const filters = [];
    let action, values;
    return {
      delete() { action = "delete"; return this; },
      update(value) { action = "update"; values = value; return this; },
      eq(key, value) { filters.push((row) => row[key] === value); return this; },
      gt(key, value) { filters.push((row) => row[key] > value); return this; },
      select() { return this; },
      async maybeSingle() {
        if (action === "delete") state.beforeDelete?.();
        if (action === "update") state.beforeUpdate?.();
        const key = table === "projects" ? "project" : "challenge";
        const row = state[key];
        if (!row || !filters.every((filter) => filter(row))) return { data: null, error: null };
        if (action === "delete") state[key] = null;
        if (action === "update") state[key] = { ...row, ...values };
        return { data: action === "update" ? { ...state[key] } : { ...row }, error: null };
      },
    };
  } };
  const mocks = {
    "@/lib/auth": { getAuthUser: () => state.auth, hasMinRole: (role) => role === "admin" },
    "@/lib/public-project-cache": { revalidatePublicProjectCache: () => {} },
    "@/lib/db": { projectsCol: { ref: { doc: () => ({ get: async () => snapshot(state.project) }) } } },
    "@/lib/firebase": { __esModule: true, getSupabase: () => db, default: {
      collection: () => ({ doc: () => ({ get: async () => snapshot(state.challenge) }) }),
    } },
  };
  const { POST } = load("src/app/api/projects/[id]/verify-owner/route.ts", mocks);
  const { PUT } = load("src/app/api/projects/[id]/edit/route.ts", mocks);
  const request = (method, body) => new Request("http://localhost/api/projects/7", {
    method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  return {
    state, tx,
    verify: (body = { publicKey: owner.publicKey(), signedXdr: tx.toXDR() }) => POST(request("POST", body), { params: Promise.resolve({ id: "7" }) }),
    edit: (body) => PUT(request("PUT", body), { params: Promise.resolve({ id: "7" }) }),
  };
}

test("correct signature records both verified fields and consumes the challenge", async () => {
  const { verify, state } = setup();
  const response = await verify();
  assert.equal(response.status, 200);
  assert.equal((await response.json()).project.owner_verified_address, owner.publicKey());
  assert.ok(Date.parse(state.project.owner_verified_at));
  assert.equal(state.challenge, null);
  assert.equal((await verify()).status, 400);
});

test("wrong claimed wallet and wrong signing key fail without modifying state", async () => {
  const { verify, state } = setup();
  assert.equal((await verify({ publicKey: other.publicKey(), signedXdr: "invalid" })).status, 400);
  const tx = TransactionBuilder.fromXDR(state.challenge.challenge, Networks.TESTNET);
  tx.sign(other);
  const response = await verify({ publicKey: owner.publicKey(), signedXdr: tx.toXDR() });
  assert.equal(response.status, 401);
  assert.match((await response.json()).error, /signature/);
  assert.equal(state.project.owner_verified_at, null);
  assert.ok(state.challenge);
});

test("rejects missing auth, non-owners (including admins), and missing projects", async () => {
  const { verify, state } = setup();
  state.auth = null;
  assert.equal((await verify()).status, 401);
  state.auth = { userId: 99, role: "admin" };
  assert.equal((await verify()).status, 403);
  state.project = null;
  assert.equal((await verify()).status, 404);
});

test("expired, missing, malformed and modified challenges are rejected", async () => {
  const { verify, state } = setup();
  assert.equal((await verify({})).status, 400);
  assert.equal((await verify({ publicKey: owner.publicKey(), signedXdr: "bad xdr" })).status, 401);
  const tx = challenge(); tx.sign(owner);
  assert.equal((await verify({ publicKey: owner.publicKey(), signedXdr: tx.toXDR() })).status, 401);
  state.challenge.expires_at = Date.now() - 1;
  assert.equal((await verify()).status, 400);
  state.challenge = null;
  assert.equal((await verify()).status, 400);
});

test("a login challenge or another project's challenge cannot verify ownership", async () => {
  for (const tx of [challenge(owner, "8"), challenge(owner, "7", "stellar_wave_hub_auth")]) {
    const { verify, state } = setup();
    state.challenge.challenge = tx.toXDR(); tx.sign(owner);
    assert.equal((await verify({ publicKey: owner.publicKey(), signedXdr: tx.toXDR() })).status, 401);
  }
});

test("replacement challenge survives a stale verification request", async () => {
  const { verify, state } = setup();
  const replacement = challenge().toXDR();
  state.beforeDelete = () => { state.challenge.challenge = replacement; };
  assert.equal((await verify()).status, 409);
  assert.equal(state.challenge.challenge, replacement);
  assert.equal(state.project.owner_verified_at, null);
});

test("parallel verification consumes a challenge only once", async () => {
  const { verify } = setup();
  const responses = await Promise.all([verify(), verify()]);
  assert.deepEqual(responses.map((response) => response.status).sort(), [200, 409]);
});

test("account edit racing verification prevents stale verified state", async () => {
  const { verify, state } = setup();
  state.beforeUpdate = () => { state.project.stellar_account_id = other.publicKey(); };
  assert.equal((await verify()).status, 409);
  assert.equal(state.project.owner_verified_address, null);
});

test("account replacement or removal clears verification, unrelated edits preserve it", async () => {
  for (const account of [other.publicKey(), ""]) {
    const { verify, edit, state } = setup();
    assert.equal((await verify()).status, 200);
    assert.equal((await edit({ name: "Updated name" })).status, 200);
    assert.equal(state.project.owner_verified_address, owner.publicKey());
    assert.equal((await edit({ stellar_account_id: owner.publicKey() })).status, 200);
    assert.ok(state.project.owner_verified_at);
    assert.equal((await edit({ stellar_account_id: account })).status, 200);
    assert.equal(state.project.owner_verified_at, null);
    assert.equal(state.project.owner_verified_address, null);
  }
});

test("a stale edit cannot preserve verification across concurrent account changes", async () => {
  const { edit, state } = setup();
  state.beforeUpdate = () => {
    state.project.stellar_account_id = other.publicKey();
    state.project.updated_at = "2026-10-21T00:00:00.000Z";
    state.project.owner_verified_address = other.publicKey();
  };
  assert.equal((await edit({ stellar_account_id: owner.publicKey() })).status, 409);
  assert.equal(state.project.stellar_account_id, other.publicKey());
});

function renderButton(overrides = {}, walletOverrides = {}) {
  const stateChanges = [];
  const signed = [];
  let verified;
  const Component = load("src/components/VerifyOwnership.tsx", {
    react: { useState: (initial) => [initial, (value) => stateChanges.push(value)] },
    "@stellar/freighter-api": {
      isConnected: async () => ({ isConnected: true }),
      requestAccess: async () => ({ address: owner.publicKey() }),
      signTransaction: async (...args) => { signed.push(args); return { signedTxXdr: "signed-xdr" }; },
      ...walletOverrides,
    },
  }).default;
  const element = Component({
    projectId: 7, account: owner.publicKey(), token: "test-token", verified: false,
    disabled: false, onVerified: (project) => { verified = project; }, ...overrides,
  });
  const button = element.props.children.find((child) => child?.type === "button");
  return { button, stateChanges, signed, result: () => verified };
}

test("Freighter flow signs the challenge and submits the signed envelope with auth", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, options });
    return Response.json(url.endsWith("/challenge")
      ? { challengeXdr: "challenge-xdr", stellarAccountId: owner.publicKey(), networkPassphrase: Networks.TESTNET }
      : { project: { owner_verified_at: "now", owner_verified_address: owner.publicKey() } });
  });
  const ui = renderButton();
  await ui.button.props.onClick();
  assert.equal(calls.length, 2);
  assert.deepEqual(ui.signed[0], ["challenge-xdr", { networkPassphrase: Networks.TESTNET, address: owner.publicKey() }]);
  assert.equal(calls[1].options.headers.Authorization, "Bearer test-token");
  assert.deepEqual(JSON.parse(calls[1].options.body), { publicKey: owner.publicKey(), signedXdr: "signed-xdr" });
  assert.equal(ui.result().owner_verified_address, owner.publicKey());
  assert.equal(ui.stateChanges.at(-1), false);
});

test("Freighter missing, denied access and wrong account show recoverable errors", async () => {
  for (const [wallet, message] of [
    [{ isConnected: async () => ({ isConnected: false }) }, /Install/],
    [{ requestAccess: async () => ({ error: { message: "Access denied" } }) }, /Access denied/],
    [{ requestAccess: async () => ({ address: other.publicKey() }) }, /Switch Freighter/],
  ]) {
    const ui = renderButton({}, wallet);
    await ui.button.props.onClick();
    assert.ok(ui.stateChanges.some((value) => typeof value === "string" && message.test(value)));
    assert.equal(ui.result(), undefined);
    assert.equal(ui.signed.length, 0);
  }
});

test("cancelled signing and server failure never display verified state", async (t) => {
  t.mock.method(globalThis, "fetch", async (url) => url.endsWith("/challenge")
    ? Response.json({ challengeXdr: "challenge-xdr", stellarAccountId: owner.publicKey(), networkPassphrase: Networks.TESTNET })
    : Response.json({ error: "Challenge expired" }, { status: 400 }));
  for (const wallet of [{ signTransaction: async () => ({ error: { message: "User cancelled" } }) }, {}]) {
    const ui = renderButton({}, wallet);
    await ui.button.props.onClick();
    assert.equal(ui.result(), undefined);
    assert.ok(ui.stateChanges.some((value) => /User cancelled|Challenge expired/.test(String(value))));
  }
});

test("unsaved account changes and already verified accounts disable the button", () => {
  assert.equal(renderButton({ disabled: true }).button.props.disabled, true);
  assert.equal(renderButton({ verified: true }).button.props.disabled, true);
  assert.equal(renderButton({ account: "" }).button.props.disabled, true);
});
