# SafeTrust — Stellar Wave Research Submission

## Project Identity

- **Project Name:** SafeTrust
- **Category:** Payments / DeFi / Infrastructure
- **Wave Source:** `safetrustcr/frontend-SafeTrust` listed in Stellar Wave repositories on Drips (4x Points tier)
- **Website:** [safetrustcr.vercel.app](https://safetrustcr.vercel.app)
- **GitHub Org:** [github.com/safetrustcr](https://github.com/safetrustcr)
- **Frontend Repo:** [github.com/safetrustcr/frontend-SafeTrust](https://github.com/safetrustcr/frontend-SafeTrust)
- **Backend Repo:** [github.com/safetrustcr/backend-SafeTrust](https://github.com/safetrustcr/backend-SafeTrust)
- **Landing Repo:** [github.com/safetrustcr/landing-SafeTrust](https://github.com/safetrustcr/landing-SafeTrust)
- **dApp Repo:** [github.com/safetrustcr/dApp-SafeTrust](https://github.com/safetrustcr/dApp-SafeTrust)
- **Telegram:** [t.me/safetrustcr](https://t.me/safetrustcr)
- **X (Twitter):** [@SafeTrustCR](https://x.com/SafeTrustCR)
- **Location:** Costa Rica

---

## Why This Project Matches the Task

SafeTrust is a verified Stellar Wave Program participant at the **4x Points tier** on Drips — the highest reward tier available. It is one of the most actively forked projects in the Wave ecosystem, with 88 forks on the frontend repo alone and 84 on the backend. The project addresses a real and widespread problem: the lack of trust in peer-to-peer cryptocurrency transactions. Rather than building a generic escrow, SafeTrust integrates directly with the **TrustlessWork API** — itself a Stellar Wave project — to leverage battle-tested Soroban smart contract escrow infrastructure. This makes SafeTrust a compelling example of Wave ecosystem composability: one Wave project building on another.

---

## What SafeTrust Does

SafeTrust is a decentralized platform that enables secure, trustless peer-to-peer (P2P) transactions using cryptocurrency. The core problem it solves is counterparty risk in P2P deals: when two parties transact directly, one must act first and trust the other to fulfill their side. SafeTrust eliminates this risk by locking funds in a blockchain-based escrow that releases automatically only when agreed conditions are met — no intermediary, no manual intervention.

The platform targets use cases such as:
- **Rental deposits** — a tenant locks a deposit in escrow; it is returned automatically at the end of the rental period if no dispute is raised
- **Freelance payments** — a client funds escrow upfront; the contractor receives payment upon delivery
- **P2P marketplace trades** — any two-party exchange where neither side wants to go first

The escrow lifecycle follows four steps:
1. **Create Escrow** — the initiating party creates a secure escrow account on-chain
2. **Fund Escrow** — the deposit or payment is locked into the escrow contract
3. **Rental/Service Agreement** — terms are stored and enforced by the contract
4. **Completion or Cancellation** — funds are released to the appropriate party based on the outcome

What distinguishes SafeTrust from a simple multi-sig wallet is the **automated refund system**: the contract logic handles fund release without requiring both parties to be online simultaneously or to trust a third-party arbitrator.

---

## Technical Architecture

SafeTrust is split across four repositories, each serving a distinct layer:

### 1. Frontend (`frontend-SafeTrust`) — Next.js 15 / TypeScript

The main user-facing application. Built with:
- **Next.js 15** (App Router) and **TypeScript** for type-safe, server-rendered UI
- **Tailwind CSS** for styling
- **Apollo Client 4** for GraphQL queries against the Hasura backend
- **Firebase Authentication** (Email/Password + Google OAuth) for user identity
- **Freighter, Albedo, and LOBSTR** wallet adapters for Stellar account connection
- **TrustlessWork API** (`api.trustlesswork.com`) for all escrow operations

The frontend communicates with the escrow layer exclusively through the TrustlessWork REST API — it never constructs raw Soroban XDR directly. This is a deliberate architectural choice: it keeps the frontend simple and delegates all contract complexity to a proven infrastructure layer.

Key API endpoints used:
- `POST /escrow/initiate` — creates a new escrow agreement
- `POST /escrow/fund` — locks funds into the escrow contract
- `POST /escrow/complete` — releases funds to the appropriate party

### 2. Backend (`backend-SafeTrust`) — Hasura GraphQL Engine + PostgreSQL

The data layer. Built with:
- **Hasura GraphQL Engine** for auto-generated, permission-aware GraphQL APIs over PostgreSQL
- **PostgreSQL** as the primary database (multi-tenant schema)
- **Docker Compose** for local development and deployment
- **Karate framework** for API integration testing
- **Firebase Admin SDK** for server-side JWT verification (webhooks sync new users from Firebase Auth to PostgreSQL)

The metadata architecture uses a tenant-based Hasura configuration: a `base/` folder holds shared GraphQL schema and dependencies, while `tenants/` holds per-tenant tables, functions, relations, and triggers. This design allows SafeTrust to scale to multiple isolated deployments without duplicating infrastructure.

The backend does **not** hold the Hasura admin secret in the frontend environment — the frontend authenticates via Firebase JWT tokens, which Hasura validates through a configured auth webhook. This is a security-conscious design that prevents privilege escalation from the browser.

### 3. Landing Page (`landing-SafeTrust`) — TypeScript

A marketing and onboarding site presenting the platform's value proposition. Separate from the main app to allow independent deployment and content updates.

### 4. dApp (`dApp-SafeTrust`) — TypeScript

An alternative dApp interface for the platform, likely targeting a more Web3-native user flow with direct wallet interaction.

---

## Stellar Integration

SafeTrust integrates with Stellar in two primary ways:

### TrustlessWork API (Soroban Escrow)
The escrow logic runs on **Soroban smart contracts** deployed by TrustlessWork. SafeTrust calls the TrustlessWork API, which in turn invokes the appropriate Soroban contract functions on the Stellar network. This means every escrow created through SafeTrust results in an on-chain Soroban contract invocation, with funds held in a non-custodial contract account until release conditions are met.

The TrustlessWork integration supports both **testnet** (`dev.api.trustlesswork.com`) and **mainnet** (`api.trustlesswork.com`) environments, controlled via the `NEXT_PUBLIC_TRUSTLESS_NETWORK` environment variable.

### Stellar Wallet Integration
Users connect their Stellar wallets (Freighter, Albedo, or LOBSTR) to authenticate and sign transactions. The wallet address serves as the user's on-chain identity within the escrow flow — the escrow contract records both the depositor and recipient Stellar addresses, ensuring only the correct parties can trigger fund release.

### Trustline Process
SafeTrust implements a **trustline verification step** before escrow creation. This ensures both parties have established the required asset trustlines on their Stellar accounts, preventing transaction failures due to missing trustlines — a common friction point in Stellar-based applications.

---

## On-Chain Verification

SafeTrust's escrow operations are executed through TrustlessWork's Soroban contracts on the Stellar network. On-chain activity can be verified via:

- **TrustlessWork Testnet API:** `https://dev.api.trustlesswork.com`
- **TrustlessWork Mainnet API:** `https://api.trustlesswork.com`
- **Stellar Expert (Testnet):** Search for TrustlessWork escrow contract invocations at `https://stellar.expert/explorer/testnet`
- **Stellar Horizon (Testnet):** `https://horizon-testnet.stellar.org`

Since SafeTrust delegates escrow contract deployment to TrustlessWork, individual escrow instances are created as separate Soroban contract deployments on the Stellar ledger. Each escrow has a unique contract address traceable on any Stellar explorer.

---

## Community & Ecosystem

| Metric | Value |
|---|---|
| Frontend stars | 21 |
| Frontend forks | 88 |
| Backend forks | 84 |
| Landing forks | 70 |
| Frontend commits | 806+ |
| Backend commits | 575+ |
| Stellar Wave tier | 4x Points |
| Location | Costa Rica |
| Telegram | t.me/safetrustcr |
| X | @SafeTrustCR |

The fork counts are notably high relative to stars — 88 forks on the frontend with only 21 stars suggests a large number of contributors actively working on the codebase rather than passive observers. This is consistent with the Stellar Wave Program model, where contributors fork repos to solve open issues and earn Wave Points.

---

## Independent Analysis

SafeTrust occupies a distinct niche in the Stellar Wave ecosystem compared to other escrow-adjacent projects:

- **vs. Trustless Work:** SafeTrust is a *consumer* of TrustlessWork's infrastructure, not a competitor. It adds a user-facing product layer (UI, auth, database) on top of TrustlessWork's raw escrow primitives. This is exactly the composability the Wave Program is designed to encourage.
- **vs. Stellar Rent:** Both target rental use cases, but SafeTrust is more general-purpose (any P2P transaction) while Stellar Rent focuses specifically on property rentals with a landlord/tenant model.
- **vs. KindFi:** KindFi uses escrow for milestone-based crowdfunding; SafeTrust uses it for bilateral P2P agreements. Different user bases and trust models.

The multi-tenant Hasura architecture in the backend is a notable technical decision — it suggests the team is building toward a platform that could host multiple independent SafeTrust deployments (e.g., for different markets or partners) rather than a single monolithic product.

The use of the Karate framework for API testing (BDD-style Gherkin test files make up 30% of the backend codebase) indicates a mature testing culture uncommon in early-stage Wave projects.

---

## Submission Checklist

- [x] Project is a verified Stellar Wave Program participant (4x Points on Drips)
- [x] Description is original and demonstrates independent research (beyond README)
- [x] Technical architecture documented in detail
- [x] Stellar integration explained (TrustlessWork API → Soroban contracts)
- [x] On-chain verification paths provided
- [x] Category and tags identified: `payments`, `defi`, `escrow`, `p2p`, `soroban`, `stellar-wave`, `trustless`, `costa-rica`, `infrastructure`
- [x] Community metrics documented
- [x] Independent comparative analysis included
