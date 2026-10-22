import { describe, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, "..");

const routeFile = path.join(
  webRoot,
  "src",
  "app",
  "api",
  "projects",
  "[id]",
  "verify-owner",
  "challenge",
  "route.ts"
);
const supabaseDir = path.join(webRoot, "data", "supabase");

function read(file) {
  return fs.readFileSync(file, "utf8");
}

describe("Project owner-verification challenge", () => {
  test("ships a timestamped migration adding the owner verification columns", () => {
    const migrations = fs
      .readdirSync(supabaseDir)
      .filter((file) => /^\d{12}_.*owner.*\.sql$/i.test(file));

    assert.equal(
      migrations.length,
      1,
      "Expected exactly one YYYYMMDDHHMM_*owner*.sql migration"
    );

    const sql = read(path.join(supabaseDir, migrations[0]));
    assert.match(sql, /alter table public\.projects/i);
    assert.match(
      sql,
      /add column if not exists owner_verified_at timestamptz/i,
      "owner_verified_at must be a timestamptz column"
    );
    assert.match(
      sql,
      /add column if not exists owner_verified_address text/i,
      "owner_verified_address must be a text column"
    );
  });

  test("exposes POST /api/projects/[id]/verify-owner/challenge", () => {
    assert.ok(fs.existsSync(routeFile), "Challenge route must exist at the issue path");
    assert.match(read(routeFile), /export async function POST/);
  });

  test("rejects unauthenticated callers and non-owners", () => {
    const src = read(routeFile);

    assert.match(src, /getAuthUser\(request\)/, "Route must require an authenticated user");
    assert.match(src, /status: 401/, "Unauthenticated callers must receive 401");
    assert.match(
      src,
      /project\.user_id !== auth\.userId/,
      "Route must compare the project owner with the authenticated user"
    );
    assert.match(src, /status: 403/, "Non-owners must receive 403");
    assert.doesNotMatch(
      src,
      /hasMinRole/,
      "Only the project owner may request a challenge; admins must not bypass the check"
    );
  });

  test("builds a challenge for the project's stellar_account_id", () => {
    const src = read(routeFile);

    assert.match(src, /stellar_account_id/, "Challenge must target the project's account");
    assert.match(src, /Operation\.manageData/, "Challenge must use a manageData operation");
    assert.match(src, /source: stellarAccountId/, "manageData must be sourced from the project account");
    assert.match(src, /transaction\.sign\(serverKeypair\)/, "Server must sign the challenge envelope");
    assert.match(src, /toXDR\(\)/, "Route must return the challenge XDR");
    assert.match(src, /networkPassphrase: Networks\.TESTNET/);
  });

  test("stores challenges in auth_challenges with a five minute expiry", () => {
    const src = read(routeFile);

    assert.match(src, /collection\("auth_challenges"\)/, "Challenges must reuse the auth_challenges table");
    assert.match(src, /CHALLENGE_TTL_SECONDS = 300/, "Challenge TTL must match auth challenges");
    assert.match(src, /setTimeout\(CHALLENGE_TTL_SECONDS\)/);
    assert.match(src, /const expiresAt = now \+ CHALLENGE_TTL_MS/);
    assert.match(src, /expires_at: expiresAt/, "Stored challenge must include expires_at");
  });

  test("requires the project to have a valid Stellar account", () => {
    const src = read(routeFile);

    assert.match(src, /stellarAccountId\.length !== 56/);
    assert.match(src, /stellarAccountId\.startsWith\("G"\)/);
    assert.match(src, /status: 400/);
  });
});
