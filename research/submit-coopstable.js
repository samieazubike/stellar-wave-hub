#!/usr/bin/env node

/**
 * CoopStable Project Submission Script
 *
 * Submits the CoopStable stablecoin issuance profile to Stellar Wave Hub.
 *
 * Usage:
 *   node research/submit-coopstable.js <AUTH_TOKEN>
 *   node research/submit-coopstable.js <AUTH_TOKEN> --force
 *
 * Upload research images first via https://usestellarwavehub.vercel.app/submit
 * or POST /api/upload, then set research_images URLs below.
 */

const TOKEN = process.argv[2];
const HUB_URL = process.env.HUB_URL || "https://usestellarwavehub.vercel.app";

if (!TOKEN) {
  console.error("Usage: node research/submit-coopstable.js <AUTH_TOKEN> [--force]");
  console.error("\nGet your JWT by logging in at", HUB_URL);
  process.exit(1);
}

const submissionData = {
  name: "CoopStable",
  description: `CoopStable is a decentralized cooperative stablecoin protocol on Stellar that issues cUSD, a collateral-backed digital dollar pegged 1:1 to USDC. Built by the Breadchain Cooperative and funded through the Stellar Community Fund (CoopStable v2), the project combines Soroban smart contracts with Stellar's Stellar Asset Contract (SAC) to deliver transparent mint-and-burn mechanics, yield generation, and cooperative revenue sharing.

The issuance model is straightforward and verifiable on mainnet: users deposit USDC into the Lending Yield Controller, the cUSD Manager mints an equivalent amount of cUSD, and collateral is routed through the Yield Adapter Registry into Blend Capital lending pools. When users redeem, cUSD is burned and principal USDC is returned. This "lossless donation" design means depositors keep their principal while the protocol socializes only the yield—10 percent to the treasury and 90 percent distributed equally among cooperative members on configurable epochs (default 24 hours).

CoopStable's regulatory posture is protocol-native rather than bank-licensed: collateralization is enforced by smart contracts, roles are gated through Soroban access control, and public metadata is published in a stellar.toml at coopstable.app. The issuer account GB4E4EA26SXUJSFJTMFCVGVNEKWGNQ44MLFRHHXWQHQ54RD7KQTYBNSR lists home_domain coopstable.app and issues CUSD with documented organization details for CoopStable and the Bread Cooperative. On-chain supply, trustlines, and contract invocations can be audited via Stellar Expert and Horizon without trusting off-chain reports.

Technically, the system is modular: separate contracts manage token lifecycle (cUSD Manager), user flows (Lending Yield Controller), yield splits (Yield Distributor), and protocol adapters (Blend Capital Adapter). Mainnet addresses are committed in the public BreadchainCoop/Coop-Stable-Contracts repository. The cUSD SAC contract CA7JSNCTAGTVXJJX65YIN53XAXK72NZPD5Q62YUQXV7R7V45ELKONCJ5 was created by the issuer account and links to asset CUSD-GB4E4EA26SXUJSFJTMFCVGVNEKWGNQ44MLFRHHXWQHQ54RD7KQTYBNSR-1.

For the Stellar ecosystem, CoopStable demonstrates how Soroban can power community-governed stablecoin issuance with real collateral, DeFi yield, and open-source auditability—an alternative to centralized fiat stablecoins that still anchors value to USDC while funding cooperative public goods through transparent on-chain economics.`,
  category: "defi",
  stellar_account_id:
    "GB4E4EA26SXUJSFJTMFCVGVNEKWGNQ44MLFRHHXWQHQ54RD7KQTYBNSR",
  stellar_contract_id:
    "CA7JSNCTAGTVXJJX65YIN53XAXK72NZPD5Q62YUQXV7R7V45ELKONCJ5",
  stellar_network: "mainnet",
  tags: "stablecoin, asset-issuance, soroban, defi, collateral, compliance, yield, cooperative, tokenization, stellar-wave, usdc, blend-capital",
  website_url: "https://www.coopstable.app/",
  logo_url: "https://www.coopstable.app/logo.png",
  github_repos: [
    {
      label: "Soroban Contracts (Core)",
      url: "https://github.com/BreadchainCoop/Coop-Stable-Contracts",
    },
    {
      label: "Frontend Client",
      url: "https://github.com/BreadchainCoop/coopstable-client",
    },
  ],
  research_images: [],
};

async function submitProject() {
  console.log("Submitting CoopStable to Stellar Wave Hub...\n");

  if (submissionData.research_images.length === 0) {
    console.warn("WARNING: No research_images URLs set.");
    console.warn("Upload 1–10 screenshots via /api/upload, then edit this script.\n");
    console.warn("Suggested captures:");
    console.warn("  1. Stellar Expert — CUSD asset page");
    console.warn("  2. coopstable.app stellar.toml");
    console.warn("  3. SCF project page (CoopStable v2)");
    console.warn("  4. mainnet.contracts.json on GitHub");
    console.warn("  5. Stellar Expert — cUSD Manager contract\n");

    if (process.argv[3] !== "--force") {
      console.log("Run with --force to submit without images (form may reject).");
      process.exit(0);
    }
  }

  const response = await fetch(`${HUB_URL}/api/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify(submissionData),
  });

  const data = await response.json();

  if (response.ok) {
    console.log("Project submitted successfully.");
    console.log(`  ID:     ${data.project?.numericId ?? data.project?.id}`);
    console.log(`  Slug:   ${data.project?.slug}`);
    console.log(`  Status: ${data.project?.status}`);
  } else {
    console.error("Submission failed:", data.error || data);
    process.exit(1);
  }
}

submitProject().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
