import { test, describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../..");

const ALLOWED_CATEGORIES = [
  "DeFi",
  "Payments",
  "NFT",
  "Infrastructure",
  "Gaming",
  "Social",
  "Tools",
  "DAO",
  "Identity",
  "Other",
];

function validateProjectPayload(payload) {
  const errors = {};

  if (!payload.name || typeof payload.name !== "string" || payload.name.trim().length === 0) {
    errors.name = "Name is required";
  }

  if (!payload.description || typeof payload.description !== "string" || payload.description.trim().length === 0) {
    errors.description = "Description is required";
  }

  if (!payload.category || typeof payload.category !== "string" || !ALLOWED_CATEGORIES.includes(payload.category)) {
    errors.category = "Invalid category";
  }

  if (payload.stellar_network && !["testnet", "mainnet"].includes(payload.stellar_network)) {
    errors.stellar_network = "Network must be testnet or mainnet";
  }

  if (payload.stellar_contract_id) {
    const contractRegex = /^C[A-Z2-7]{55}$/;
    if (!contractRegex.test(payload.stellar_contract_id)) {
      errors.stellar_contract_id = "Must be a valid Soroban contract ID starting with C (56 characters)";
    }
  }

  if (payload.stellar_account_id) {
    const accountRegex = /^G[A-Z2-7]{55}$/;
    if (!accountRegex.test(payload.stellar_account_id)) {
      errors.stellar_account_id = "Must be a valid Stellar account ID starting with G (56 characters)";
    }
  }

  if (payload.github_repos && !Array.isArray(payload.github_repos)) {
    errors.github_repos = "GitHub repos must be an array";
  }

  if (payload.research_images && !Array.isArray(payload.research_images)) {
    errors.research_images = "Research images must be an array";
  }

  return {
    success: Object.keys(errors).length === 0,
    errors,
  };
}

describe("Invoice Liquidity Network Research Submission Validation", () => {
  const researchFilePath = path.join(
    rootDir,
    "research",
    "invoice-liquidity-network-submission.md"
  );

  it("should have created the research markdown file", () => {
    assert.ok(
      fs.existsSync(researchFilePath),
      "Research markdown file must exist at research/invoice-liquidity-network-submission.md"
    );
  });

  it("should meet the minimum 200-word description criteria", () => {
    const content = fs.readFileSync(researchFilePath, "utf8");
    const descMatch = content.match(/## Description\s+([\s\S]*?)(?=\n## |$)/);
    assert.ok(descMatch, "Document must contain a ## Description section");

    const descriptionText = descMatch[1].trim();
    const wordCount = descriptionText.split(/\s+/).filter(Boolean).length;
    assert.ok(
      wordCount >= 200,
      `Description must be at least 200 words, got ${wordCount}`
    );
  });

  it("should include all mandatory research sections", () => {
    const content = fs.readFileSync(researchFilePath, "utf8");
    const requiredSections = [
      "## Project Identity",
      "## Submission Fields",
      "## Description",
      "## The Problem Invoice Liquidity Network Solves",
      "## Technical Approach & Smart Contract Architecture",
      "## How the Project Uses Stellar",
      "## On-Chain Verification",
      "## Team & Community",
      "## Research Screenshots",
      "## Research Sources",
      "## Hub Submission Confirmation",
    ];

    for (const section of requiredSections) {
      assert.ok(
        content.includes(section),
        `Research file must include section: "${section}"`
      );
    }
  });

  it("should verify valid Soroban contract ID format", () => {
    const contractId = "CCPASLHKRFBMVV5PZG3LKDGKFEDXZMB5U7DK42CVLUVWCMUCSRPVBIMO";
    const sorobanRegex = /^C[A-Z2-7]{55}$/;
    assert.match(
      contractId,
      sorobanRegex,
      "Contract ID must match the 56-character Soroban contract address pattern"
    );
  });

  it("should validate all three research screenshot files exist on disk", () => {
    const images = [
      "iln-architecture.png",
      "iln-factoring-flow.png",
      "iln-onchain-verification.png",
    ];

    for (const img of images) {
      const imgPath = path.join(rootDir, "research", img);
      assert.ok(
        fs.existsSync(imgPath),
        `Research image must exist at research/${img}`
      );
      const stat = fs.statSync(imgPath);
      assert.ok(stat.size > 1000, `Image ${img} must not be empty`);
    }
  });

  it("should validate submission payload against project schema requirements", () => {
    const payload = {
      name: "Invoice Liquidity Network",
      description:
        "Invoice Liquidity Network (ILN) is an open-source, decentralized invoice factoring protocol and liquidity coordination engine built natively on the Stellar blockchain and powered by Soroban WebAssembly smart contracts. The protocol bridges the substantial working capital gap encountered by freelancers, independent digital creators, and small-to-medium enterprises (SMEs) across the globe. In conventional commercial operations, businesses regularly suffer from severe 30-, 60-, or 90-day accounts receivable payment delays, forcing them into reliance on predatory merchant cash advances, bureaucratic traditional banking credit assessments, or costly administrative underwriting. Invoice Liquidity Network completely disintermediates this traditional commercial factoring supply chain by turning verified, outstanding off-chain invoices into tokenized, programmatic on-chain receivables that can be settled and discounted trustlessly.",
      category: "DeFi",
      stellar_network: "testnet",
      stellar_contract_id:
        "CCPASLHKRFBMVV5PZG3LKDGKFEDXZMB5U7DK42CVLUVWCMUCSRPVBIMO",
      stellar_account_id: null,
      tags: "defi, invoice-factoring, soroban, payments, smes, liquidity-pool, usdc, stellar-wave, escrow",
      website_url: "https://docs.iln.finance",
      github_url: "https://github.com/Invoice-Liquidity-Network/Invoice-Liquidity-Network",
      github_repos: [
        {
          label: "Core Docs & Tools",
          url: "https://github.com/Invoice-Liquidity-Network/Invoice-Liquidity-Network",
        },
        {
          label: "Soroban Smart Contracts",
          url: "https://github.com/Invoice-Liquidity-Network/ILN-Smart-Contract",
        },
        {
          label: "Next.js Frontend dApp",
          url: "https://github.com/Invoice-Liquidity-Network/ILN-Frontend",
        },
      ],
      research_images: [
        "research/iln-architecture.png",
        "research/iln-factoring-flow.png",
        "research/iln-onchain-verification.png",
      ],
    };

    const result = validateProjectPayload(payload);
    assert.equal(
      result.success,
      true,
      `Payload validation failed: ${JSON.stringify(result.errors)}`
    );
  });

  it("should reject invalid project payloads safely", () => {
    const invalidPayload = {
      name: "",
      description: "",
      category: "UnknownCategory",
      stellar_contract_id: "invalid-id",
    };

    const result = validateProjectPayload(invalidPayload);
    assert.equal(result.success, false);
    assert.ok(result.errors.name);
    assert.ok(result.errors.description);
    assert.ok(result.errors.category);
    assert.ok(result.errors.stellar_contract_id);
  });

  it("should verify author is listed in CONTRIBUTORS.md", () => {
    const contributorsPath = path.join(rootDir, "CONTRIBUTORS.md");
    const content = fs.readFileSync(contributorsPath, "utf8");
    assert.ok(
      content.includes("opulencechuks"),
      "CONTRIBUTORS.md must contain the researcher's GitHub username"
    );
    assert.ok(
      content.includes("Invoice Liquidity Network"),
      "CONTRIBUTORS.md must reference the researched project name"
    );
  });
});
