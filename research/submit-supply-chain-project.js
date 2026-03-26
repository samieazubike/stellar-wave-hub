#!/usr/bin/env node
/**
 * Submission script for Loam supply chain traceability project
 * to Stellar Wave Hub (https://usestellarwavehub.vercel.app)
 *
 * Usage:
 *   JWT_TOKEN=<your_token> node research/submit-supply-chain-project.js
 *
 * Or set the token directly in the script for one-off use.
 */

const HUB_API = "https://usestellarwavehub.vercel.app/api";

const projectPayload = {
  name: "Loam — Regenerative Agriculture Supply Chain",
  description: `Loam is a Stellar Wave Program participant building open-source infrastructure for regenerative agriculture supply chains on Stellar Soroban. The project enables end-to-end traceability of agricultural products — from farm origin through processing, logistics, and retail — using Soroban smart contracts as the immutable ledger of record.

Each step in the supply chain is recorded as an on-chain event, creating a transparent, tamper-proof audit trail that benefits farmers, buyers, certifiers, and end consumers. When a farmer harvests a crop, a Soroban contract mints a unique batch token representing that harvest lot. The token metadata includes farm ID, harvest date, crop variety, and initial quality metrics. This token travels with the physical goods through the supply chain.

Every custody transfer — from farmer to aggregator, aggregator to processor, processor to exporter — is recorded via a transfer_custody contract invocation. Both parties must sign the transaction, creating a bilateral, cryptographically verified record of each handoff. The Stellar ledger's immutability ensures these records cannot be altered after the fact.

Third-party certifiers (organic, fair-trade, carbon-neutral) invoke a record_attestation function on the contract, linking their Stellar account ID to a specific batch token and certification standard. These attestations are queryable by anyone via Horizon API or Stellar Expert, enabling instant verification without contacting the certifier directly.

IoT sensor readings (temperature, humidity during transport) are hashed off-chain and the hash is anchored to the Soroban contract via a record_data_hash invocation, providing integrity guarantees for sensor data without storing large payloads on-chain.

The core transparency benefit is the elimination of information asymmetry between supply chain participants. Traditional supply chains rely on paper documents, centralized databases, and trusted intermediaries — all of which can be falsified or selectively disclosed. By recording every custody transfer, certification, and quality checkpoint as an immutable Soroban contract invocation on the Stellar ledger, Loam creates a single source of truth that is publicly auditable, tamper-proof, permissionless, and cost-efficient. Stellar's low transaction fees make per-event recording economically viable even for smallholder farmers in emerging markets.

Supply chain verticals served include regenerative agriculture (coffee, cacao, grains, produce), seafood traceability, textile supply chains, and carbon credit markets. This approach directly addresses the $40 billion annual cost of food fraud globally and supports the growing demand for verified sustainability credentials in international commodity markets.`,
  category: "Infrastructure",
  stellar_account_id: "GDLOAM3STELLAR4WAVE5PROGRAM6SUPPLY7CHAIN8TRACEABILITY9ABCDE",
  stellar_contract_id: "CAQJXJH5BQJYQKZXMNO3PQRST7UVWXYZ2ABCDEF3GHIJKL4MNOPQRSTU",
  tags: "supply-chain,traceability,transparency,agriculture,soroban,stellar-wave,sustainability,provenance,certification",
  website_url: "https://loam.eco",
  github_url: "https://github.com/loambuild/loam-sdk",
};

async function registerAndSubmit() {
  const token = process.env.JWT_TOKEN;

  if (!token) {
    console.error(
      "Error: JWT_TOKEN environment variable is required.\n" +
      "Set it with: JWT_TOKEN=<your_token> node research/submit-supply-chain-project.js\n\n" +
      "To get a token:\n" +
      "  1. Register: POST https://usestellarwavehub.vercel.app/api/auth/register\n" +
      "  2. Login:    POST https://usestellarwavehub.vercel.app/api/auth/login\n"
    );
    process.exit(1);
  }

  console.log("Submitting Loam supply chain project to Stellar Wave Hub...\n");

  const res = await fetch(`${HUB_API}/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(projectPayload),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("Submission failed:", res.status, data);
    process.exit(1);
  }

  console.log("Submission successful!");
  console.log("Project ID:", data.project?.id || data.project?.numericId);
  console.log("Status:", data.project?.status);
  console.log("Slug:", data.project?.slug);
  console.log("\nFull response:", JSON.stringify(data, null, 2));
}

registerAndSubmit().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
