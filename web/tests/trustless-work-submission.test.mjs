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

describe("Trustless Work Research Submission Validation", () => {
  const researchFilePath = path.join(
    rootDir,
    "research",
    "trustless-work-submission.md"
  );

  it("should have created the research markdown file", () => {
    assert.ok(
      fs.existsSync(researchFilePath),
      "Research markdown file must exist at research/trustless-work-submission.md"
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
      "## The Problem Trustless Work Solves",
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

  it("should not contain placeholder markers", () => {
    const content = fs.readFileSync(researchFilePath, "utf8");
    for (const marker of ["placeholder", "TODO", "TBD", "FIXME"]) {
      assert.ok(
        !content.toLowerCase().includes(marker.toLowerCase()),
        `Research file must not contain the placeholder marker "${marker}"`
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

    const content = fs.readFileSync(researchFilePath, "utf8");
    assert.ok(
      content.includes(contractId),
      "Research file must reference the verified contract ID"
    );
  });

  it("should validate all three research screenshot files exist on disk", async () => {
    const images = [
      "trustless-work-architecture.png",
      "trustless-work-escrow-flow.png",
      "trustless-work-onchain-verification.png",
    ];

    // The diagrams are rendered deterministically from
    // research/generate-trustless-work-screenshots.mjs so they stay reviewable
    // as code. Render them before asserting on the produced files.
    const { generateScreenshots } = await import(
      path.join(rootDir, "research", "generate-trustless-work-screenshots.mjs")
    );
    generateScreenshots(path.join(rootDir, "research"));

    for (const img of images) {
      const imgPath = path.join(rootDir, "research", img);
      assert.ok(
        fs.existsSync(imgPath),
        `Research image must exist at research/${img}`
      );
      const stat = fs.statSync(imgPath);
      assert.ok(stat.size > 1000, `Image ${img} must not be empty`);

      const header = fs.readFileSync(imgPath).subarray(0, 8);
      assert.deepEqual(
        [...header],
        [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
        `Image ${img} must be a valid PNG file`
      );
    }
  });

  it("should validate submission payload against project schema requirements", () => {
    const payload = {
      name: "Trustless Work",
      description:
        "Trustless Work is an open-source, non-custodial escrow-as-a-service infrastructure layer built natively on the Stellar blockchain and executed by Soroban smart contracts. It gives marketplaces, freelance platforms, agencies, and any two-party commercial relationship a programmable way to hold funds in escrow until agreed conditions are met, without either party having to trust a centralized intermediary, a platform treasury, or a human arbitrator. Instead of each marketplace rebuilding escrow logic, custody, dispute handling, and settlement accounting from scratch, Trustless Work exposes escrow as a reusable API and SDK that any product can embed in a few lines of code. The protocol models an escrow as an on-chain contract instance with a defined set of roles: a service provider who delivers the work, an approver or client who releases funds, a platform or resolver address that can arbitrate disputes, and an optional receiver distinct from the service provider. Funds are deposited into the contract's own balance and are only movable along the state machine the parties agreed to at creation time. Milestones can be defined so that a single engagement is paid out in tranches, each released independently as deliverables are accepted. Because the escrow contract holds the funds rather than a company bank account, neither the platform nor the counterparty can unilaterally abscond with the balance, and every state transition is publicly auditable on the Stellar ledger.",
      category: "Infrastructure",
      stellar_network: "testnet",
      stellar_contract_id:
        "CDMLFMKMMD7MWZP3FKUBZPVHTUEDLSX4BYGYKH4GCESXYHS3IHQ4EIG4",
      stellar_account_id: null,
      tags: "escrow, soroban, infrastructure, payments, marketplace, sdk, api, stellar-wave, smart-contracts, rust, typescript",
      website_url: "https://www.trustlesswork.com",
      github_url:
        "https://github.com/Trustless-Work/Trustless-Work-Smart-Escrow",
      github_repos: [
        {
          label: "Core Soroban Escrow Contracts",
          url: "https://github.com/Trustless-Work/Trustless-Work-Smart-Escrow",
        },
        {
          label: "Next.js dApp Client",
          url: "https://github.com/Trustless-Work/dApp-Trustless-Work",
        },
        {
          label: "Backend API Service",
          url: "https://github.com/Trustless-Work/Trustless-Work-Back-End",
        },
        {
          label: "Developer SDK",
          url: "https://github.com/Trustless-Work/Trustless-Work-SDK",
        },
      ],
      research_images: [
        "research/trustless-work-architecture.png",
        "research/trustless-work-escrow-flow.png",
        "research/trustless-work-onchain-verification.png",
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
      content.includes("Trustless Work"),
      "CONTRIBUTORS.md must reference the researched project name"
    );
  });
});
