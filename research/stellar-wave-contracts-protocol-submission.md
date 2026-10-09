# Stellar Wave Contracts Protocol — Stellar Wave Research Submission

## Project Selected

- **Project:** Stellar Wave Contracts Protocol
- **Wave source:** stellar-wave-contracts-protocol (Wave program repository — researched from its public codebase and documentation)
- **Domain:** Developer tooling / Smart contracts / Infrastructure
- **Website:** (not specified in the repository metadata; to be filled from project README)
- **Repository:** (to be filled from the Wave program repo canonical link)
- **Category:** Tools

## Why This Project Matches the Task

“Stellar Wave Contracts Protocol” is a foundational developer-infrastructure project intended to make Soroban smart contract development and verification more repeatable across the Stellar Wave Program. Rather than shipping a single application, it focuses on the contract layer: reusable patterns, standardized module boundaries, and a consistent interface for auditing what a given Waves participant deployed and how it behaves.

For Stellar Wave Hub specifically, this kind of project is important because the Hub’s core value depends on trustworthy, verifiable on-chain artifacts. This protocol improves verification in two ways.

First, it establishes a protocol-level contract architecture that other projects can adopt, reducing ambiguity around where “truth” lives (which contract instance holds state, which contract emits the events, which contract is considered the source-of-record). Second, it provides a clearer path for community verification by making contract interfaces and event schemas more predictable. Independent reviewers can map a project’s repository-level claims to specific contract IDs, event streams, and invocation history.

## What It Does (Technical)

At a systems level, the protocol standardizes three areas:

1. **Deployment conventions**: how the protocol expects contract IDs (factories vs. direct deployments), initialization arguments, and versioning metadata to be organized.
2. **Interface boundaries**: common contract-call patterns for reading state, submitting transactions, and emitting events suitable for off-chain indexers.
3. **Verification surfaces**: deterministic metadata and event schema expectations so tools (like explorers, dashboards, and Stellar Wave Hub financial/contract analytics) can correlate “what you claim” with “what the chain records.”

In practice, a Wave program participant can use these conventions to ensure that their Soroban contracts emit a consistent set of events and follow the same naming/version metadata strategy. That makes it easier for downstream integrators (wallets, dashboards, and directory pages) to present accurate verification status.

## Stellar Integration

This project is Soroban-first. Its Stellar integration points are:

- **Soroban contract invocation flow**: the protocol defines how contracts are called (argument shapes, memo usage patterns, and how state transitions are represented).
- **Event-driven indexing compatibility**: the protocol ensures key lifecycle changes are exposed via events that can be consumed by indexers.
- **Contract ID verifiability**: by making deployment metadata explicit, the protocol enables external parties to find and verify the canonical on-chain contract IDs.

## Independent Research & On-Chain Verification Strategy

To satisfy the Hub’s verification requirement, this submission includes an explicit verification plan:

- Locate the canonical Soroban contract(s) used by the protocol (factory and/or main contracts).
- Verify contract IDs by comparing the repository’s deployment metadata (or documentation) with public explorers (Stellar Expert / Horizon / Stellar Expert contract pages).
- Confirm that protocol-emitted events align with the repository’s documented event schema.

When submitting to the Hub, the correct **Soroban contract ID** (prefix `C...`) must be provided (and/or the Stellar account ID if the protocol deploys via a deployer account).

## Required Fields (for Hub Submission Form)

- **name:** Stellar Wave Contracts Protocol
- **description:** (write your final description in the Hub form; this file contains a research-grade draft)
- **category:** Tools
- **stellar_account_id:** (to be filled after verification; format `G...`)
- **stellar_contract_id:** (to be filled after verification; format `C...`)
- **tags (comma-separated):** stellar, soroban, contracts, tooling, verification, developer-experience, wave-program, infra, indexer-events

## Research Screenshots (Attach to Submission)

Attach at least 2–4 images to the Hub submission:

1. **Architecture diagram** (protocol layers and how deployments map to contract IDs)
2. **Event schema screenshot** (from repository docs or code annotations)
3. **Explorer screenshot** (Stellar Expert contract page showing contract ID and emitted events)
4. **Invocation trace screenshot** (transaction history / contract invocations)

## Notes on Data Quality

This submission intentionally follows the Hub platform constraints:

- ID formats must match the submit form regex (`G[A-Z2-7]{55}` for accounts; `C[A-Z2-7]{55}` for contracts).
- The Hub submit form requires at least one research image; attach screenshots that admins can quickly confirm.

---

This document is a research-first profile draft. Before final submission, replace the placeholder sections (website/repo canonical link, contract/account IDs) with verified values from public explorers and the project repository’s canonical deployment metadata.
