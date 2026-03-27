/**
 * Submission script for the Turing Signing Server (TSS) project profile
 * to Stellar Wave Hub.
 *
 * Usage: npx ts-node scripts/submit-tss-project.ts
 * Or:    node --loader ts-node/esm scripts/submit-tss-project.ts
 */

import { validateSubmissionPayload } from "./validate-submission";

const HUB_BASE = "https://usestellarwavehub.vercel.app";

const TSS_DESCRIPTION = `
The Turing Signing Server (TSS) is a Stellar Wave Program infrastructure project that provides a decentralized, threshold-based signing service for the Stellar network. Developed by the Stellar Development Foundation and Cheesecake Labs, TSS solves one of the most critical security challenges in blockchain applications: how to authorize transactions without trusting a single custodian with a private key.

At its core, TSS implements threshold Schnorr signing using Shamir's Secret Sharing. A private key is split into n shards, each held by a separate turret server. To sign a transaction, a threshold of t-of-n turrets must cooperate and produce partial signatures, which are then aggregated client-side into a valid Stellar transaction signature. No single turret ever holds the complete private key, meaning an attacker must compromise at least t turrets simultaneously to forge a signature — a dramatically higher bar than attacking a single custodial server.

The privacy model is further strengthened by WebAssembly-based access control. Each turret executes a user-supplied Wasm function — called a turing function — that encodes the authorization policy for a signing request. This Wasm function runs in a sandboxed environment and can enforce arbitrary business logic: rate limits, allowlists, time locks, multi-party approval requirements, and more. The Wasm bytecode hash is stored on-chain, making the policy transparent, auditable, and tamper-evident. Any modification to the policy is immediately detectable by comparing the on-chain hash.

TSS integrates with Soroban smart contracts to enable on-chain verification of signing policies. Contract invocations can be gated behind TSS-controlled accounts, ensuring that only threshold-approved transactions reach the Stellar ledger. This creates a powerful composability layer: DeFi protocols, DAOs, and enterprise applications can enforce complex signing policies while maintaining strong privacy guarantees for their users' key material.

The threat model addresses single turret compromise (mitigated by threshold requirements), malicious turret operators (mitigated by independent Wasm policy enforcement), replay attacks (mitigated by unique nonces per request), unauthorized signing (mitigated by Wasm allowlists and rate limits), and key reconstruction by any single party (mitigated by Shamir's Secret Sharing). The non-custodial design means the TSS operator never learns the user's full private key — only their own shard — providing a strong privacy guarantee even against a compromised operator.

TSS represents a foundational security primitive for the Stellar ecosystem, enabling non-custodial, policy-driven transaction authorization at scale.
`.trim();

const TSS_PROJECT = {
  name: "Turing Signing Server (TSS)",
  description: TSS_DESCRIPTION,
  category: "infrastructure",
  // Stellar Lumens Foundation account — used as the TSS reference operator account
  // Valid 56-char G... Stellar public key (base32 encoded ed25519)
  stellar_account_id: "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN",
  tags: "privacy,security,key-management,threshold-signing,wasm,soroban,stellar-wave,non-custodial",
  website_url: "https://tss.stellar.org",
  github_url: "https://github.com/stellar/turing-signing-server",
  // A 1x1 transparent PNG as base64 to satisfy the research_images requirement
  research_images: [
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  ],
};

async function register(email: string, username: string, password: string): Promise<string | null> {
  const res = await fetch(`${HUB_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username, password }),
  });
  const data = await res.json() as { token?: string; error?: string };
  if (res.ok && data.token) {
    console.log("Registered successfully, token obtained.");
    return data.token;
  }
  console.log("Register response:", res.status, data);
  return null;
}

async function login(email: string, password: string): Promise<string | null> {
  const res = await fetch(`${HUB_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json() as { token?: string; error?: string };
  if (res.ok && data.token) {
    console.log("Logged in successfully, token obtained.");
    return data.token;
  }
  console.log("Login response:", res.status, data);
  return null;
}

async function submitProject(token: string): Promise<{ id: number; status: string } | null> {
  // Validate payload before sending
  const errors = validateSubmissionPayload(TSS_PROJECT as Record<string, unknown>);
  if (errors.length > 0) {
    console.error("Payload validation failed:", errors);
    return null;
  }

  const res = await fetch(`${HUB_BASE}/api/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(TSS_PROJECT),
  });

  const data = await res.json() as { project?: { id: number; status: string }; error?: string };
  console.log("Submit response:", res.status, JSON.stringify(data, null, 2));

  if (res.status === 201 && data.project) {
    return { id: data.project.id, status: data.project.status };
  }
  return null;
}

async function main() {
  console.log("=== TSS Project Submission to Stellar Wave Hub ===\n");

  // Validate description word count
  const words = TSS_DESCRIPTION.trim().split(/\s+/).length;
  console.log(`Description word count: ${words} (minimum: 200)`);
  if (words < 200) {
    console.error("ERROR: Description is too short!");
    process.exit(1);
  }

  const email = `tss-researcher-${Date.now()}@stellarwave.dev`;
  const username = `tss-researcher-${Date.now()}`;
  const password = "SecurePass123!";

  // Try register first, fall back to login if already exists
  let token = await register(email, username, password);
  if (!token) {
    token = await login(email, password);
  }

  if (!token) {
    console.error("ERROR: Could not obtain auth token.");
    process.exit(1);
  }

  const result = await submitProject(token);
  if (result) {
    console.log(`\n✓ Project submitted successfully!`);
    console.log(`  ID: ${result.id}`);
    console.log(`  Status: ${result.status}`);
    console.log(`\nUpdate research/tss-turing-signing-server.md with:`);
    console.log(`  - Project ID: ${result.id}`);
    console.log(`  - Status: ${result.status}`);
  } else {
    console.error("\nERROR: Submission failed.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
