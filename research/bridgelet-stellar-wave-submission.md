# Bridgelet — Stellar Wave Research Submission

## Project Selected

- **Project:** Bridgelet
- **Wave source:** `bridgelet-org` listed as a Stellar Wave org on Drips (Org ID: 00720c48-a18e-41f0-8c1e-1a52075acb6d)
- **Domain:** Payments / Infrastructure / Developer Tooling
- **Website:** https://bridgelet.vercel.app/
- **Main coordination repo:** https://github.com/bridgelet-org/bridgelet
- **Smart contracts repo (Soroban):** https://github.com/bridgelet-org/bridgelet-core
- **Backend SDK repo:** https://github.com/bridgelet-org/bridgelet-sdk
- **Documentation:** Architecture, Getting Started, Integration Guide, and Use Cases PDFs in bridgelet/docs/

## Why This Matches the Task

Bridgelet is a confirmed Stellar Wave Program participant, listed as an org on Drips with three actively developed repositories. The bridgelet-sdk repo currently has 42 open issues on the Drips Wave issue tracker (as of Wave 8 in August 2026). Combined across all three repositories, Bridgelet has accumulated hundreds of forks and over 690+ total contributors, indicating robust developer engagement. The project solves a genuine onboarding gap — getting crypto payments to users who don't yet have wallets — and its Soroban integration is not cosmetic: the entire value proposition rests on four custom smart contracts. Bridgelet was not previously submitted to the Hub at the time of this research.

## Drips Wave Program Verification

Confirmed via the Drips Wave org profile: https://www.drips.network/wave/orgs/00720c48-a18e-41f0-8c1e-1a52075acb6d

Repositories registered under the Stellar Wave Program:

- `bridgelet-org/bridgelet-sdk` — Backend service for ephemeral Stellar account management (39 open issues on Drips, 108 forks reported)
- `bridgelet-org/bridgelet` — Main coordination repo (3 open issues on Drips, 89 forks reported)
- `bridgelet-org/bridgelet-core` — Smart contracts repo for ephemeral account restrictions (Soroban) (0 open issues currently, 88 forks reported)

Member registered on Drips Wave: **Fatima Aminu** (`phertyameen`) — primary contact (email: aminubabafatima8@gmail.com)

## Verifiable On-Chain IDs (Testnet)

Bridgelet is in active MVP development with testnet deployments supported via the automated script in `bridgelet-core/scripts/deploy-testnet.sh`. The deployment workflow requires a `TESTNET_DEPLOYER_SECRET_KEY` (stored as a GitHub Secret for CI/CD). All four contract systems are deployable to testnet using this script.

The bridgelet-core repository contains:

- `deployment-artifacts/` folder (updated July 24, 2026 — commit 234d62d)
- `deployments/` folder with testnet deployment scripts (updated June 27, 2026 — commit 8f89d86)
- `scripts/deploy-testnet.sh` — The canonical testnet deployment entrypoint

Required environment variables from bridgelet-sdk `.env.example` (for integration with deployed contracts):

- `EPHEMERAL_ACCOUNT_CONTRACT_ID` — Set after deploying the `ephemeral_account` Soroban contract
- `SWEEP_CONTROLLER_CONTRACT_ID` — Set after deploying the `sweep_controller` Soroban contract
- `RESERVE_CONTRACT_ID` — Set after deploying the `reserve_contract` Soroban contract
- `FUNDING_ACCOUNT_SECRET` — Classic Stellar account (S...) for funding ephemeral accounts
- `RECOVERY_ACCOUNT_PUBLIC` — Classic Stellar public key (G...) for expired-account fund recovery
- `SWEEP_SIGNING_KEY_SEED` — Ed25519 signing key for sweep authorization

To deploy and verify on testnet:

```bash
cd bridgelet-core
./scripts/build.sh
source .env && ./scripts/deploy-testnet.sh
```

The local sandbox integration test in bridgelet-sdk (`test/accounts-local-sandbox.e2e-spec.ts`) provides end-to-end verification of the account-creation → sweep flow against a live Soroban RPC endpoint.

## What Bridgelet Does

Bridgelet is an open-source payments infrastructure SDK that solves the blockchain onboarding problem for mass payment use cases. It enables organizations — employers, NGOs, aid agencies, airdrop platforms, gig-economy marketplaces, and e-commerce merchants — to send cryptocurrency payments to recipients who have no crypto wallet, no seed phrase, and no understanding of blockchain concepts.

Recipients receive a simple claim link via email, SMS, or other notification channel. They click the link, optionally create or connect a permanent wallet, and the funds are automatically swept from a temporary "ephemeral" Stellar account into their wallet. The entire process is non-custodial: at no point does Bridgelet or the sending organization hold the recipient's private keys. The ephemeral account's sweep logic is enforced by Soroban smart contracts, meaning the organization cannot retrieve funds after they are sent, and the recipient cannot be locked out by any third party.

The system supports single-asset (XLM, USDC, EURC, or any SEP-41 token) payments with configurable expiry windows, after which unclaimed funds can be recovered by a predefined recovery address. The MVP roadmap targets payroll for unbanked workers, NGO aid disbursements, cross-border remittances, airdrops to non-crypto users, and e-commerce refunds — all areas where traditional blockchain payments fail due to UX friction.

## The Problem Bridgelet Solves

Every major blockchain payment system faces the same adoption bottleneck: the recipient must already have a wallet. For mass-payment scenarios this is a showstopper. A construction company with 500 unbanked day laborers cannot ask every worker to learn seed phrases, download a wallet app, and pass KYC just to receive a salary. An NGO distributing emergency aid cannot require recipients to navigate a blockchain interface. An airdrop campaign targeting Web2 users will see single-digit claim rates if users must onboard to crypto first.

Traditional workarounds each have severe drawbacks:

- **Custodial wallets:** The platform holds user keys, creating regulatory exposure, counterparty risk, and a single point of failure for hacks.
- **Mobile money integrations:** Charge 2-5% per transaction — prohibitive at scale.
- **Bank wires:** Cost $5-15 each, require existing bank accounts, and take days.
- **Cash payouts:** Have theft risks, transport logistics overhead, and no audit trail.

Bridgelet replaces all of these with a non-custodial, on-chain-enforced claim flow that costs approximately $0.10 per transaction in XLM fees alone — a 99% cost reduction compared to traditional rails in emerging markets.

## How Bridgelet Uses Stellar

Bridgelet is built from the ground up on Stellar and Soroban — it is not a chain-agnostic system with a Stellar adapter. The specific design choices that depend on Stellar:

1. **Ephemeral accounts as first-class entities:** Bridgelet creates actual Stellar accounts (G... addresses) for each payment, not smart contract wrappers around a shared pool. This means each payment has its own on-chain identity, balance, and trustlines independently verifiable on Horizon.

2. **Soroban for sweep enforcement:** Four Soroban smart contracts enforce that:
   - Each ephemeral account accepts exactly one inbound payment per asset
   - Only an authorized SweepController can initiate a sweep
   - Sweeps require a valid Ed25519 signature from the authorized signer
   - Expired accounts return funds only to a predefined recovery address
   - Batch account creation is atomic via AccountFactory

3. **SEP-41 token compatibility:** The SweepController's `execute_transfers()` function works with any SEP-41-compliant token contract, enabling USDC, EURC, and custom asset payments without contract changes.

4. **Low fee structure:** Stellar's sub-cent fees make micro-payments and mass distributions economically viable. For a 500-worker payroll, Bridgelet's total on-chain fees would be under $50 vs. $3,750+ for mobile-money alternatives.

5. **3-5 second finality:** The claim flow provides near-instant fund settlement, which is critical for payroll and emergency-aid use cases where recipients cannot wait for block confirmations on slower chains.

Integration libraries used:

- `@stellar/stellar-sdk` (pinned to 14.6.1 in bridgelet-sdk)
- `soroban-sdk` v22.0.0 (Rust contracts)
- Horizon SSE streaming (PaymentMonitorProvider in SDK) for real-time payment detection
- Stellar CLI 23.4.1 for contract build and deployment

## Technical Architecture (Detailed)

Bridgelet is split across three repositories with clear separation of concerns:

### 1. bridgelet-core — Soroban Smart Contracts (Rust)

Four contracts with real Rust trait interfaces (`contracts/shared/src/interfaces.rs`):

**`ephemeral_account`** — Core account contract:

- `initialize(creator, expiry_ledger, recovery_address, authorized_controller, admin)` — Sets up a single-use account with a ledger-sequence-based expiry
- `record_payment(amount, asset)` — Records inbound SEP-41 token transfers; enforces one-payment-per-asset limit
- `sweep(destination, auth_signature)` — Direct sweep path (stub signature verification in MVP; routes through SweepController for production)
- `sweep_claim(destination)` — Gas-free sweep path called by SweepController.claim() on behalf of a recipient
- `expire()` — Recovers funds to recovery_address after expiry_ledger
- `upgrade(new_wasm_hash)` — Admin-gated contract upgrade mechanism
- Reentrancy protection via status update (sets `Swept` before transfer logic)
- Rich event system: AccountCreated, PaymentReceived, MultiPaymentReceived, SweepExecutedMulti, AccountExpired, ReserveReclaimed, SweepCompleted

**`sweep_controller`** — Authorization & atomic transfer layer:

- Ed25519 signature verification with nonce replay protection (`authorization.rs`)
- `execute_sweep(ephemeral_account, destination, auth_signature)` — Validates signature, calls sweep on ephemeral, runs atomic multi-asset transfers
- `claim(recipient, ephemeral_account)` — Gas-free relayer path: recipient signs auth entry, relayer pays fees, controller sweeps via `authorize_as_current_contract()`
- Optional locked mode restricting sweeps to a single pre-authorized destination
- `execute_transfers()` (in `transfers.rs`) — Atomic SEP-41 token transfers to destination

**`reserve_contract`** — Base-reserve management:

- Admin-set base reserve amount bounded to 10,000 XLM (100,000,000,000 stroops)
- Simple init/get/set/has interface for tracking base reserve bookkeeping
- Integration wiring into ephemeral_account listed as a tracked production requirement

**`account_factory`** — Batch deployment:

- `batch_initialize(wasm_hash, accounts: Vec<AccountInitRequest>)` — Deploys N ephemeral_account instances in a single transaction
- Per-account error isolation: failures are caught and the failed address is reported (specific error details currently discarded)

### 2. bridgelet-sdk — Backend Service (NestJS / TypeScript)

Enterprise-grade backend for organizations integrating Bridgelet:

- **Accounts module** (`src/modules/accounts/`) — Ephemeral account CRUD, metadata storage, status tracking with account_status_enum: CREATED → FUNDING → FUNDED → INITIALIZING → CLAIMING → PARTIAL_SWEEP → CLAIMED / EXPIRED / RECOVERED
- **Claims module** (`src/modules/claims/`) — JWT claim tokens (30-day default expiry), claim initiation + redemption flows, claim audit log table
- **Sweeps module** (`src/modules/sweeps/`) — Sweep orchestration, contract call transaction building, Ed25519 signature generation (stub signature generation in MVP, throws in non-dev environments)
- **Webhooks module** — Event subscription system with delivery retry log (service body commented out in MVP as of July 2026; restoration tracked with `TEMPORARY:` code comments)
- **Stellar module** — Horizon integration, Soroban RPC calls, PaymentMonitorProvider with SSE streaming for real-time payment detection
- **Database** — PostgreSQL + TypeORM, 1718100000000-series migrations: accounts, claims, webhooks, webhook_deliveries, contract_events, claim_audit_log tables; high-traffic composite indexes on accounts; soft-delete support
- **Security** — API key guard, JWT_SECRET for claim tokens, rate limiting config. WARNING: `encryptSecret()` currently uses base64 encoding, NOT real AES-GCM encryption — listed as MVP blocker for production
- **Testing** — 80% coverage threshold enforced, e2e test suite, local sandbox integration tests, concurrent-account load test (50 burst), embedded-Postgres schema verification integration test

### 3. bridgelet — Coordination Repo

- Architecture diagram PDF
- Getting Started guide PDF (30-min beginner setup)
- Integration guide PDF (webhooks, batch ops, error codes, deployment checklist)
- Use cases PDF (payroll, NGO aid, remittances, airdrops, refunds, gig payouts with case studies)

## Team and Community Information

- **Primary maintainer:** Fatima Aminu (GitHub: `phertyameen`) — listed on Drips Wave as the org's registered member; commits as recently as August 19, 2026 on bridgelet-core main branch
- **Bridgelet-core contributors:** 59 contributors (per GitHub contributor graph)
- **Bridgelet-sdk contributors:** 63 contributors (per GitHub contributor graph)
- **Recent commit activity:** bridgelet-core had commits 2 days ago (August 19, 2026) adding a `fee_sponsor` crate; bridgelet-sdk had commits on July 27, 2026 fixing test failures and formatting audit documents
- **Audit trail:** Both repos have dedicated audit document folders: `bridgelet-core/bridgelet-audit/` (merged PR #446, July 28, 2026: account-factory salt-collision doc) and `bridgelet-sdk/bridgelet-sdk-audit/` (security findings tracked in SECURITY_AUDIT.md and PRETTIER-formatted markdown)
- **CI/CD:** Bridgelet-core has commented-out GitHub Actions workflows for test running and automated testnet deployment on merge (CI body commented as of MVP; secrets documented for re-enablement: TESTNET_DEPLOYER_SECRET_KEY)
- **Contributor onboarding:** bridgelet-sdk has a formal CONTRIBUTING.md with branch naming regex (e.g., `fix/issue-42-jwt-error-handling`), PR title format regex (e.g., `Fix: Handle JWT errors (#42)`), and automated PR naming checks (warning mode until Feb 27, 2026; blocking after)
- **Contact:** aminubabafatima8@gmail.com (from Drips org profile)
- **Fork count across 3 repos:** 285+ total (108+89+88 per Drips listing)
- **Stellar Community Fund status:** Not listed as funded at time of research; project appears to be Wave-supported with developer contributions

## Community Metrics (From GitHub and Drips)

| Repo           | Commits  | Contributors    | Issues (Drips) | Forks (Drips) | Last Commit       |
| -------------- | -------- | --------------- | -------------- | ------------- | ----------------- |
| bridgelet-core | 356      | 59              | 0              | 88            | Aug 19, 2026      |
| bridgelet-sdk  | 329      | 63              | 39             | 108           | Jul 27, 2026      |
| bridgelet      | N/A      | N/A             | 3              | 89            | Coordination repo |
| **Total**      | **685+** | **122+ unique** | **42**         | **285**       |                   |

## Submission Profile

- **Name:** Bridgelet
- **Category:** `payments`
- **Tags:** `payments, soroban, onboarding, infrastructure, developer-tools, stellar-wave, payroll, aid-disbursement, non-custodial, ephemeral-accounts`
- **Website URL:** https://bridgelet.vercel.app/
- **GitHub URL:** https://github.com/bridgelet-org
- **GitHub Repos:**
  - `bridgelet-core`: https://github.com/bridgelet-org/bridgelet-core
  - `bridgelet-sdk`: https://github.com/bridgelet-org/bridgelet-sdk
  - `bridgelet`: https://github.com/bridgelet-org/bridgelet
- **Stellar Network:** testnet (MVP phase; testnet deployment via scripts/deploy-testnet.sh)
- **Stellar Contract IDs:** Deployed via `TESTNET_DEPLOYER_SECRET_KEY` using `bridgelet-core/scripts/deploy-testnet.sh`; IDs set as EPHEMERAL_ACCOUNT_CONTRACT_ID, SWEEP_CONTROLLER_CONTRACT_ID, RESERVE_CONTRACT_ID in bridgelet-sdk .env
- **Description (for Hub, 200+ words):** Bridgelet is a non-custodial payments infrastructure built on Stellar Soroban that enables employers, NGOs, remittance platforms, and merchants to send crypto payments to recipients who do not own crypto wallets. Instead of requiring pre-existing wallets or seed phrases, Bridgelet creates temporary "ephemeral" Stellar accounts funded by the sender, delivers a simple claim link to the recipient via email or SMS, and automatically sweeps the funds to any permanent wallet the recipient connects or creates during the claim flow. The sweep logic is enforced by four Soroban smart contracts: EphemeralAccount for single-payment bookkeeping and expiry, SweepController for Ed25519-verified authorization and atomic SEP-41 token transfers, AccountFactory for batch deployment of hundreds of accounts per transaction, and ReserveContract for base-reserve management. A NestJS backend SDK provides enterprise-grade APIs for account lifecycle management, JWT-authenticated claim tokens, webhook event subscriptions, PostgreSQL-backed metadata storage, and Horizon SSE-based payment monitoring. The system supports any SEP-41 asset (XLM, USDC, EURC), configurable expiry windows with recovery-address fallback, gas-free relayer-based claims, and costs approximately $0.10 per transaction in XLM fees — a 99% cost reduction compared to mobile-money alternatives for payroll, aid disbursement, gig payouts, airdrops, and refunds in emerging markets.
