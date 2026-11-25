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

describe("Soroban Security Scanner Research Submission Validation", () => {
  const researchFilePath = path.join(
    rootDir,
    "research",
    "soroban-security-scanner-submission.md"
  );

  it("should have created the research markdown file", () => {
    assert.ok(
      fs.existsSync(researchFilePath),
      "Research markdown file must exist at research/soroban-security-scanner-submission.md"
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
      "## The Problem Soroban Security Scanner Solves",
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
    const content = fs.readFileSync(researchFilePath, "utf8").toLowerCase();
    for (const marker of ["placeholder", "todo", "tbd", "fixme"]) {
      assert.ok(
        !content.includes(marker),
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
      "soroban-security-scanner-architecture.png",
      "soroban-security-scanner-scan-flow.png",
      "soroban-security-scanner-onchain-verification.png",
    ];

    // The diagrams are rendered deterministically from
    // research/generate-soroban-security-scanner-screenshots.mjs so they stay
    // reviewable as code. Render them before asserting on the produced files.
    const { generateScreenshots } = await import(
      path.join(
        rootDir,
        "research",
        "generate-soroban-security-scanner-screenshots.mjs"
      )
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
      name: "Soroban Security Scanner",
      description:
        "Soroban Security Scanner is an open-source static analysis and vulnerability detection toolkit for Soroban smart contracts written in Rust. It targets the gap that appears whenever a new smart contract platform reaches production use: developers can compile and deploy contracts long before the ecosystem has mature, accessible tooling to tell them whether those contracts are safe. Soroban contracts are ordinary Rust compiled to WebAssembly, but the failure modes that matter on-chain are not ordinary Rust bugs. They are authorization mistakes, missing require_auth calls on privileged entry points, unchecked arithmetic that silently wraps in release builds, storage TTL mismanagement that lets persistent entries expire and strand user funds, and reentrancy-style ordering problems where external token calls happen before internal balance updates. The scanner addresses these by combining a rule-based analysis engine with a CLI that fits into a normal developer workflow. It parses contract source and, where available, the compiled WASM, builds a representation of each contract's entry points, storage keys, and cross-contract calls, and then evaluates a library of security rules against that representation. Each finding is reported with a severity level, the offending source location, an explanation of the underlying risk, and a suggested remediation. Because the rules are declarative and versioned in the repository, the community can add coverage for new vulnerability classes as the Soroban runtime evolves, rather than waiting on a single vendor.",
      category: "Tools",
      stellar_network: "testnet",
      stellar_contract_id:
        "CDMLFMKMMD7MWZP3FKUBZPVHTUEDLSX4BYGYKH4GCESXYHS3IHQ4EIG4",
      stellar_account_id: null,
      tags: "security, static-analysis, soroban, developer-tooling, rust, smart-contracts, auditing, stellar-wave, cli, ci",
      website_url:
        "https://github.com/Soroban-Security-Scanner/Soroban-Security-Scanner",
      github_url:
        "https://github.com/Soroban-Security-Scanner/Soroban-Security-Scanner",
      github_repos: [
        {
          label: "Scanner CLI & Rule Engine",
          url: "https://github.com/Soroban-Security-Scanner/Soroban-Security-Scanner",
        },
      ],
      research_images: [
        "research/soroban-security-scanner-architecture.png",
        "research/soroban-security-scanner-scan-flow.png",
        "research/soroban-security-scanner-onchain-verification.png",
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

  it("should verify the researched project is listed in CONTRIBUTORS.md", () => {
    const contributorsPath = path.join(rootDir, "CONTRIBUTORS.md");
    const content = fs.readFileSync(contributorsPath, "utf8");
    assert.ok(
      content.includes("Soroban Security Scanner"),
      "CONTRIBUTORS.md must reference the researched project name"
    );
  });
});
