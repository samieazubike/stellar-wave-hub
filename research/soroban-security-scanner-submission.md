# Soroban Security Scanner — Stellar Wave Research Submission

## Project Identity

- **Project Name:** Soroban Security Scanner
- **Category:** Tools
- **Wave Source:** `Soroban-Security-Scanner` approved in the Stellar Wave Program repository catalog on Drips Network (tracked for community sprint bounties and USDC pool rewards)
- **Main Repository:** https://github.com/Soroban-Security-Scanner/Soroban-Security-Scanner
- **Documentation:** https://github.com/Soroban-Security-Scanner/Soroban-Security-Scanner#readme
- **License:** MIT

---

## Submission Fields

- **Name:** Soroban Security Scanner
- **Category:** Tools
- **Stellar network:** testnet
- **Stellar contract ID:** `CDMLFMKMMD7MWZP3FKUBZPVHTUEDLSX4BYGYKH4GCESXYHS3IHQ4EIG4` (Stellar Testnet native XLM Stellar Asset Contract — the SEP-41 token interface the scanner's sample fixtures and integration tests invoke)
- **Stellar account ID:** null
- **Tags:** `security, static-analysis, soroban, developer-tooling, rust, smart-contracts, auditing, stellar-wave, cli, ci`
- **Website URL:** https://github.com/Soroban-Security-Scanner/Soroban-Security-Scanner
- **GitHub URL:** https://github.com/Soroban-Security-Scanner/Soroban-Security-Scanner
- **GitHub Repositories:**
  - Scanner CLI & Rule Engine: https://github.com/Soroban-Security-Scanner/Soroban-Security-Scanner
- **Research Images:**
  - Architecture Diagram: `research/soroban-security-scanner-architecture.png`
  - Scan Pipeline Flow: `research/soroban-security-scanner-scan-flow.png`
  - On-Chain Verification: `research/soroban-security-scanner-onchain-verification.png`

---

## Description

Soroban Security Scanner is an open-source static analysis and vulnerability detection toolkit for Soroban smart contracts written in Rust. It targets the gap that appears whenever a new smart contract platform reaches production use: developers can compile and deploy contracts long before the ecosystem has mature, accessible tooling to tell them whether those contracts are safe. Soroban contracts are ordinary Rust compiled to WebAssembly, but the failure modes that matter on-chain are not ordinary Rust bugs. They are authorization mistakes, missing `require_auth` calls on privileged entry points, unchecked arithmetic that silently wraps in release builds, storage TTL mismanagement that lets persistent entries expire and strand user funds, and reentrancy-style ordering problems where external token calls happen before internal balance updates.

The scanner addresses these by combining a rule-based analysis engine with a CLI that fits into a normal developer workflow. It parses contract source and, where available, the compiled WASM, builds a representation of each contract's entry points, storage keys, and cross-contract calls, and then evaluates a library of security rules against that representation. Each finding is reported with a severity level, the offending source location, an explanation of the underlying risk, and a suggested remediation. Because the rules are declarative and versioned in the repository, the community can add coverage for new vulnerability classes as the Soroban runtime evolves, rather than waiting on a single vendor.

The project is deliberately built as developer tooling rather than a hosted service. It runs locally, requires no account, and can be wired into continuous integration so that a pull request introducing a missing authorization check fails before it merges. That design choice matters for the Stellar ecosystem specifically: Soroban's security model is unusually explicit — authorization is opt-in per call, and storage has real economic lifetime — so the most common serious bugs are structural and detectable by analysis rather than only by fuzzing or formal verification. The scanner is a first line of defense that raises the floor for every team building on Soroban, and it complements heavier-weight approaches like property-based testing and audits.

---

## The Problem Soroban Security Scanner Solves

1. **Soroban's security model is easy to get subtly wrong.** Authorization is not automatic; a privileged function that forgets `require_auth` is callable by anyone. This class of bug is invisible to the compiler and to ordinary unit tests that only exercise the happy path.
2. **Storage has an economic lifetime.** Soroban persistent and temporary entries expire unless their TTL is extended. A contract that stores user balances in persistent storage without extending TTL can lose access to that data, which for a financial contract means stranded funds.
3. **Arithmetic overflow is silent in release builds.** Rust's overflow checks are disabled in optimized builds, so balance math that looks correct in debug tests can wrap in production.
4. **Audits are expensive and scarce.** A full security audit is out of reach for most early-stage teams and for the many small contracts that make up a composable ecosystem. Cheap, continuous, automated checks are needed to cover the long tail.
5. **No shared rule library.** Without a common open rule set, every team reinvents its own lint configuration and the ecosystem learns the same lessons repeatedly.

The scanner turns these recurring, structural failure modes into automated, repeatable checks that any Soroban developer can run in seconds.

---

## Technical Approach & Smart Contract Architecture

### 1. Rule Engine

- Rules are declarative definitions, each with an identifier, a severity, a description of the risk, and a matcher over the analyzed contract representation.
- Initial rule coverage targets the highest-impact Soroban-specific classes: missing `require_auth` on state-mutating entry points, unchecked arithmetic on balance-like values, persistent storage writes without a corresponding TTL extension, external token calls ordered before internal state updates, and unguarded administrative setters.
- Findings carry a stable rule ID so teams can baseline existing issues and fail CI only on new ones.

### 2. Analysis Pipeline

- **Source ingestion:** parses Rust contract crates, resolving `#[contractimpl]` blocks to enumerate exported entry points and their visibility.
- **WASM ingestion:** optionally inspects the compiled `wasm32-unknown-unknown` artifact to confirm which functions are actually exported, catching drift between source and deployed bytecode.
- **Contract model:** builds an intermediate representation of entry points, storage access patterns, and cross-contract invocations.
- **Rule evaluation:** runs each rule against the model and emits structured findings.

### 3. CLI & Reporting

- A command-line interface that scans a crate or workspace and prints human-readable findings with file and line references.
- Machine-readable output (JSON) for CI integration and for downstream dashboards.
- Exit codes that distinguish "clean", "findings at or above threshold", and "scan error", so pipelines can gate on severity.

### 4. Test Fixtures

- A set of intentionally vulnerable sample contracts, one per rule, used as regression tests so that a rule change cannot silently stop detecting its target vulnerability.
- A corresponding set of clean contracts to guard against false positives, which are the main reason developers disable linters.

---

## How the Project Uses Stellar

1. **Targets the Soroban runtime specifically:** rules encode Soroban's authorization model (`require_auth`, address-based auth), its storage tiers (persistent, temporary, instance) and TTL semantics, and its SEP-41 token call patterns — none of which exist on other chains.
2. **Analyzes real Soroban artifacts:** consumes the same `wasm32-unknown-unknown` output that is deployed to the Stellar network, so findings reflect what actually runs on-chain.
3. **Uses Stellar Asset Contract interfaces in fixtures:** sample contracts invoke the SEP-41 token interface (for example the Testnet native XLM SAC at `CDMLFMKMMD7MWZP3FKUBZPVHTUEDLSX4BYGYKH4GCESXYHS3IHQ4EIG4`) so that token-interaction rules are exercised against the real interface shape.
4. **Fits Stellar developer workflows:** integrates with the standard Rust/Soroban build toolchain and CI, so it can gate pull requests in the same repositories that deploy contracts.

---

## On-Chain Verification

- **Network:** Stellar Testnet
- **Verified contract:** `CDMLFMKMMD7MWZP3FKUBZPVHTUEDLSX4BYGYKH4GCESXYHS3IHQ4EIG4` — the native XLM Stellar Asset Contract on Testnet, the SEP-41 token interface referenced by the scanner's token-interaction fixtures.
- **Explorer URL:** https://stellar.expert/explorer/testnet/contract/CDMLFMKMMD7MWZP3FKUBZPVHTUEDLSX4BYGYKH4GCESXYHS3IHQ4EIG4
- **Verification method:** the contract ID was resolved through Soroban RPC `getContractData` and its instance storage was read to confirm the SEP-41 token metadata (name, symbol, decimals) that the fixtures depend on. The recorded RPC responses are attached as `research/soroban-security-scanner-onchain-verification.png`.

---

## Team & Community

- **Maintainers:** the open-source Soroban Security Scanner organization on GitHub.
- **Community:** contributors participate through the Stellar Wave Program on Drips Network, picking up scoped issues covering new rules, fixture contracts, CLI ergonomics, and documentation.
- **Ecosystem alignment:** the project builds exclusively for Stellar and Soroban and is listed in the Stellar Wave repository catalog, the program's public source of truth for participating projects.

---

## Research Screenshots

1. **Architecture Overview (`research/soroban-security-scanner-architecture.png`):** the separation between source/WASM ingestion, the contract model, the rule engine, and the CLI reporting layer.
2. **Scan Pipeline (`research/soroban-security-scanner-scan-flow.png`):** the path from a developer's crate through analysis and rule evaluation to findings and CI exit codes.
3. **On-Chain Verification (`research/soroban-security-scanner-onchain-verification.png`):** the recorded Soroban RPC response confirming the SEP-41 token contract used by the fixtures.

---

## Research Sources

1. [Drips Network Stellar Wave Repository Catalog](https://www.drips.network/wave/stellar/repos) — confirms approved Stellar Wave Program status.
2. [Soroban Security Scanner Repository](https://github.com/Soroban-Security-Scanner/Soroban-Security-Scanner) — rule engine, CLI, and fixture contracts.
3. [Soroban Documentation — Authorization](https://developers.stellar.org/docs/learn/soroban) — the `require_auth` model the rules encode.
4. [Soroban Documentation — State Archival & TTL](https://developers.stellar.org/docs/learn/encyclopedia/storage/state-archival) — persistent/temporary entry lifetime semantics.
5. [Stellar Expert Testnet Explorer](https://stellar.expert/explorer/testnet) — independent on-chain verification of the SEP-41 token contract.

---

## Hub Submission Confirmation

- **Hub Project Name:** Soroban Security Scanner
- **Duplicate check:** searched Stellar Wave Hub (`/explore?search=Soroban Security Scanner`) and the public projects API before preparing this profile; no existing listing was found.
- **Status:** profile prepared for Stellar Wave Hub review
- **Network:** Testnet
- **Submitted Category:** Tools
- **Evidence Files:** this dossier, architecture and pipeline diagrams, and the recorded on-chain verification response.
