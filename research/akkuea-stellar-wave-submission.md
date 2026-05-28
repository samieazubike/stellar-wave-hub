# Akkuea — Stellar Wave Research Submission

## Project Identity

- **Project Name:** Akkuea
- **Category:** DeFi / RWA (Real-World Assets)
- **Wave Source:** `akkuea/akkuea` on Stellar Wave Drips — **4x Points tier**
- **Repository:** [github.com/akkuea/akkuea](https://github.com/akkuea/akkuea)
- **License:** MIT (Acachete Labs)

---

## Why This Project

Akkuea is the highest-starred project in the Stellar Wave Program (42 stars, 229 forks, 1,595 commits as of May 2026) and sits at the intersection of two of the most significant trends in blockchain: Real-World Asset (RWA) tokenization and DeFi lending. It is not a prototype — it is an institutional-grade platform with a full monorepo, five independent CI pipelines, comprehensive documentation, and a production-ready Soroban smart contract. It had not been submitted to Stellar Wave Hub at the time of this research.

---

## What Akkuea Does

Akkuea solves two tightly coupled problems that have historically kept real estate out of DeFi:

**Problem 1 — Illiquidity of real estate.** Traditional property ownership is binary: you own it or you don't. Akkuea tokenizes properties into fractional on-chain shares, making it possible to trade, transfer, and leverage real-world assets with the same programmability as any blockchain token.

**Problem 2 — Collateral limitations in DeFi.** Most DeFi lending protocols only accept volatile crypto assets as collateral, which creates systemic risk and limits participation. Akkuea accepts tokenized real estate shares as collateral, unlocking lending capacity backed by tangible, regulated assets.

The platform targets institutional participants who need KYC/AML compliance enforced at the smart contract level, not just at the application layer. This is a meaningful distinction: compliance logic lives in the Soroban contract itself, making it auditable and tamper-resistant rather than dependent on a centralized server.

The user journey has two primary paths:

**Property Tokenization:**
1. Property owner submits property details and KYC documents via the frontend
2. API verifies KYC compliance
3. Soroban contract mints fractional shares representing ownership
4. Shares appear in the owner's on-chain portfolio, tradeable and usable as collateral

**DeFi Borrowing:**
1. Borrower deposits tokenized real estate shares as collateral
2. API checks on-chain share balance and current oracle price
3. Contract validates the collateral ratio against the pool's configured `collateral_factor`
4. Contract disburses the loan; position is tracked on-chain
5. If the collateral ratio falls below `liquidation_threshold`, the position becomes liquidatable

---

## Technical Architecture

Akkuea is a **Bun monorepo** with four workspaces:

| Workspace | Path | Role |
|---|---|---|
| `@akkuea/webapp` | `apps/webapp` | Next.js 16 + React 19 frontend |
| `@akkuea/api` | `apps/api` | Elysia REST API on Bun runtime |
| `@akkuea/shared` | `apps/shared` | Shared TypeScript types, utils, Stellar SDK helpers |
| Contracts | `apps/contracts` | Soroban smart contracts in Rust |

### Smart Contract Layer (`apps/contracts`)

Akkuea deploys a **single WASM binary** — `real_estate_defi_contracts.wasm` — that contains both the property tokenization and DeFi lending logic. The contract is named `PropertyTokenContract` and exposes the following function groups:

- **Share management:** `mint_shares`, `burn_shares`, `transfer_shares`, `get_balance`
- **Property purchases:** `purchase_shares`
- **Lending pools:** `create_pool`, `deposit`, `borrow`, `repay`, `get_pool`
- **Oracle:** `set_oracle`, `set_oracle_config`, `get_oracle_config`
- **Access control:** `grant_emergency_role`, `grant_role`, admin transfer
- **Emergency controls:** `pause`, `schedule_recovery`, `execute_recovery`
- **Upgrades:** `upgrade` (WASM hash-based, no contract ID change)

The contract uses a **SEP-40 compatible price oracle** for collateral valuation. A configurable staleness guard (`max_age`, default 3600 seconds) rejects stale price data — a production-grade safety mechanism that prevents lending against outdated valuations. The `min_price` floor parameter adds a second layer of protection against oracle manipulation.

Role-based access control is enforced at the contract level with six distinct roles: `Admin`, `Pauser`, `Oracle`, `Verifier`, `Liquidator`, and `EmergencyGuard`. This granularity allows operational separation — an on-call operator can hold `EmergencyGuard` without having admin privileges.

Lending pool parameters are configurable per pool:
- `collateral_factor` (e.g., 75% — max borrow against collateral value)
- `liquidation_threshold` (e.g., 80% — position becomes liquidatable above this ratio)
- `liquidation_penalty` (e.g., 10% — liquidator bonus)
- `reserve_factor` (basis points — protocol fee on interest)

### Backend API (`apps/api`)

Built on **Elysia** running on the **Bun runtime** — a deliberate choice for performance. Elysia is a TypeScript-first framework with end-to-end type safety and built-in Swagger documentation. The API exposes a health endpoint (`/health`), Swagger docs (`/swagger`), and REST endpoints for all platform operations.

Key responsibilities:
- Orchestrating Soroban contract invocations (the frontend never calls the contract directly)
- KYC document upload and verification workflow
- Transaction monitoring via Stellar event streaming
- PostgreSQL persistence via **Drizzle ORM** with migration support
- Optional Redis caching layer for frequently accessed data
- Webhook signature verification for all external integrations
- Rate limiting and structured audit logging

### Frontend (`apps/webapp`)

Next.js 16 with React 19, TypeScript, Tailwind CSS 4, Zustand for state management, and Zod for runtime validation. Wallet integration uses `@creit.tech/stellar-wallets-kit`, which abstracts Freighter, Albedo, and other Stellar wallets behind a unified interface. Authentication is wallet-based — users sign a challenge with their Stellar key, eliminating passwords and centralized auth servers.

### CI/CD

Five independent GitHub Actions workflows run on every push and PR to `main` and `develop`:

| Workflow | Checks |
|---|---|
| `monorepo-ci.yml` | Workspace integrity, dependency audit, bundle sizes, cross-workspace integration |
| `api-ci.yml` | Lint, type-check, unit tests, build |
| `webapp-ci.yml` | Lint, type-check, unit tests, build |
| `shared-ci.yml` | Lint, type-check, build |
| `contracts-ci.yml` | Rust format, Clippy, unit tests, WASM build |

All five must pass before any PR can merge — a rigorous standard that explains the high commit count and active contributor base.

---

## Stellar Integration

Akkuea integrates with Stellar at three levels:

**1. Soroban Smart Contracts** — The core business logic (tokenization, lending, collateral management) runs entirely on Soroban. The single WASM contract is deployed via `stellar contract deploy` and upgraded in-place via WASM hash replacement, preserving the contract ID across upgrades.

**2. Stellar Horizon API** — Used for account monitoring, transaction history, and event streaming. The API monitors contract-emitted events to keep the PostgreSQL database in sync with on-chain state without polling.

**3. Stellar Wallets Kit** — The frontend uses `@creit.tech/stellar-wallets-kit` for wallet-based authentication. Every user action that modifies on-chain state requires a Stellar signature, making the platform non-custodial by design.

**Network endpoints:**
- Soroban RPC (testnet): `https://soroban-testnet.stellar.org`
- Horizon (testnet): `https://horizon-testnet.stellar.org`
- Soroban RPC (mainnet): `https://soroban-rpc.stellar.org`
- Horizon (mainnet): `https://horizon.stellar.org`

**On-chain verification:** Contract deployments are performed via `stellar contract deploy` with the WASM binary. The resulting `CONTRACT_ID` is stored in the API's environment as `REAL_ESTATE_TOKEN_CONTRACT_ID`. Contract activity (invocations, events) is verifiable at:
- `https://stellar.expert/explorer/testnet` — search by contract ID
- `https://horizon-testnet.stellar.org/accounts/{ADMIN_ADDRESS}` — deployer account activity
- `stellar contract events --contract-id $CONTRACT_ID --network testnet` — live event stream

---

## Independent Analysis

Akkuea is technically the most ambitious project in the Stellar Wave ecosystem at the time of this research. A few observations that go beyond the README:

**Single-contract architecture is a deliberate tradeoff.** The decision to compile both tokenization and lending into one WASM binary (`real_estate_defi_contracts.wasm`) simplifies deployment and eliminates cross-contract call overhead, but it means the entire protocol is paused when the `pause` function is called — there is no granular circuit breaker per module. The `EmergencyGuard` role and `schedule_recovery`/`execute_recovery` pattern suggest the team is aware of this and has built a time-locked recovery mechanism.

**The oracle staleness guard (Issue #729) is production-grade.** Most DeFi protocols on newer chains skip oracle staleness checks in early versions. Akkuea's configurable `max_age` and `min_price` floor, merged before this research, shows the team is thinking about production failure modes, not just happy-path functionality.

**Bun + Elysia is an unconventional but coherent stack choice.** Bun's native TypeScript execution and faster startup times are meaningful for a backend that needs to respond to on-chain events quickly. Elysia's end-to-end type safety reduces the surface area for API/contract interface mismatches.

**The fork count (229) relative to stars (42) is the highest ratio in the Wave ecosystem.** This indicates the project is primarily attracting contributors rather than passive observers — consistent with the Wave Program's incentive model where contributors fork to solve issues and earn Points.

---

## Community & Ecosystem

| Metric | Value |
|---|---|
| Stars | 42 |
| Forks | 229 |
| Commits | 1,595+ |
| Open Issues | 24 |
| Open PRs | 10 |
| Stellar Wave tier | 4x Points |
| License | MIT (Acachete Labs) |
| Languages | TypeScript 83%, Rust 14.7%, JS 0.9%, CSS 0.7% |

---

## Submission Checklist

- [x] Verified Stellar Wave Program participant (4x Points on Drips)
- [x] Original description >200 words, independent of project README
- [x] Technical architecture documented in depth
- [x] Stellar integration explained (Soroban contract, Horizon, Wallets Kit)
- [x] On-chain verification paths provided
- [x] Category: `defi` / Tags: `rwa, real-estate, soroban, defi, lending, tokenization, stellar-wave, kyc, oracle, bun`
- [x] Independent analysis beyond marketing material included
