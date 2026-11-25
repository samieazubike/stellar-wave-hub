import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webDir = path.resolve(__dirname, "..");
const envExamplePath = path.resolve(webDir, ".env.example");

describe("Environment Configuration Example (.env.example)", () => {
  it("should verify web/.env.example exists on disk", () => {
    assert.ok(fs.existsSync(envExamplePath), ".env.example file must exist in web directory");
  });

  const content = fs.existsSync(envExamplePath) ? fs.readFileSync(envExamplePath, "utf-8") : "";

  const requiredVariables = [
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_API_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "JWT_SECRET",
    "NEXT_PUBLIC_CONTRACT_NETWORK",
    "NEXT_PUBLIC_SOROBAN_RPC_URL",
    "STELLAR_HORIZON_URL",
    "NEXT_PUBLIC_STELLAR_HORIZON_URL",
    "STELLAR_PAYMENT_ADDRESS",
    "NEXT_PUBLIC_FEATURED_TIERS",
    "NEXT_PUBLIC_CONTRACT_ID",
    "NEXT_PUBLIC_USDC_SAC",
    "NEXT_PUBLIC_PRICE_HERO_SPONSOR_XLM",
    "HERO_SPONSOR_WALLET",
    "CRON_SECRET",
  ];

  for (const varName of requiredVariables) {
    it(`should define ${varName} with safe placeholder`, () => {
      const regex = new RegExp(`^${varName}=(.+)$`, "m");
      const match = content.match(regex);
      assert.ok(match, `${varName} must be defined in .env.example`);
      const val = match[1].trim();
      assert.ok(val.length > 0, `${varName} must have a non-empty example value`);
      assert.ok(!val.includes("sk_live_"), `${varName} must not contain real live credentials`);
    });
  }

  const sections = [
    "Site & API",
    "Database & Storage",
    "Authentication & Security",
    "Stellar & Soroban Blockchain",
    "Background Cron",
  ];

  for (const sec of sections) {
    it(`should contain section header: ${sec}`, () => {
      assert.ok(content.includes(sec), `.env.example must categorize ${sec}`);
    });
  }

  it("should parse into valid key-value pairs without syntax errors", () => {
    const lines = content.split("\n");
    let parsedCount = 0;
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const parts = trimmed.split("=");
      assert.ok(parts.length >= 2, `Line must be valid KEY=VALUE: ${trimmed}`);
      parsedCount++;
    }
    assert.strictEqual(parsedCount, requiredVariables.length);
  });
});
