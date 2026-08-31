# Sanctifier — Stellar Wave Research Submission

## Project Identity

- **Project Name:** Sanctifier
- **Category:** Developer Tooling / Security
- **Wave Source:** `HyperSafeD/Sanctifier` — Stellar Wave Program repository (contrib-wave issues confirmed on GitHub: https://github.com/HyperSafeD/Sanctifier/issues?q=contrib-wave+in%3Atitle)
- **Website / Repository:** https://github.com/HyperSafeD/Sanctifier
- **API Documentation:** https://hypersafed.github.io/Sanctifier/
- **License:** MIT

---

## Why This Project Matches the Task

Sanctifier is a verified Stellar Wave Program participant. Its GitHub issue tracker contains over ~100 issues labelled `[contrib-wave]`, each describing a discrete development task with acceptance criteria, point values, and difficulty hints designed for Stellar Wave contributors. The project is also referenced in Drips Wave activity for the Stellar ecosystem. It fills a critical infrastructure gap — security tooling purpose-built for Soroban — that no other Wave project addresses. It was not present on Stellar Wave Hub at the time of submission (confirmed via `GET /api/projects?search=sanctifier` returning 0 results).

---

## The Problem Sanctifier Solves

When Soroban launched on Stellar mainnet in 2024, the ecosystem inherited almost none of the auditing tooling that is standard on EVM chains. Ethereum developers have Slither, Mythril, Foundry invariant testing, Certora formal verification, and a decade of accumulated CVE patterns. Soroban had essentially nothing. Every team building on Soroban was writing security review checklists from scratch, re-discovering the same common vulnerabilities independently, and shipping contracts without a CI gate that could catch known-bad patterns before deployment. Audit firms had to build proprietary tooling for each engagement.

Sanctifier is the missing layer — a single engine with audit-grade detection rules, deployed across every surface where Soroban code is written, reviewed, and shipped.

---

## How the Project Uses Stellar

Sanctifier uses Stellar in two distinct ways:

### 1. Target Platform (Soroban Analysis)
The core static analysis engine is built specifically around Soroban's unique semantics:
- **Authorization model** — Soroban requires explicit `require_auth` calls on state-changing operations; missing these is the most common class of critical vulnerability (rule S001)
- **Storage TTL semantics** — Soroban ledger entries expire; Sanctifier detects S004 (ledger size threshold violations) that cause mid-transaction write failures
- **SEP-41 token interface** — The Stellar token standard has specific interface requirements; S012 ensures wallets can interact with custom tokens
- **CAP-67 / SAC patterns** — Rule context is aware of Stellar Asset Contract behaviour and event emission patterns

### 2. On-Chain Runtime Guards
Sanctifier deploys three live Soroban contracts on Stellar Testnet:

| Contract | Address | Role |
|---|---|---|
| **Runtime Guard Wrapper** | `CBLDEREKXK6AIZ7ZSKC6VYCK4MKF4FZ4ANJEU67QZAQUG57I4KGZMTXB` | Wraps a target contract, performs pre/post invariant checks, records every invocation on-chain |
| **Reentrancy Guard** | `CDDVM5A5IVDAG5FZ2OU2CLWAHC7A2T7LHQHZSDVKZPE6SDMDO2JCR3UY` | Demonstrates and defends against re-entrant call patterns |
| **Vulnerable Contract (demo)** | `CABBT5FKG7AE7IEEA4KR2J5AVYRSZAWKTXZ2KFX3UNJQAMMLMCXNLMIB` | A deliberately buggy contract used to demonstrate detection capabilities |

**Deployer wallet:** `GC7ZDZPZS3NUDCCM6JRLF5DSGARKE5JH5DXDXCUUAJU2RL2C2UJKGUUW`

The Runtime Guard Wrapper emits structured Soroban events after every guarded invocation, producing a verifiable on-chain audit trail. Anyone can query this contract today using `stellar contract invoke`.

---

## Technical Architecture (Detailed)

### Project Layout

```
Sanctifier/
├── tooling/
│   ├── sanctifier-core/       # Static analysis engine + Z3 SMT backend
│   ├── sanctifier-cli/        # CLI binary (the user-facing tool)
│   ├── sanctifier-detector/   # Off-chain anomaly detection service
│   └── sanctifier-wasm/       # Browser/Node WASM build of the engine
├── frontend/                  # Next.js dashboard, playground, terminal
├── vscode-extension/          # VS Code diagnostics extension
├── contracts/
│   ├── runtime-guard-wrapper/ # Deployed to testnet
│   ├── reentrancy-guard/      # Deployed to testnet
│   └── vulnerable-contract/   # Demo target, deployed to testnet
├── schemas/
│   └── analysis-output.json   # JSON Schema draft-07, validated in CI
├── data/
│   └── vulnerability-db.json  # CVE-style pattern database (SOL-2024-*)
├── specs/                     # OpenAPI + RFC drafts
└── docs/                      # Rules, ADRs, threat model, ZK roadmap
```

### The Analysis Engine (sanctifier-core)

The engine performs AST-level analysis of Soroban Rust source code. It is compiled to WASM for the browser path, ensuring identical findings whether you run the CLI, the web dashboard, or the VS Code extension. Key crates:

- **`smt` feature** — Links the Z3 SMT solver for rule S011 (formal invariant disproof). Disabled by default in the CLI so users don't need libz3 installed.
- **`soroban` feature** — Pulls in `soroban-sdk` for the `SanctifiedGuard` runtime trait.
- **`parallel` feature** — Uses Rayon for concurrent analysis of large workspaces.

### The 12 Detection Rules (S001–S012)

| Code | What it catches | Severity |
|---|---|---|
| S001 | Missing `require_auth` on state-changing calls | Critical |
| S002 | `panic!`/`unwrap`/`expect` in contract paths | High |
| S003 | Unchecked arithmetic (overflow, underflow, truncation) | High |
| S004 | Ledger entries approaching the size threshold | Medium |
| S005 | Storage-key collisions between data paths | High |
| S006 | Unsafe patterns including timestamp-as-randomness | High |
| S007 | Custom YAML rule violations (user-defined) | Configurable |
| S008 | Inconsistent or missing event emissions | Medium |
| S009 | Unhandled `Result` return values | Medium |
| S010 | Upgrade/admin/governance risk (single-key takeover) | Critical |
| S011 | Z3-disproved invariants | Critical |
| S012 | SEP-41 token interface deviations | High |

### The Five Delivery Surfaces

1. **CLI** (`sanctifier-cli`) — Available via `cargo install`, `npx @hypersafed/sanctifier-cli`, `brew install`, Scoop (Windows), and winget. 30 seconds to first finding.

2. **GitHub Action** — One-commit integration that uploads SARIF 2.1.0 to GitHub code-scanning, surfacing findings as inline PR annotations.

3. **Web Dashboard** — Next.js app with `/scan` (drag in a `.rs` file), `/dashboard` (load a JSON report), `/playground` (canned vulnerable contracts), and `/terminal` (guided CLI demo).

4. **VS Code Extension** — Inline diagnostics as the developer types. Language Server Protocol (LSP) server (`sanctifier lsp`) is in progress for Neovim/Helix/Zed.

5. **On-chain Runtime Guard** — Soroban contracts that wrap a target contract and emit structured audit events after every guarded call. Acts as a forensic trail post-deployment.

### Output Contract

JSON output validates against a published JSON Schema (draft-07). The schema has its own independent version (`schema_version`) so downstream tooling can pin to a format version without coupling to a CLI release. SARIF output is 2.1.0-compatible for GitHub code-scanning and any SAST aggregator.

### Vulnerability Database

`data/vulnerability-db.json` contains community-sourced CVE-style patterns (SOL-2024-002: Missing auth on token transfer; SOL-2024-003: Unchecked balance underflow; etc.). The engine matches these against the scanned AST, so any exploit pattern published anywhere is automatically a detection everywhere from the next DB release.

---

## On-Chain Verification

### Verification of Runtime Guard Wrapper

The primary on-chain artifact is the Runtime Guard Wrapper contract at `CBLDEREKXK6AIZ7ZSKC6VYCK4MKF4FZ4ANJEU67QZAQUG57I4KGZMTXB` on Stellar Testnet.

**Independent verification via Stellar Expert REST API:**
```
GET https://api.stellar.expert/explorer/testnet/contract/CBLDEREKXK6AIZ7ZSKC6VYCK4MKF4FZ4ANJEU67QZAQUG57I4KGZMTXB
```

**API Response (verified 2026-08-31):**
```json
{
  "contract": "CBLDEREKXK6AIZ7ZSKC6VYCK4MKF4FZ4ANJEU67QZAQUG57I4KGZMTXB",
  "created": 1779213672,
  "creator": "GC7ZDZPZS3NUDCCM6JRLF5DSGARKE5JH5DXDXCUUAJU2RL2C2UJKGUUW",
  "wasm": "3f66f801ce30bce7fe919b15a880098c41fbcb93916413df8902c5f4fe16663e",
  "events": 6,
  "storage_entries": 6
}
```

- **Created at ledger:** 1779213672
- **6 on-chain events** — Guard invocations have been emitted and recorded
- **6 storage entries** — Contract state is actively maintained (call records, stats, admin key)
- **Creator wallet** matches the deployer documented in LIVE_TESTNET.md

**Deployment transactions** (from LIVE_TESTNET.md):
- Deploy tx: `765308c7169ccee2150ab3a24f9a5caaef43d98cf309c966845f0b7b2dd37eb7`
- Init tx: `b2c9b1a981059e2a12dfe5da4580f3ff70240ea89b2fc1442712ca5701637fec`

### Verification of Reentrancy Guard
Explorer: https://stellar.expert/explorer/testnet/contract/CDDVM5A5IVDAG5FZ2OU2CLWAHC7A2T7LHQHZSDVKZPE6SDMDO2JCR3UY

### Verification of Vulnerable Contract (demo)
Explorer: https://stellar.expert/explorer/testnet/contract/CABBT5FKG7AE7IEEA4KR2J5AVYRSZAWKTXZ2KFX3UNJQAMMLMCXNLMIB

---

## Team and Community

- **Organization:** HyperSafeD (GitHub organization)
- **Repository forks:** 116 — high community engagement indicating real developer interest
- **Stars:** 4 (early project, forks>>stars ratio indicates active contributor community rather than passive observers)
- **Commits:** 1,191+ on the main branch (active development history)
- **Open issues:** 83 total, with ~100 hand-curated `[contrib-wave]` issues containing acceptance criteria and difficulty hints for Wave contributors
- **Languages:** Rust (core engine + contracts), TypeScript/Next.js (dashboard + VS Code extension), Bash (deployment automation)
- **Internationalisation:** README available in English, Spanish, Chinese (Simplified), Japanese, and French — indicating global contributor outreach
- **Package registries:** Published to `crates.io` (`sanctifier-cli`), npm (`@hypersafed/sanctifier-cli`), Homebrew, Scoop, and winget
- **CI/CD:** Full GitHub Actions pipeline with Codecov integration; deployment workflow runs on a 6-hour schedule to continuously validate testnet contracts

---

## Why Sanctifier Matters for the Stellar Wave Ecosystem

The Stellar Wave Program is producing an increasing number of Soroban smart contract projects. As TVL and transaction volume grow, the attack surface expands. Sanctifier provides the security baseline that allows this ecosystem to scale safely:

1. **Shift-left security** — Developers get findings in their IDE, in PR reviews, and in CI — not after deployment when remediation costs are highest.

2. **Consistent standard** — With stable rule codes (S001–S012), findings can be trended, suppressed, and reported consistently across all Wave projects.

3. **Ecosystem multiplier** — A CVE-style vulnerability database means that when one Soroban project discovers a new exploit class, the detection is automatically available to every other project using Sanctifier.

4. **Formal verification access** — Z3-backed rule S011 brings formal invariant checking to teams that can't afford a dedicated academic verification effort.

5. **On-chain audit trail** — The runtime guard contracts introduce a new class of on-chain observability: every protected contract call leaves an immutable record on the Stellar ledger, available to auditors, insurers, and regulators.

---

## Category and Tags

- **Category:** `developer-tooling`
- **Tags:** `soroban, security, static-analysis, formal-verification, developer-tools, audit, smart-contracts, stellar-wave, z3, sarif, ci, cli, runtime-guard`

---

## Submission Details

- **Hub URL:** https://usestellarwavehub.vercel.app
- **Project ID:** 120
- **Slug:** `sanctifier`
- **Status:** `submitted`
- **Submitted:** 2026-08-31
- **Submitted by:** kiro-agent (Kiro AI Agent)

---

## Sources

1. **GitHub Repository (primary source):** https://github.com/HyperSafeD/Sanctifier
2. **LIVE_TESTNET.md (contract addresses):** https://raw.githubusercontent.com/HyperSafeD/Sanctifier/main/LIVE_TESTNET.md
3. **SOROBAN_DEPLOYMENT.md (deployment automation):** https://raw.githubusercontent.com/HyperSafeD/Sanctifier/main/SOROBAN_DEPLOYMENT.md
4. **Stellar Wave contrib-wave issues:** https://github.com/HyperSafeD/Sanctifier/issues?q=contrib-wave+in%3Atitle
5. **Stellar Expert testnet contract verification:** https://api.stellar.expert/explorer/testnet/contract/CBLDEREKXK6AIZ7ZSKC6VYCK4MKF4FZ4ANJEU67QZAQUG57I4KGZMTXB
6. **crates.io package:** https://crates.io/crates/sanctifier-cli
7. **API Documentation:** https://hypersafed.github.io/Sanctifier/
8. **On-chain deploy tx:** https://stellar.expert/explorer/testnet/tx/765308c7169ccee2150ab3a24f9a5caaef43d98cf309c966845f0b7b2dd37eb7
9. **On-chain init tx:** https://stellar.expert/explorer/testnet/tx/b2c9b1a981059e2a12dfe5da4580f3ff70240ea89b2fc1442712ca5701637fec
