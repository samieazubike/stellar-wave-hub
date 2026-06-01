# Akkuea — Research Report

**Stellar Wave Program participant** · Drips: [akkuea/akkuea](https://drips.network/wave/stellar) · GitHub: [github.com/akkuea/akkuea](https://github.com/akkuea/akkuea)

---

## What is Akkuea?

Akkuea is an institutional-grade Real-World Asset (RWA) tokenization and DeFi lending platform built on the Stellar blockchain. Its core thesis is that two problems in traditional finance are tightly coupled and can be solved together on-chain:

1. **Real estate illiquidity** — property is one of the largest asset classes in the world, yet it is almost impossible to trade fractionally, transfer programmatically, or use as collateral in a DeFi context.
2. **Collateral limitations in DeFi** — most DeFi lending protocols accept only volatile crypto assets as collateral, which limits the addressable market and creates systemic risk.

Akkuea bridges these two gaps: property owners tokenize their real estate into on-chain fractional shares, and investors can then use those shares as collateral to borrow from DeFi lending pools — all on Stellar's high-throughput, low-cost network.

The project is licensed under MIT and developed by Acachete Labs. As of June 2026 it is the highest-starred repository in the Stellar Wave Program (42 stars, 232 forks), with 1,680+ commits across its `develop` branch.

---

## How Akkuea Uses Stellar

Akkuea is built entirely on Stellar and Soroban. Its Stellar integration is deep and multi-layered:

### Soroban Smart Contracts (Rust)

The platform deploys a **single WASM binary** (`real_estate_defi_contracts.wasm`) that contains both the property tokenization and DeFi lending logic. This is a deliberate architectural choice: one contract ID, one deployment, one source of truth.

The contract (`apps/contracts/contracts/defi-rwa/src/lib.rs`) exposes:

- **Share management** — `mint_shares`, `burn_shares`, `transfer_shares`: property ownership is represented as on-chain shares, minted by a KYC-verified admin and transferable between wallets.
- **Property purchases** — `purchase_shares`: investors buy fractional ownership directly on-chain.
- **Lending pools** — `create_pool`, `deposit`, `borrow`, `repay`: each asset (e.g. XLM, USDC) has its own pool with configurable collateral factor, liquidation threshold, and reserve factor.
- **Access control** — role-based (`Admin`, `Pauser`, `Oracle`, `Verifier`, `Liquidator`, `EmergencyGuard`) enforced at the contract level, not just the API.
- **Emergency controls** — `pause`, `schedule_recovery`, `execute_recovery`: the contract can be paused by an authorized guardian without requiring an upgrade.
- **Oracle integration** — a SEP-40 compatible price feed is required before any `borrow()` call. The oracle has configurable staleness guardrails (`max_age`, default 3600 s) to reject stale price data.

**Deployed contract IDs (Stellar Testnet):**

| Contract | ID |
|---|---|
| `REAL_ESTATE_TOKEN` | `CBFQV2RY5VHVFU3HT2I72FLXWY5YNZC37LWJSOZQCX45B76NBO4YZHM4` |
| `DEFI_LENDING` | `CBFOZBCYMIDIZLNHT6ANMBU6LSGC6REM6Z5M4ST35E5T5FDWWZAWZLTX` |

Both IDs are committed to the repository at `apps/shared/src/contracts.testnet.json` and are the canonical deployment artifacts used by the API and frontend.

### Stellar Horizon API

The backend API (`apps/api`, Elysia/Bun) connects to Stellar Horizon (`https://horizon-testnet.stellar.org`) for account balance queries, transaction history, and event streaming. The `@stellar/stellar-sdk` is used throughout the shared library for address validation, keypair management, and transaction construction.

### Wallet Authentication

Users authenticate via Stellar wallet signatures — no passwords, no centralized auth. The platform integrates `@creit.tech/stellar-wallets-kit` to support Freighter, xBull, and other Stellar-compatible wallets.

---

## Architecture

Akkuea is a **Bun monorepo** with four workspaces:

```
akkuea/
├── apps/
│   ├── webapp/       # Next.js 16 + React 19 frontend
│   ├── api/          # Elysia REST API (Bun runtime)
│   ├── shared/       # Types, Stellar SDK helpers, contract IDs
│   └── contracts/    # Soroban smart contracts (Rust)
└── docs/             # Architecture, deployment, API, operations guides
```

The data flows are:

**Property Tokenization:**
```
User submits property → Frontend validates → API verifies KYC
→ Soroban contract mints shares → Event emitted → API indexes
→ Frontend reflects updated portfolio
```

**DeFi Borrowing:**
```
User requests loan → Frontend calculates available collateral
→ API checks on-chain share balance → Contract validates collateral ratio
→ Contract disburses funds → Frontend updates lending position
```

**Tech stack summary:**

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Zustand |
| Backend API | Elysia, Bun runtime, TypeScript, Drizzle ORM |
| Database | PostgreSQL (Drizzle migrations), optional Redis cache |
| Smart Contracts | Rust, Soroban SDK 25, WASM |
| Blockchain | Stellar (Testnet/Mainnet), Horizon REST API, Soroban RPC |
| Wallet | `@creit.tech/stellar-wallets-kit` |
| CI/CD | GitHub Actions (5 independent workflows) |

---

## Key Features

### KYC/AML On-Chain

Compliance is enforced at the smart contract level, not just the application layer. The `Verifier` role controls who can mint property shares, and KYC documents are stored with an immutable audit trail. This is a meaningful differentiator from most DeFi protocols that treat compliance as an off-chain concern.

### Institutional-Grade Lending Parameters

Each lending pool has independently configurable:
- **Collateral factor** (e.g. 75% — borrower can borrow up to 75% of collateral value)
- **Liquidation threshold** (e.g. 80% — position becomes liquidatable above this ratio)
- **Liquidation penalty** (e.g. 10% bonus for liquidators)
- **Reserve factor** (e.g. 1% of interest to protocol reserve)

These parameters mirror the design of established DeFi protocols like Aave and Compound, adapted for real estate collateral.

### Oracle Guardrails

The contract rejects price data older than a configurable `max_age` (default 3600 seconds). This prevents stale oracle data from enabling under-collateralized borrows — a common attack vector in DeFi lending protocols.

### Upgradeable Contracts

Soroban supports WASM upgrades without changing the contract ID. Akkuea's deployment guide documents the upgrade path (`stellar contract upload` → `upgrade` function), meaning the protocol can be improved without migrating user positions.

---

## On-Chain Activity

Both contracts are deployed and verifiable on Stellar Testnet:

- **REAL_ESTATE_TOKEN**: `CBFQV2RY5VHVFU3HT2I72FLXWY5YNZC37LWJSOZQCX45B76NBO4YZHM4`
- **DEFI_LENDING**: `CBFOZBCYMIDIZLNHT6ANMBU6LSGC6REM6Z5M4ST35E5T5FDWWZAWZLTX`

Verifiable via Stellar Expert (testnet): `https://stellar.expert/explorer/testnet/contract/<CONTRACT_ID>`

The repository has 1,680+ commits, 5 active CI workflows (monorepo, API, webapp, shared, contracts), and all five must pass before any PR merges. The contracts CI workflow runs `cargo fmt`, `clippy`, unit tests, and a WASM build on every push.

---

## Team & Community

- **Organization**: Acachete Labs
- **GitHub**: [github.com/akkuea](https://github.com/akkuea)
- **Repository**: 42 stars, 232 forks (highest in the Stellar Wave Program as of June 2026)
- **Drips Wave**: Approved at 4x Points multiplier (highest tier)
- **Open issues**: 9 open issues across the monorepo
- **Active PRs**: 9 open pull requests

The project has a detailed `CONTRIBUTING.md` enforcing a fork-based workflow, and comprehensive documentation under `docs/` covering architecture, deployment, API flows, KYC workflow, and operations runbooks.

---

## Why This Project Matters

Real estate tokenization on Stellar is a natural fit: Stellar's sub-second finality and ~$0.0007 average fee make fractional property transfers economically viable at any scale. Akkuea is one of the few Wave projects tackling the RWA space with institutional compliance requirements (KYC/AML on-chain, role-based access, audit trails) rather than treating compliance as an afterthought.

The combination of RWA tokenization + DeFi lending in a single Soroban contract is technically ambitious. The oracle guardrail design (configurable staleness threshold, price floor) shows awareness of real DeFi attack vectors. The upgrade path without contract ID migration is a production-readiness detail that many early-stage projects overlook.

Stellar's DeFi TVL crossed $200M in April 2026, driven in part by institutional RWA flows. Akkuea is positioned directly in that trend.

---

## Submission Details

- **Name**: Akkuea
- **Category**: DeFi / RWA
- **Tags**: `rwa`, `defi`, `real-estate`, `tokenization`, `lending`, `soroban`, `stellar-wave`
- **Stellar Contract ID (testnet)**: `CBFQV2RY5VHVFU3HT2I72FLXWY5YNZC37LWJSOZQCX45B76NBO4YZHM4`
- **GitHub**: https://github.com/akkuea/akkuea
- **Drips**: https://drips.network/wave/stellar (akkuea/akkuea, 4x Points)
