# SafeTrust — Stellar Wave Research Submission

## Project Identity

- **Project Name:** SafeTrust
- **Category:** DeFi / Payments / Infrastructure
- **Wave Source:** `safetrustcr/frontend-SafeTrust` listed in Stellar Wave repositories on Drips (4x Points)
- **Website:** https://safetrustcr.vercel.app
- **GitHub Org:** https://github.com/safetrustcr
- **Frontend Repo:** https://github.com/safetrustcr/frontend-SafeTrust
- **Backend Repo:** https://github.com/safetrustcr/backend-SafeTrust
- **dApp Monorepo:** https://github.com/safetrustcr/dApp-SafeTrust
- **Landing Page Repo:** https://github.com/safetrustcr/landing-SafeTrust
- **Telegram:** https://t.me/safetrustcr
- **Twitter/X:** https://x.com/SafeTrustCR
- **Email:** safetrustcr@gmail.com
- **Location:** Costa Rica

---

## Why This Matches the Task

SafeTrust is a verified Stellar Wave Program participant with **4x Points** on Drips — the highest tier available. It is an actively developed, open-source decentralized escrow platform built on the Stellar blockchain. With 806+ commits on the frontend alone, 88 forks, and a multi-repo architecture spanning frontend, backend, dApp monorepo, and landing page, SafeTrust demonstrates sustained, serious development effort. The project was not previously submitted to Stellar Wave Hub at the time of this submission.

---

## What SafeTrust Does

SafeTrust is a **decentralized peer-to-peer (P2P) escrow platform** that enables secure rental and payment transactions without intermediaries. The core problem it solves is the trust gap in P2P transactions: when two parties who don't know each other need to exchange value (e.g., a property rental deposit), there is no neutral party to hold funds safely. Traditional solutions require banks, lawyers, or centralized platforms — all of which add cost, delay, and counterparty risk.

SafeTrust eliminates this by locking funds in **Soroban smart contract escrows on the Stellar network** via the TrustlessWork API. Neither party can unilaterally access the funds; release is governed by the agreed contract terms. This makes the platform particularly valuable for:

- **Property rentals** — security deposits held in escrow until end of tenancy
- **Freelance/service payments** — milestone-based fund release
- **Marketplace transactions** — buyer protection without a centralized intermediary
- **Cross-border P2P deals** — crypto-native, no bank required

The platform targets the Latin American market (headquartered in Costa Rica) where trust in financial institutions is lower and access to traditional escrow services is limited or expensive.

---

## Technical Architecture

SafeTrust is organized as a multi-repository project with four distinct codebases:

### 1. Frontend (`frontend-SafeTrust`)
- **Stack:** Next.js 15, TypeScript, Tailwind CSS, Apollo Client 4
- **Auth:** Firebase Authentication (Email/Password + Google OAuth)
- **GraphQL:** Apollo Client connected to Hasura GraphQL Engine
- **Wallets:** Freighter, Albedo, LOBSTR (Stellar wallet integrations)
- **Testing:** Jest, React Testing Library, Cypress (E2E)
- **Commits:** 806+ | Stars: 21 | Forks: 88

### 2. Backend (`backend-SafeTrust`)
- **Stack:** Node.js, Hasura GraphQL Engine, PostgreSQL
- **Architecture:** Multi-tenant Hasura metadata system with per-tenant database schemas
- **Auth:** Firebase Admin SDK for JWT verification; webhooks sync new users to PostgreSQL
- **Testing:** Karate framework for API testing in Docker
- **Containerization:** Docker Compose for local development and testing
- **Commits:** 575+ | Stars: 11 | Forks: 84

### 3. dApp Monorepo (`dApp-SafeTrust`)
- **Stack:** Turborepo monorepo with pnpm workspaces
- **Apps:** `apps/frontend` (Next.js 14), `apps/api` (Node.js + Express)
- **Infrastructure:** Hasura GraphQL middleware, PostgreSQL
- **Purpose:** MVP integration layer wiring all components together
- **Commits:** 328+ | Forks: 30

### 4. Landing Page (`landing-SafeTrust`)
- **Stack:** TypeScript, Next.js
- **Stars:** 12 | Forks: 70

### Stellar Integration

SafeTrust integrates with Stellar in two key ways:

**Escrow via TrustlessWork API:**
The platform uses the [TrustlessWork API](https://docs.trustlesswork.com/trustless-work) as its escrow infrastructure layer. TrustlessWork provides permissionless Soroban smart contract escrows on Stellar. SafeTrust calls three primary escrow endpoints:
- `/escrow/initiate` — Creates the escrow agreement and deploys the contract
- `/escrow/fund` — Locks the deposit into the Soroban escrow contract
- `/escrow/complete` — Releases funds to the appropriate party upon completion

This is a deliberate architectural choice: rather than building custom Soroban contracts from scratch, SafeTrust leverages TrustlessWork's battle-tested escrow primitive, reducing attack surface and accelerating development.

**Trustline Process:**
SafeTrust implements Stellar's native trustline mechanism to add an extra layer of transaction security between parties. Verified trustlines between counterparties are established before funds are committed to escrow.

**Network:** Stellar Testnet (development/staging); production deployment targets Stellar mainnet via TrustlessWork's infrastructure.

**Wallet Support:** Freighter (primary), Albedo, LOBSTR — all major Stellar wallet providers are supported for transaction signing.

---

## On-Chain Activity & Verification

SafeTrust's on-chain activity flows through TrustlessWork's Soroban escrow contracts on the Stellar network. The escrow lifecycle is:

1. A user connects their Stellar wallet (Freighter/Albedo/LOBSTR)
2. An escrow is initiated via TrustlessWork API, deploying a Soroban contract instance
3. The renter funds the escrow — XLM or USDC is locked on-chain
4. Upon agreement completion or cancellation, funds are automatically released per contract terms

**Verification endpoints:**
- TrustlessWork API: `https://api.trustlesswork.com`
- TrustlessWork Dev API: `https://dev.api.trustlesswork.com`
- Stellar Testnet Horizon: `https://horizon-testnet.stellar.org`
- Stellar Expert (testnet): `https://stellar.expert/explorer/testnet`

The frontend environment variable `NEXT_PUBLIC_TRUSTLESS_NETWORK=testnet` confirms active testnet deployment. The TrustlessWork integration is documented in the frontend README and `.env.example`.

---

## Community & Ecosystem

- **Stellar Wave Tier:** 4x Points (highest tier on Drips)
- **Total GitHub forks across repos:** 272+ (88 + 84 + 70 + 30)
- **Total commits across repos:** 1,700+
- **Telegram:** https://t.me/safetrustcr (active community channel)
- **Twitter/X:** @SafeTrustCR
- **Figma Design:** https://www.figma.com/design/CVg9hoim0f1FIlozIar7ZZ/SafeTrust
- **Open Issues (Wave 5):** 13 open issues across frontend and backend repos eligible for Wave 5 contributions

---

## Why SafeTrust Matters for the Stellar Wave

SafeTrust demonstrates several important properties for the Stellar ecosystem:

1. **Real-world use case:** P2P rental escrow is a concrete, high-value problem. Security deposits are a multi-billion dollar market globally, and blockchain-based escrow can eliminate the friction and counterparty risk of traditional approaches.

2. **Composability:** SafeTrust's decision to build on TrustlessWork rather than reinventing escrow contracts shows how Stellar Wave projects can compose with each other — TrustlessWork is itself a Wave participant, and SafeTrust is a consumer of its infrastructure.

3. **Accessibility:** Supporting Freighter, Albedo, and LOBSTR wallets means SafeTrust works with the full range of Stellar users. Firebase Auth lowers the barrier for non-crypto-native users.

4. **Latin America focus:** The Costa Rica base and P2P rental focus directly addresses a real gap in Latin American financial infrastructure, aligning with Stellar's mission of financial inclusion.

5. **Active development:** 1,700+ commits across four repos, 272+ forks, and Wave 5 participation confirm this is not a dormant project.

---

## Key Metrics Summary

| Metric | Value |
|---|---|
| Stellar Wave Tier | 4x Points |
| Frontend Stars | 21 |
| Frontend Forks | 88 |
| Frontend Commits | 806+ |
| Backend Forks | 84 |
| Backend Commits | 575+ |
| dApp Monorepo Forks | 30 |
| Landing Forks | 70 |
| Total Forks | 272+ |
| Network | Stellar Testnet |
| Escrow Provider | TrustlessWork (Soroban) |
| Wallets Supported | Freighter, Albedo, LOBSTR |
| Auth | Firebase (Email/Password, Google OAuth) |
| Location | Costa Rica |

---

## Category & Tags

- **Primary Category:** DeFi / Payments
- **Secondary Categories:** Infrastructure, P2P, Escrow
- **Tags:** `stellar, soroban, escrow, p2p, defi, payments, trustlesswork, firebase, nextjs, latam, rental, open-source, testnet`

---

## Submission Details

Research completed: May 28, 2026

- **Project Status:** Active — Wave 5 participant with open issues
- **Recommended Approval:** Verified Stellar Wave Program participant (4x Points) with sustained development activity and real-world use case
- **Confidence Level:** High — publicly verifiable GitHub activity, TrustlessWork API integration documented in source code, active community channels
