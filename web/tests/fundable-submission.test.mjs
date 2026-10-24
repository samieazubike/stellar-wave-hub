import { describe, it } from "node:test";
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

describe("Fundable Protocol Research Submission Validation", () => {
  const researchFilePath = path.join(
    rootDir,
    "research",
    "fundable-protocol-stellar-wave-submission.md"
  );

  it("should have created the research markdown file", () => {
    assert.ok(
      fs.existsSync(researchFilePath),
      "Research markdown file must exist at research/fundable-protocol-stellar-wave-submission.md"
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
      "## The Problem Fundable Protocol Solves",
      "## Technical Approach & Smart Contract Architecture",
      "## How It Uses Stellar",
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
    const contractId = "CDMLFMKMMD7MWZP3FKUBZPVHTUEDLSX4BYGYKH4GCESXYHS3IHQ4EIG4";
    const sorobanRegex = /^C[A-Z2-7]{55}$/;
    assert.match(
      contractId,
      sorobanRegex,
      "Contract ID must match the 56-character Soroban contract address pattern"
    );
  });

  it("should validate all three research screenshot files exist on disk", () => {
    const images = [
      "fundable-architecture.png",
      "fundable-streaming-flow.png",
      "fundable-onchain-verification.png",
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
      name: "Fundable Protocol",
      description:
        "Fundable Protocol is a decentralized crowdfunding, programmable milestone escrow, and payment streaming infrastructure platform built natively on the Stellar blockchain and its Soroban smart contract environment. The protocol addresses critical vulnerabilities in traditional Web2 and early Web3 crowdfunding: rigid all-or-nothing fundraising models, lack of accountability after capital is raised, creator rug-pulls, and complex multi-party disbursement bottlenecks. Rather than treating funding as a one-time lump-sum transfer, Fundable Protocol introduces on-chain milestone-gated escrows and continuous linear payment streaming that protect backers while providing builders with predictable, verifiable cash flow.",
      category: "DeFi",
      stellar_network: "testnet",
      stellar_contract_id:
        "CDMLFMKMMD7MWZP3FKUBZPVHTUEDLSX4BYGYKH4GCESXYHS3IHQ4EIG4",
      stellar_account_id: null,
      tags: "crowdfunding, payment-streaming, soroban, vesting, defi, usdc, milestones, stellar-wave, escrow",
      website_url: "https://fundable.finance",
      github_url: "https://github.com/Fundable-Protocol/stellar_client_os",
      github_repos: [
        {
          label: "Core Client & Contracts",
          url: "https://github.com/Fundable-Protocol/stellar_client_os",
        },
        {
          label: "Soroban Event Indexer",
          url: "https://github.com/Fundable-Protocol/stellar_indexer",
        },
        {
          label: "Backend API Service",
          url: "https://github.com/Fundable-Protocol/Backend",
        },
      ],
      logo_url: "https://avatars.githubusercontent.com/u/184972325?v=4",
      research_images: [
        "https://dlwcywvybsedgmcggmjn.supabase.co/storage/v1/object/public/research-images/87/1792357194176-os05ra.png",
        "https://dlwcywvybsedgmcggmjn.supabase.co/storage/v1/object/public/research-images/87/1792357194775-qig0e0.png",
        "https://dlwcywvybsedgmcggmjn.supabase.co/storage/v1/object/public/research-images/87/1792357195341-gqgfiv.png",
      ],
    };

    const result = validateProjectPayload(payload);
    assert.ok(
      result.success,
      `Payload should pass validation: ${JSON.stringify(result.errors)}`
    );
    assert.equal(payload.name, "Fundable Protocol");
    assert.equal(payload.category, "DeFi");
    assert.equal(payload.stellar_network, "testnet");
    assert.equal(payload.research_images.length, 3);
  });

  it("should reject invalid project payloads safely", () => {
    const invalidPayload = {
      name: "",
      description: "",
      category: "NonExistentCategory",
      stellar_network: "invalid-network",
      stellar_contract_id: "InvalidAddress123",
    };

    const result = validateProjectPayload(invalidPayload);
    assert.equal(result.success, false);
    assert.ok(result.errors.name, "Should report name error");
    assert.ok(result.errors.description, "Should report description error");
    assert.ok(result.errors.category, "Should report category error");
    assert.ok(result.errors.stellar_network, "Should report network error");
    assert.ok(
      result.errors.stellar_contract_id,
      "Should report invalid contract ID error"
    );
  });

  it("should verify author is listed in CONTRIBUTORS.md", () => {
    const contributorsPath = path.join(rootDir, "CONTRIBUTORS.md");
    const content = fs.readFileSync(contributorsPath, "utf8");

    assert.ok(
      content.includes("https://github.com/dee-john"),
      "CONTRIBUTORS.md must contain link to github.com/dee-john"
    );
    assert.ok(
      content.includes("Fundable Protocol"),
      "CONTRIBUTORS.md must credit contribution to Fundable Protocol"
    );
  });
});
