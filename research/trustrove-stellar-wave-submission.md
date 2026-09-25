# TrusTrove — Stellar Wave Research Submission

## Project Identity

- **Project Name:** TrusTrove
- **Category:** DeFi / Trade Finance
- **Wave Source:** Approved on the Drips Stellar Wave Program registry — `TrusTrove/TrusTrove-app` (waveProgramId `fdc01c95-806f-4b6a-998b-a6ed37e0d81b`, status `approved`, applied 2026-06-17, reviewed 2026-06-18). Both repos carry the GitHub **"Stellar Wave"** label.
- **Website / App:** https://trustrove.vercel.app
- **Contract Repository:** https://github.com/TrusTrove/TrusTrove-contract
- **App Repository:** https://github.com/TrusTrove/TrusTrove-app
- **Documentation:** `docs/THREAT_MODEL.md`, `docs/STORAGE.md`, `docs/LIMITATIONS.md`, `docs/EVENTS.md`, `docs/ARCHITECTURE.md` in the contract/app repos
- **License:** MIT
- **Founder / Lead Developer:** Fuhad (K1NG4DVID) — https://github.com/k1ngd4vid
- **Community:** https://t.me/trusttrove

---

## Why This Project Matches the Task

TrusTrove is a verified Stellar Wave Program participant. It is listed as **approved** on the official Stellar Wave (Drips) registry with a 25,000 point budget and 51 funded issues, and its GitHub repositories use the `Stellar Wave` label that the program applies to participating repos. At the time of submission it was **not** listed on Stellar Wave Hub (confirmed via `GET /api/projects?search=trustrove` returning 0 results) and no research file for it existed in this repository. TrusTrove fills an underserved category on the Hub — trade finance / invoice factoring — while every one of its four Soroban contracts is live and independently verifiable on Stellar testnet.

---

## The Problem TrusTrove Solves

Small and medium-sized enterprises that sell on credit terms routinely wait 30–90 days to be paid. The Asian Development Bank estimates the global trade finance gap at roughly **$2.5 trillion per year**, and the shortfall falls hardest on SMEs in emerging markets, which cannot access bank credit or invoice-factoring products. Traditional factoring requires a bank or broker to assess the creditworthiness of the supplier and buyer, hold the receivable, and advance cash — a slow, expensive, and exclusionary process that often disqualifies exactly the businesses that need working capital most.

TrusTrove replaces that intermediary chain with an open, on-chain liquidity pool. A verified SME tokenizes an unpaid invoice on Stellar, lists it for financing at a self-selected discount rate, and immediately receives USDC from the pool instead of waiting months for the buyer to settle. Buyers still repay the full face value at the due date, and the pool earns the discount as yield, which is distributed to liquidity providers through a share-price mechanism. This removes the counterparty gatekeeping of traditional trade finance, gives SMEs faster, cheaper access to working capital, and gives liquidity providers a new, transparent yield source tied to real trade receivables.

The protocol is deliberately open and permissionless at the funding layer: anyone can trigger funding for an eligible invoice that passes the on-chain checks, and underwriting is delegated to an off-chain attestation layer rather than a central credit committee. Every invoice follows a strict, event-driven lifecycle, escrow holds funds between funding and payout, and the pool accounts for yield in a way that benefits all liquidity providers equally. The result is a verifiable, bank-independent alternative to invoice factoring that is designed to operate in markets where traditional trade credit is scarce or entirely unavailable.

---

## How the Project Uses Stellar

TrusTrove is built natively on Stellar and its contracts are written with the Soroban SDK. The project relies on four distinct Stellar primitives:

1. **Soroban smart contracts** — four deployed contracts (registry, invoice, escrow, pool) implement the entire protocol state machine, escrow custody, and LP accounting on-chain.
2. **Stellar Asset Contract / USDC** — pool funding and repayments are denominated in USDC issued on Stellar, and the protocol uses `require_auth` on every state-changing call so only the authenticated party can act.
3. **Fast finality + low fees** — Stellar's 5-second settlement and near-zero transaction costs make micro-scale invoice financing economically viable, which the project cites as a core reason for choosing Stellar over other chains.
4. **Anchor network / on-off ramps** — the project positions USDC on Stellar as the settlement layer precisely because of Stellar's anchor network for fiat on/off ramps in emerging markets.

### Deployed Contracts (Stellar Testnet, verified 2026-08-31 via Stellar Expert REST API)

| Contract | Address | Role |
|---|---|---|
| **registry_contract** | `CABGWVIZFF62FG67ZGFEP67NEEY4WYTMFURDMFTKKNRDAFPKPOJDTN4C` | Tracks verified SME issuers and buyers; `is_verified()` re-checked before any new business commits |
| **invoice_contract** | `CA4O3MR7LWHRSUDBNU6FY6UDFFYBN7TGBZXBDZB4OYYXFYXIFJ6RJF6B` | Invoice lifecycle state machine (`Created → Listed → Funded → Active → Confirmed → Repaid/Defaulted`); emits events for the Go indexer |
| **escrow_contract** | `CAJWGUKDTTC3SKN4RAAY72J4DVIIYSCFHX6GIMNTT22ABMISJK4GBCEH` | Holds USDC between funding and issuer payout; only callable by `pool_contract` (plus admin emergency path) |
| **pool_contract** | `CAKEWH7SJCXGV2MH2WZYIX3QDPTSSBQFXYVYBOWAGLNBBZMPLE2US6CS` | USDC liquidity pool with share-based LP accounting; `fund_invoice` re-verifies issuer & buyer against the registry |

**Deployer wallet:** `GDDWFYWXCSBI6RNS5TV2ZZSBYY35MDKHR2424O7RVL6LDC4DUTBTVR2Z` — 44 payments, moderate monthly activity, holds XLM.

---

## Technical Approach

### Architecture

The system is split across a contract layer and a full application stack:

```
TrusTrove-app (monorepo)
├── apps/web            # Next.js 14, TypeScript, Tailwind, Framer Motion (Freighter wallet)
├── sdk                 # Custom TypeScript contract-client wrappers
└── indexer             # Go 1.22, chi router, pgx v5 — ingests contract events, SEP-10 auth, OpenAPI spec
TrusTrove-contract
├── contracts/          # registry, invoice, escrow, pool — Rust + Soroban SDK
├── docs/               # THREAT_MODEL.md, STORAGE.md, LIMITATIONS.md, EVENTS.md
└── scripts/            # deploy.sh / deploy.ps1, setup-testnet, verify
```

### Contract design highlights

- **Registry contract** acts as an on-chain identity oracle. `register_issuer` / `register_buyer` are admin-gated; `is_verified()` is re-checked at `invoice.create()`, `invoice.list_for_financing()`, and `pool.fund_invoice()`. **Revocation is prospective, not retroactive** — a revoked party cannot originate, list, or get a *new* invoice funded, but in-flight funded invoices are deliberately not unwound (documented as a security choice in the README threat model).
- **Invoice contract** enforces a strict state machine with explicit status guards on every transition, emits a documented event catalog, and supports `submit_attestation` for off-chain underwriter signatures.
- **Attestation / underwriting flow** — an `underwrite-contract` repo (separate agent registry) signs an `AttestationPayload` (`domain_separator`, `invoice_id`, `risk_score`, `evidence_hash`, `agent_id`, `nonce`) with a secp256k1 key; anyone can relay it via `submit_attestation`, and the contract recovers and verifies the signer. `list_for_financing` panics with `VerificationRequired` until a valid attestation exists.
- **Escrow contract** only accepts `lock()` from the registered pool; `release_to_issuer` / `release_to_pool` are pool-only; `handle_default` accepts pool or admin.
- **Pool contract** implements share-based LP accounting (`TotalDeposits` grows with yield so share price rises for all LPs), and `receive_repayment` is callable only by the invoice contract. `fund_invoice` was made **permissionless** (previously admin-gated) so capital allocation is no longer at admin discretion — on-chain eligibility checks: invoice status `Listed`, funding asset matches pool asset, sufficient pool liquidity.
- **Conventions:** all amounts `u128` in stroops (1 USDC = 10,000,000); all timestamps `u64` Unix seconds; every `persistent().set()` followed by `extend_ttl()`; typed errors via `panic_with_error!`.

### Fund flow

```
LP ──USDC──► Pool ──shares──► LP
Issuer creates + lists invoice (no funds move)
Pool.fund_invoice ──funded_amount USDC──► Escrow (locked per invoice_id)
Escrow ──funded_amount USDC──► Issuer        ⚠ known gap: not yet wired (Issue #56)
Buyer.repay ──face_value USDC──► Pool (direct, bypasses escrow); yield = face − funded
Default: invoice.trigger_default → pool.handle_default → escrow.handle_default ──► Pool
```

### Known centralization risks (transparently documented)

- Single admin key controls issuer/buyer registry and `trigger_default`; roadmap targets a 3-of-5 multisig before mainnet.
- No emergency pause mechanism yet.
- `fund_invoice` is now permissionless, but LP-governed capital allocation (staked-LP voting) is still on the roadmap.

---

## On-Chain Verification

All four contracts were independently verified on **2026-08-31** against the Stellar Expert Testnet REST API. Each returned a live contract record with a matching creator wallet.

| Contract | Created (ledger) | Creator | WASM hash (prefix) | Storage entries |
|---|---|---|---|---|
| registry_contract | 1781353193 | `GDDWFY...TVR2Z` | `0bb400b5...` | 3 |
| invoice_contract | 1781353238 | `GDDWFY...TVR2Z` | `33d0afda...` | 1 |
| escrow_contract | 1781353283 | `GDDWFY...TVR2Z` | `764c31fb...` | 1 |
| pool_contract | 1781353308 | `GDDWFY...TVR2Z` | `ebb11bf8...` | 1 |

All four were created from the same deployer account, matching the README deployment flow. The invoice contract shows 4 sub-invocations and 2 emitted events — consistent with contract-to-contract wiring during initialization.

**Independent queries:**
```
GET https://api.stellar.expert/explorer/testnet/contract/CA4O3MR7LWHRSUDBNU6FY6UDFFYBN7TGBZXBDZB4OYYXFYXIFJ6RJF6B   → 200, created 1781353238
GET https://api.stellar.expert/explorer/testnet/contract/CABGWVIZFF62FG67ZGFEP67NEEY4WYTMFURDMFTKKNRDAFPKPOJDTN4C   → 200, created 1781353193
GET https://api.stellar.expert/explorer/testnet/contract/CAJWGUKDTTC3SKN4RAAY72J4DVIIYSCFHX6GIMNTT22ABMISJK4GBCEH   → 200, created 1781353283
GET https://api.stellar.expert/explorer/testnet/contract/CAKEWH7SJCXGV2MH2WZYIX3QDPTSSBQFXYVYBOWAGLNBBZMPLE2US6CS   → 200, created 1781353308
GET https://api.stellar.expert/explorer/testnet/account/GDDWFYWXCSBI6RNS5TV2ZZSBYY35MDKHR2424O7RVL6LDC4DUTBTVR2Z → 200, 44 payments
```

**Explorer links:**
- https://stellar.expert/explorer/testnet/contract/CABGWVIZFF62FG67ZGFEP67NEEY4WYTMFURDMFTKKNRDAFPKPOJDTN4C
- https://stellar.expert/explorer/testnet/contract/CA4O3MR7LWHRSUDBNU6FY6UDFFYBN7TGBZXBDZB4OYYXFYXIFJ6RJF6B
- https://stellar.expert/explorer/testnet/contract/CAJWGUKDTTC3SKN4RAAY72J4DVIIYSCFHX6GIMNTT22ABMISJK4GBCEH
- https://stellar.expert/explorer/testnet/contract/CAKEWH7SJCXGV2MH2WZYIX3QDPTSSBQFXYVYBOWAGLNBBZMPLE2US6CS

> **Note:** Testnet addresses are subject to rotation per the project's documented lifecycle policy (`DEPLOYMENT.md`); the README is updated automatically on each deploy. The addresses above were verified against the latest README at submission time.

---

## Team and Community

- **Founder & Lead Developer:** Fuhad (K1NG4DVID) — GitHub @k1ngd4vid, Telegram @k1ngd4vid
- **Organization:** TrusTrove (GitHub org `TrusTrove`)
- **Contract repo stats:** 9 stars, 108 forks, 85 open issues (Rust, Soroban SDK) — forks >> stars indicates an active contributor community; 898 commits on `main`
- **App repo stats:** 12 stars, 117 forks, 97 open issues (TypeScript, Next.js 14) — CI with Codecov badge, Vercel + Render deployment
- **Contribution pipeline:** issues labeled `complexity:low/medium/high`, conventional-commit format, `CONTRIBUTING.md`, Telegram community at t.me/trusttrove
- **Stellar Wave participation:** approved on the Drips Stellar Wave registry (51 issues, 25,000 point budget, org budget 75,000); `Stellar Wave` label on both repos; issues seeded via `scripts/maintainer/` tooling
- **Tech stack:** Rust/Soroban SDK (contracts), Next.js 14 + TypeScript + Tailwind + Framer Motion (web), Freighter (wallet), Go 1.22 + chi + pgx (indexer), PostgreSQL 15, Vercel/Render (hosting)

---

## Category and Tags

- **Category:** `defi` (trade finance / invoice factoring)
- **Tags:** `trade-finance, invoices, defi, lending, soroban, stellar, usdc, rwa, escrow, liquidity-pool, sme, factoring, underwriting`

---

## Hub Submission Confirmation

- **Hub URL:** https://usestellarwavehub.vercel.app
- **Hub project ID:** `128`
- **Hub slug:** `trustrove`
- **Submission status:** `submitted` (awaiting Hub administrator review)
- **Submitted network:** `testnet`
- **Uploaded research image:** https://dlwcywvybsedgmcggmjn.supabase.co/storage/v1/object/public/research-images/79/1788267162214-44nqob.png
- **Submitted by:** Halimatyemisi
- **Submitted:** 2026-09-01

---

## Supporting Screenshot

- Architecture & on-chain verification diagram: `research/trustrove-architecture.png`

---

## Sources

1. **Contract repository (primary):** https://github.com/TrusTrove/TrusTrove-contract
2. **App repository:** https://github.com/TrusTrove/TrusTrove-app
3. **Live app:** https://trustrove.vercel.app
4. **Drips Stellar Wave registry (approval + budget):** https://www.drips.network/wave/stellar and `https://wave-api.drips.network/api/wave-programs/fdc01c95-806f-4b6a-998b-a6ed37e0d81b/repos` (TrusTrove-app, status `approved`)
5. **DEPLOYMENT.md (lifecycle/rotation policy):** https://raw.githubusercontent.com/TrusTrove/TrusTrove-contract/main/DEPLOYMENT.md
6. **On-chain verification (Stellar Expert Testnet API):** https://api.stellar.expert/explorer/testnet/contract/CABGWVIZFF62FG67ZGFEP67NEEY4WYTMFURDMFTKKNRDAFPKPOJDTN4C and the other three contract records above
7. **Deployer account (Stellar Expert):** https://api.stellar.expert/explorer/testnet/account/GDDWFYWXCSBI6RNS5TV2ZZSBYY35MDKHR2424O7RVL6LDC4DUTBTVR2Z
8. **Stellar Wave program site:** https://www.drips.network/wave/stellar
