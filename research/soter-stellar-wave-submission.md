# Soter — Stellar Wave Research Submission

## Project Identity

- **Project Name:** Soter
- **Category:** Social Impact / Humanitarian Aid Distribution
- **Wave Source:** Approved on the Drips Stellar Wave Program registry — `Pulsefy/Soter` (waveProgramId `fdc01c95-806f-4b6a-998b-a6ed37e0d81b`, status `approved`, applied 2026-01-14, reviewed 2026-01-16). The repository carries the **"Stellar Wave"** GitHub label.
- **Website / App:** https://realsoter.vercel.app (live; EN/ES/FR — dashboard, campaign views, claim flows)
- **Repository:** https://github.com/Pulsefy/Soter
- **License:** Open source
- **Maintainer org:** Pulsefy (GitHub org)
- **Community / Drips applicant:** Cedarich

---

## Why This Project Matches the Task

Soter is a verified Stellar Wave Program participant. It is listed as **approved** on the official Stellar Wave (Drips) registry with a 25,000 point budget and 31 funded issues, and it carries the `Stellar Wave` GitHub label. At submission time it was **not** listed on Stellar Wave Hub (confirmed via `GET /api/projects?search=soter` returning 0 results) and no research file for it existed in this repository. Soter is also the only candidate from its org that was not yet on the Hub — its sibling Pulsefy project (Lumenpulse) is already listed, while Soter fills the humanitarian aid / social impact category with a fully verifiable live testnet contract.

---

## The Problem Soter Solves

Humanitarian aid distribution is opaque, slow, and dominated by intermediaries. Donors rarely know whether the people they intended to help actually received anything: funds pass through layers of NGOs, brokers, and cash couriers, each able to delay, divert, or lose money, and impact reporting is usually a retrospective spreadsheet rather than verifiable evidence. Meanwhile, the people most in need — refugees, disaster survivors, the unbanked — are the ones with the least access to banks or digital wallets, and proving need typically means handing sensitive personal documents to third parties, trading privacy for the chance of assistance.

Soter attacks both halves of that problem. It puts aid delivery on a public, immutable ledger so every disbursement is transparent and auditable, and it removes the sign-up and privacy barriers that block recipients. Donors and NGOs create simple claim links that a recipient can open in any Stellar wallet — no account creation, no KYC, no intermediary — while an off-chain AI service verifies needs through OCR, anonymization, and fraud checks without exposing sensitive documents. The result is aid that is direct, dignified, cheap to deliver, and verifiable on-chain, which is especially valuable in markets where humanitarian infrastructure is thin or untrusted.

---

## How the Project Uses Stellar

Soter is built natively on Stellar and its core escrow logic is a Soroban smart contract:

1. **On-chain escrow (AidEscrow)** — donated funds are held in a contract pool, not in an NGO's bank account. Packages are created for named recipients and funds are only released by `claim` (recipient) or `disburse` (admin).
2. **Soroban event catalog** — the contract emits stable, indexer-friendly topics (`escrow_funded`, `package_created`, `package_claimed`, `package_disbursed`, `package_revoked`, `package_refunded`, `batch_created_event`, `extended_event`, `surplus_withdrawn_event`) with compact, no-PII payloads, giving donors verifiable, immutable impact tracking.
3. **Stellar wallets for recipients** — recipients claim aid through their Stellar wallet via passwordless claim links, aligning with Stellar's goal of financial access for the unbanked.
4. **Low-cost, fast finality** — Stellar's ~5-second settlement and near-zero fees make micro-disbursements (e.g., a single meal, transport fare, or medicine purchase) economically feasible.

### Deployed Contract (Stellar Testnet, verified 2026-08-31)

| Field | Value |
|---|---|
| **Contract ID** | `CDSBJ27PKTNFTRW6OKPCVXDRUSSRUIQUG6DW5PUTKLDXTDT23NQIS6JG` |
| **Crate / Version** | `aid_escrow v0.1.0` |
| **Deployer** | `GA5TBSBGERHVMEFBJGEM3KYMRLWO73Y2QRAV6P66GPEBOJ5ZMJUT7LLY` |
| **Created (ledger)** | 1780512917 |
| **WASM hash** | `24328e15b7c11c7ff07caeaf0328da591b3b63e84af57fa03623c10126eabc8d` |

---

## Technical Approach

### Architecture

Soter is a multi-service monorepo with a clear separation between on-chain and off-chain concerns:

```
Soter/
├── app/onchain/          # AidEscrow Soroban contract (Rust), deployment records, invoke scripts
├── app/backend/          # NestJS (TypeScript) + Prisma — REST API, orchestration, SorobanAdapter
├── app/frontend/         # Next.js (App Router) + Tailwind — donor/NGO dashboards, review workflows
├── app/mobile/           # Expo (React Native) + WalletConnect — field ops: scan, submit, confirm claims
├── app/ai-service/       # FastAPI (Python) — OCR, anonymization, fraud checks for verification flows
├── .github/workflows/    # CI
└── assets/               # logo
```

### AidEscrow contract design

- **Pool model** — funds must be deposited via `fund()` before they can be allocated to packages.
- **Solvency invariant** — a package cannot be created if `Contract Balance < Total Locked Amount + New Package Amount`, preventing over-allocation.
- **State machine** — packages transition `Created → Claimed` (or `Expired` / `Cancelled → Refunded`), with time-bounds blocking claims after expiry.
- **Role control** — only admin or authorized distributors can create packages; only admin can pause, configure, or manually disburse; recipients authorize `claim` with `require_auth`.
- **Admin operations** — `disburse`, `revoke`, `cancel_package`, `refund`, `extend_expiry`, `withdraw_surplus`, `add_distributor` / `remove_distributor`, `pause` / `unpause`, `set_config` (global limits: min amount, max expiry).
- **Read queries** — `get_package`, `view_package_status`, `get_aggregates` (total committed/claimed/expired per token).
- **Batch operations** — `batch_create_packages` with auto-incremented IDs for large distributions.
- **Conventions** — WASM target `wasm32v1-none`, Stellar CLI 26, amounts in stroops, timestamps as Unix seconds.

### Off-chain layers

- **Backend (NestJS + Prisma)** — exposes REST APIs, persists operational data, and uses a pluggable `SorobanAdapter` (with a `MockOnchainAdapter` for tests), error mapping, and webhook delivery receipts for on-chain call observability.
- **Frontend (Next.js)** — campaign views, donor/NGO dashboards, wallet flows, review workflows.
- **Mobile (Expo + WalletConnect)** — field operations: scan, view details, submit/confirm claim flows, designed for aid workers.
- **AI service (FastAPI)** — OCR, anonymization, and fraud checks so eligibility is verified privately (client-side analysis, no PII pushed on-chain).
- **Testnet readiness** — network passphrase guardrails to prevent cross-network mismatches, deterministic test modes, health probes and observability hooks for on-chain calls and background jobs.

---

## On-Chain Verification

Independently verified on **2026-08-31** via the Stellar Expert Testnet REST API and Horizon:

```
GET https://api.stellar.expert/explorer/testnet/contract/CDSBJ27PKTNFTRW6OKPCVXDRUSSRUIQUG6DW5PUTKLDXTDT23NQIS6JG
→ 200
{
  "contract": "CDSBJ27PKTNFTRW6OKPCVXDRUSSRUIQUG6DW5PUTKLDXTDT23NQIS6JG",
  "created": 1780512917,
  "creator": "GA5TBSBGERHVMEFBJGEM3KYMRLWO73Y2QRAV6P66GPEBOJ5ZMJUT7LLY",
  "wasm": "24328e15b7c11c7ff07caeaf0328da591b3b63e84af57fa03623c10126eabc8d",
  "storage_entries": 1
}
```

- **WASM hash cross-check:** the returned hash `24328e15...abc8d` exactly matches the deployment record in `app/onchain/deployments/testnet-2026-06-03.md`, proving the live contract is the repo's `aid_escrow` build.
- **Deployer account:** `GA5TBSBGERHVMEFBJGEM3KYMRLWO73Y2QRAV6P66GPEBOJ5ZMJUT7LLY` verified live on Horizon testnet with balance ~19,954 XLM (last modified ledger 4,332,035) — matches the `--admin GA5TBSB...` initialization and `--source seyi` deployer in the deployment record.
- **Deployment transactions:**
  - WASM upload: `f61ca00143125d29f9932b5b50e499d9ab5dde8f2a849637a64d84cd1dcb9103`
  - Contract deploy: `292bf42f063310028456890e88861cd1650149ef0d4e66ba2a22ea5769964e64`

**Explorer links:**
- https://stellar.expert/explorer/testnet/contract/CDSBJ27PKTNFTRW6OKPCVXDRUSSRUIQUG6DW5PUTKLDXTDT23NQIS6JG
- https://lab.stellar.org/r/testnet/contract/CDSBJ27PKTNFTRW6OKPCVXDRUSSRUIQUG6DW5PUTKLDXTDT23NQIS6JG
- https://stellar.expert/explorer/testnet/tx/292bf42f063310028456890e88861cd1650149ef0d4e66ba2a22ea5769964e64

> **Note:** The contract is currently deployed on **testnet only** (mainnet not yet deployed), which is acceptable for the Hub's verification requirement; the on-chain data above was confirmed live at submission time.

---

## Team and Community

- **Maintainer org:** Pulsefy (GitHub org) — also maintains Lumenpulse (already on the Hub).
- **Repo stats:** 26 stars, 366 forks, 36 open issues, 22 PRs, 1,380 commits on `main` — forks >> stars indicates an active contributor community.
- **Drips Stellar Wave participation:** approved (issueCount 31, pointsBudget 25,000, org budget 75,000), applied by Cedarich.
- **Multi-language stack:** Rust (contracts), TypeScript (backend/frontend/mobile), Python (AI service).
- **Languages distribution:** TypeScript 3.58M, Python 753K, Rust 452K, CSS, JavaScript, Shell.
- **Contributing:** reviewed frequently, small focused PRs, no secrets committed, component-specific READMEs and test commands per app.
- **Deploy identity:** `seyi` used in the deploy command (`--source seyi`).

---

## Category and Tags

- **Category:** `social` (humanitarian aid / social impact)
- **Tags:** `stellar, soroban, humanitarian-aid, aidtech, escrow, social-impact, nextjs, nestjs, rust, react-native, stellar-wave`

---

## Submission Details

- **Hub URL:** https://usestellarwavehub.vercel.app
- **Slug:** `soter`
- **Status:** `submitted`
- **Submitted:** 2026-08-31
- **Submitted by:** Ayomide3271

---

## Supporting Screenshot

- Architecture & on-chain verification diagram: `research/soter-architecture.png`

---

## Sources

1. **Repository (primary):** https://github.com/Pulsefy/Soter
2. **On-chain README (contract + events):** https://github.com/Pulsefy/Soter/blob/main/app/onchain/README.md
3. **Deployment record (WASM hash, deployer, tx hashes):** https://raw.githubusercontent.com/Pulsefy/Soter/main/app/onchain/deployments/testnet-2026-06-03.md
4. **Live app:** https://realsoter.vercel.app
5. **Drips Stellar Wave registry (approval):** https://www.drips.network/wave/stellar and `https://wave-api.drips.network/api/wave-programs/fdc01c95-806f-4b6a-998b-a6ed37e0d81b/repos` (Pulsefy/Soter, status `approved`)
6. **On-chain verification (Stellar Expert Testnet API):** https://api.stellar.expert/explorer/testnet/contract/CDSBJ27PKTNFTRW6OKPCVXDRUSSRUIQUG6DW5PUTKLDXTDT23NQIS6JG
7. **Deployer account (Horizon):** https://horizon-testnet.stellar.org/accounts/GA5TBSBGERHVMEFBJGEM3KYMRLWO73Y2QRAV6P66GPEBOJ5ZMJUT7LLY
8. **Stellar Wave program site:** https://www.drips.network/wave/stellar
