#!/usr/bin/env node
/**
 * Agri3 Supply Chain Traceability — Stellar Wave Hub Submission Script
 *
 * Submits the Agri3 project profile to the Stellar Wave Hub via the public API.
 * Run: node research/submit-agri3.js
 *
 * Requires: AUTH_TOKEN env var (JWT from a registered Hub account)
 * Example:  AUTH_TOKEN=<your_jwt> node research/submit-agri3.js
 */

const HUB_URL = "https://usestellarwavehub.vercel.app";

const PROJECT_PAYLOAD = {
  name: "Agri3",
  description: `Agri3 is a Stellar Wave Program project that delivers end-to-end supply chain traceability for agricultural commodities using the Stellar blockchain and Soroban smart contracts. The platform records every step of a product's journey — from farm origin through processing, logistics, and retail — as immutable on-chain data, creating a transparent and tamper-evident audit trail accessible to all stakeholders.

At the core of Agri3's architecture is a dual-layer on-chain recording approach. First, each supply chain event is anchored to the Stellar ledger via a transaction whose memo field carries a SHA-256 hash of the full event payload stored on IPFS. This hash-anchoring technique means anyone can independently verify that off-chain data has not been altered since it was recorded. Second, a Soroban smart contract manages the state machine for each commodity batch, enforcing valid state transitions (harvested → processed → shipped → delivered) and recording custody transfers as contract invocations. The contract stores batch IDs, current custodian accounts, event counts, and the latest event hash, making the entire provenance chain queryable directly from the Stellar ledger.

Agri3 also tokenizes commodity batches as Stellar custom assets, where the issuing account is the originating farm. Transfers of these assets on the Stellar network represent real-world custody changes, creating a financial-grade audit trail of commodity movement that is fully auditable without trusting any centralized system.

The platform serves multiple agricultural verticals: cocoa and coffee for fair-trade certification, grain and cereals for food security monitoring, seafood for IUU fishing compliance, and pharmaceutical ingredients for GMP traceability. Farmers benefit from verifiable proof of origin that commands premium pricing. Processors can instantly verify incoming raw material provenance, eliminating paper certificates and reducing fraud. Regulators can audit compliance directly from the public ledger without requesting data from companies. Consumers can scan QR codes on packaging to see the full farm-to-shelf journey of their products.

By anchoring supply chain data to Stellar's fast, low-cost, and energy-efficient blockchain, Agri3 makes traceability economically viable even for smallholder farmers in emerging markets, democratizing access to the transparency infrastructure that was previously only available to large enterprises.`,
  category: "infrastructure",
  stellar_account_id: "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37",
  stellar_contract_id: "",
  stellar_network: "mainnet",
  tags: "supply-chain, traceability, transparency, agritech, soroban, stellar-wave, food-safety, provenance",
  website_url: "https://agri3.io",
  github_url: "https://github.com/agri3io/agri3-stellar",
  logo_url: "",
  research_images: [],
};

async function submitProject() {
  const token = process.env.AUTH_TOKEN;
  if (!token) {
    console.error("ERROR: AUTH_TOKEN environment variable is required.");
    console.error("Usage: AUTH_TOKEN=<your_jwt> node research/submit-agri3.js");
    process.exit(1);
  }

  console.log("Submitting Agri3 to Stellar Wave Hub...");
  console.log(`Endpoint: ${HUB_URL}/api/projects`);
  console.log(`Project: ${PROJECT_PAYLOAD.name}`);
  console.log(`Category: ${PROJECT_PAYLOAD.category}`);
  console.log(`Tags: ${PROJECT_PAYLOAD.tags}`);
  console.log("---");

  try {
    const res = await fetch(`${HUB_URL}/api/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(PROJECT_PAYLOAD),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error(`FAILED (HTTP ${res.status}):`, data);
      process.exit(1);
    }

    console.log("SUCCESS — Project submitted:");
    console.log(`  ID:     ${data.project?.id ?? data.project?.numericId}`);
    console.log(`  Slug:   ${data.project?.slug}`);
    console.log(`  Status: ${data.project?.status}`);
    console.log(`  URL:    ${HUB_URL}/projects/${data.project?.slug}`);
  } catch (err) {
    console.error("Network error:", err.message);
    process.exit(1);
  }
}

submitProject();
