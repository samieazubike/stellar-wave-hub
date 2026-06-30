# SafeTrust — Stellar Wave Research Submission

## Project Selected

- **Project:** SafeTrust
- **Wave source:** `safetrustcr/frontend-SafeTrust`, `safetrustcr/backend-SafeTrust`, and `safetrustcr/dApp-SafeTrust` — all listed as 4x Points repos in Stellar Wave repositories on Drips
- **Domain:** Payments / DeFi / Infrastructure / Hospitality & Tourism
- **Website:** https://safetrustcr.vercel.app
- **Repositories:**
  - Frontend: https://github.com/safetrustcr/frontend-SafeTrust
  - Backend: https://github.com/safetrustcr/backend-SafeTrust
  - dApp Monorepo: https://github.com/safetrustcr/dApp-SafeTrust
  - Landing Page: https://github.com/safetrustcr/landing-SafeTrust
- **Organization:** safetrustcr (Costa Rica)

## Why This Matches the Task

SafeTrust is an active Stellar Wave Program participant at the 4x Points tier (the highest multiplier on Drips) with a substantial multi-repo codebase spanning Next.js frontends, Hasura GraphQL backends, Docker Compose infrastructure, and Stellar blockchain integration via the TrustlessWork API. The project targets the global hospitality and tourism sector — a multi-trillion dollar industry — with a decentralized escrow solution that replaces traditional intermediaries like banks and payment processors with Stellar Soroban smart contracts. At the time of this submission, SafeTrust had not yet been submitted to Stellar Wave Hub.

The project demonstrates a strong real-world use case for Stellar blockchain technology: secure, transparent, and automated deposit holding and release for hotel bookings, vacation rentals, and tourism services. With 21+12+1 stars and 99+93+83 forks across its three main repositories, it has attracted meaningful community engagement during its participation in Stellar Wave cycles.

## Verifiable On-Chain IDs

SafeTrust uses **Trustless Work's permissionless escrow infrastructure** for its on-chain operations rather than deploying custom Soroban contracts. The Trustless Work API provides the smart contract layer, meaning all escrow transactions are executed on Stellar's network through Trustless Work's battle-tested Soroban contracts. The platform connects to Stellar mainnet and testnet via the Trustless Work API for escrow deployment and management.

**Platform Stellar Address (testnet/mainnet):** Configured via `NEXT_PUBLIC_PLATFORM_ADDRESS` in the project's environment configuration. The actual deployed address is managed by the SafeTrust team and set during deployment.

**Trustless Work Escrow Contract (testnet):**
The underlying escrow infrastructure used by SafeTrust is Trustless Work's Soroban smart contract, which has been audited by Runtime Verification. Their testnet escrow contract can be verified at:
- Trustless Work API: https://api.trustlesswork.com
- Trustless Work Docs: https://docs.trustlesswork.com
- Trustless Work Smart Contracts: https://github.com/Trustless-Work/Trustless-Work-Smart-Escrow

**Stellar Horizon verification (Trustless Work testnet):**
The Trustless Work escrow engine processes transactions on Stellar testnet and mainnet. SafeTrust's escrow operations are verifiable through the Trustless Work dashboard and Stellar block explorer for each escrow created on the platform.

## What SafeTrust Does

SafeTrust is a decentralized peer-to-peer escrow platform purpose-built for the hospitality and tourism industry. It allows hotels, vacation rental hosts, and tourism operators to accept booking deposits through blockchain-based escrow contracts instead of traditional payment intermediaries. When a guest books a property or service, their deposit is locked into a Stellar Soroban smart contract, held securely on-chain for the duration of the stay, and automatically released to the host upon checkout confirmation. If a dispute arises, the platform's transparent on-chain arbitration mechanism ensures fair resolution without requiring either party to trust a centralized intermediary.

The core problems SafeTrust solves are:
1. **Deposit security** — Traditional booking platforms like Airbnb hold guest deposits in bank accounts where funds can be mismanaged, delayed, or frozen. SafeTrust locks deposits in non-custodial smart contracts that neither party can unilaterally access.
2. **Intermediary fees** — Hotels and vacation rentals lose significant revenue to booking platform commissions and payment processor fees. SafeTrust eliminates these middlemen by routing payments directly between parties through Stellar's low-cost network.
3. **Dispute transparency** — When booking disputes arise, traditional platforms adjudicate behind closed doors with opaque processes. SafeTrust's on-chain arbitration is transparent and verifiable, with all evidence recorded immutably.
4. **Cross-border payments** — The tourism industry is inherently international. Stellar's fast, low-cost cross-border transaction capability means guests can pay from anywhere without currency conversion fees or settlement delays.

The platform is deliberately scoped to the hospitality vertical rather than being a generic escrow solution, which allows it to optimize the user experience for booking-specific flows — calendar-based availability, automatic check-in/check-out triggers, guest-host messaging, and property management integrations.

## Technical Architecture (Detailed)

SafeTrust is architected across four interconnected repositories that together form a complete decentralized booking and escrow platform:

### 1. Frontend Layer (`frontend-SafeTrust`)

The primary user-facing application is a **Next.js 15** (React 18/19) application with TypeScript and Tailwind CSS. It features:
- **Authentication:** Firebase Authentication with Email/Password and Google OAuth. No blockchain wallet required for basic browsing — users only need a Stellar wallet (Freighter, Albedo, or LOBSTR) when creating or funding an escrow.
- **GraphQL Data Layer:** Apollo Client 4 connecting to a Hasura GraphQL endpoint for real-time data synchronization. The frontend reads/writes property listings, bookings, escrow status, and user profiles through GraphQL queries and mutations.
- **Internationalization (i18n):** Built-in multilingual support for global tourism markets.
- **State Management:** React context and hooks for local state, with Apollo cache for server state.
- **Wallet Integration:** `@creit.tech/stellar-wallets-kit` for connecting Freighter, Albedo, and LOBSTR wallets.
- **Testing:** Jest, React Testing Library (unit/integration), Cypress (E2E), and Mock Service Worker (MSW) for API mocking.

### 2. Backend Layer (`backend-SafeTrust`)

The backend is a **Hasura GraphQL Engine** running on PostgreSQL with Docker Compose orchestration. It provides:
- **Multi-tenant architecture:** Separate metadata configurations for `safetrust` and `hotel_industry` tenants, enabling the platform to serve different verticals from a shared infrastructure base.
- **Event-driven webhook service:** Handles post-authentication user creation, Firebase token verification, and escrow lifecycle events (creation, funding, release, dispute).
- **Database migrations:** Structured SQL migrations tracked through Hasura's migration system.
- **Karate test framework:** API-level integration tests running in a separate Docker Compose stack for CI verification.
- **JWT-based authentication:** Firebase JWTs are verified server-side and passed to Hasura for row-level security.
- **Dockerized deployment:** Complete containerized stack with `docker compose up` for local development and production deployment.

### 3. dApp Integration Layer (`dApp-SafeTrust`)

The dApp monorepo (Turborepo + pnpm) wires the frontend and API together with:
- **Express API server** connecting Hasura GraphQL to the TrustlessWork escrow API
- **Hasura middleware** auto-generating GraphQL from PostgreSQL tables
- **End-to-end escrow flow:** Tenant connects Freighter wallet → clicks PAY → escrow deployed on Stellar via TrustlessWork API → funds locked until agreement fulfilled → owner receives funds on release or tenant recovers deposit in dispute
- **Cross-repo package sharing** for TypeScript types, utilities, and Stellar SDK helpers

### 4. Landing & Marketing (`landing-SafeTrust`)

A **Next.js** (legacy) and **Astro 5** (new, in migration) landing page that explains the product, features, and value proposition. The Astro version uses a hybrid architecture:
- Static HTML for most content (zero JavaScript by default)
- React islands for interactive components (wallet CTA, escrow card, animated stepper)
- Motion library for scroll-driven animations
- Storybook for component development and documentation

### 5. Stellar Integration Architecture

SafeTrust's Stellar integration is layered rather than monolithic:

```
┌─────────────────────────────────────────────────────────────┐
│                    SafeTrust Platform                        │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  frontend-   │    │  backend-    │    │   dApp-      │  │
│  │  SafeTrust   │◄──►│  SafeTrust   │◄──►│  SafeTrust   │  │
│  │  (Next.js)   │    │  (Hasura +   │    │  (Express +  │  │
│  │              │    │   Postgres)   │    │   Turborepo) │  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘  │
│         │                   │                   │          │
│         └───────────────────┼───────────────────┘          │
│                             │                               │
│                    ┌────────▼────────┐                      │
│                    │ TrustlessWork   │                      │
│                    │ API Layer       │                      │
│                    │ (HTTP + Signed  │                      │
│                    │  XDR)           │                      │
│                    └────────┬────────┘                      │
│                             │                               │
│                    ┌────────▼────────┐                      │
│                    │ Stellar Soroban │                      │
│                    │ Smart Contracts │                      │
│                    │ (Escrow Engine) │                      │
│                    └────────┬────────┘                      │
│                             │                               │
│                    ┌────────▼────────┐                      │
│                    │ Stellar Network │                      │
│                    │ (Mainnet /      │                      │
│                    │  Testnet)       │                      │
│                    └─────────────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

### 6. Escrow Lifecycle

The core workflow follows a structured lifecycle:

1. **Property Listing** — Host lists a property with price, availability, and terms
2. **Booking Request** — Guest selects dates and initiates a booking
3. **Escrow Creation** — A Soroban escrow contract is deployed via TrustlessWork API
4. **Deposit Funding** — Guest connects their Stellar wallet and funds the escrow with USDC
5. **Occupancy Period** — Funds are locked on-chain during the stay
6. **Checkout Confirmation** — Both parties confirm the stay completed satisfactorily (2/2 signature)
7. **Automatic Release** — Funds are released from escrow to the host's Stellar wallet
8. **Dispute (if needed)** — Either party can trigger arbitration; transparent on-chain resolution

## Stellar Integration

SafeTrust uses Stellar through the **TrustlessWork API**, which provides permissionless escrow infrastructure built on Soroban smart contracts:

1. **Non-custodial escrow** — Funds are held in Soroban smart contracts on Stellar, never in SafeTrust's bank account or database. SafeTrust never has custody of user funds.
2. **USDC stablecoin payments** — Escrows are funded with USDC on Stellar, providing price stability for booking deposits while leveraging Stellar's fast, low-cost transaction settlement.
3. **Stellar wallet authentication** — Users connect Freighter, Albedo, or LOBSTR wallets for signing escrow-related transactions, ensuring only the key holder can authorize fund movements.
4. **Trustline management** — The platform manages USDC trustlines on Stellar for seamless asset acceptance.
5. **Testnet/mainnet support** — Development and testing occurs on Stellar testnet (via Friendbot for XLM), with production deployments targeting Stellar mainnet.

The project configuration references Stellar mainnet as the production target with testnet for development:
- Stellar SDK via `@stellar/stellar-sdk`
- Testnet funding via Stellar Friendbot
- Trustless Work API for both testnet and mainnet environments

## Community & Ecosystem

- **frontend-SafeTrust:** ⭐ 21 stars, 99 forks, 897 commits, 9 open issues
- **backend-SafeTrust:** ⭐ 12 stars, 93 forks, 624 commits, 11 open issues
- **landing-SafeTrust:** ⭐ 12 stars, 83 forks, 404 commits, 6 open issues
- **dApp-SafeTrust:** ⭐ 1 star, 66 forks, 334 commits, 9 open issues
- **Total (all repos):** ~46 stars, ~341 forks, ~2,259 commits
- **Stellar Wave tier:** 4x Points (highest tier on Drips)
- **Tech stack:** TypeScript, Next.js, Astro, Hasura GraphQL, PostgreSQL, Docker, Stellar, TrustlessWork API
- **Testing:** Jest, React Testing Library, Cypress, Karate (backend API tests)
- **Wallet support:** Freighter, Albedo, LOBSTR
- **CI/CD:** GitHub Actions, CodeRabbit PR reviews
- **Organization:** safetrustcr (based in Costa Rica)
- **Active development:** Frequent commits across all repositories through 2025-2026

## Submission Details

This is a research submission documentation. The project will be submitted to Stellar Wave Hub via the submission form at https://usestellarwavehub.vercel.app/submit or the POST /api/projects endpoint.

- **Category:** Payments
- **Tags:** stellar, escrow, soroban, hospitality, tourism, payments, stellar-wave, defi, trustless-work, p2p, stablecoin, fintech, latin-america
