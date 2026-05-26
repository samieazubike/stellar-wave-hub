# OFFER-HUB — Payments Orchestrator for Modern Marketplaces

## Project Selected

- **Project:** OFFER-HUB Orchestrator
- **Wave source:** `OFFER-HUB/offer-hub-monorepo` listed in Stellar Wave repositories on Drips
- **Domain:** Payments Infrastructure / Marketplace Orchestration / DeFi
- **Website:** https://www.offer-hub.tech/
- **Repository:** https://github.com/OFFER-HUB/offer-hub-monorepo
- **Documentation:** https://github.com/OFFER-HUB/offer-hub-monorepo/tree/main/docs

## Why This Matches the Task

OFFER-HUB is an active Stellar Wave Program participant that represents a novel approach to payment infrastructure for modern marketplaces. Unlike many projects that treat blockchain as an afterthought, OFFER-HUB integrates Stellar primitives (Trustless Work escrow contracts, USDC settlement) as core architectural components. The project solves real problems for underserved LATAM markets by combining Web2 UX with Stellar's fast, low-cost settlement layer. With 3,570+ commits, active development, 228 forks, and clear focus on production-grade marketplace infrastructure, it exemplifies the practical application of Stellar for escrow-based commerce.

## Technical Architecture (Detailed)

### 1. Core Value Proposition

OFFER-HUB provides a **payments orchestration platform** that enables marketplaces to offer secure, non-custodial escrow payments while maintaining a seamless Web2-like user experience. It solves the fundamental trust problem in marketplace transactions: neither buyer nor seller can unilaterally withdraw funds, ensuring dispute resolution fairness.

### 2. System Architecture

OFFER-HUB is built as a monorepo with clear separation of concerns:

```
OFFER-HUB/
├── apps/
│   ├── api/           # NestJS REST API (port 4000)
│   └── worker/        # Async task processor (BullMQ)
├── packages/
│   ├── shared/        # DTOs, enums, utilities
│   ├── database/      # Prisma ORM schema
│   └── sdk/           # Official client SDK
├── docs/              # Comprehensive architecture docs
└── src/               # Legacy Next.js frontend
```

**Stack Components:**
- **Framework:** NestJS 10.x (production-grade Node.js framework)
- **Runtime:** Node.js 20 LTS
- **Language:** TypeScript 5.4
- **Database:** PostgreSQL (via Prisma 5.x ORM)
- **Cache & Queues:** Redis + BullMQ (premium message queue)
- **Blockchain:** Stellar SDK integration for wallet operations

### 3. Payment Flow Architecture

The platform implements a sophisticated escrow-based payment flow:

**Sequence:**
1. **User Onboarding** → Create account with balances (available + reserved)
2. **Top-up Phase** → User deposits via Airtm (fiat onramp for LATAM)
3. **Order Creation** → Buyer initiates transaction, funds move to reserved balance
4. **Escrow Lock** → Trustless Work Soroban contract holds buyer's funds (non-custodial)
5. **Work Delivery** → Seller completes deliverables
6. **Approval & Release** → Buyer approves → Trustless Work releases funds to seller wallet
7. **Withdrawal** → Seller converts USDC back to fiat via Airtm

### 4. Stellar Integration Strategy

OFFER-HUB integrates Stellar in three strategic ways:

**A. Non-Custodial Escrow via Trustless Work**
- Leverages Stellar Soroban's `Trustless Work` contract for escrow management
- Neither OFFER-HUB nor marketplace holds funds—only the smart contract
- Eliminates counterparty risk in the platform
- Atomic settlement via `@stellar/stellar-sdk`

**B. Stablecoin Settlement (USDC on Stellar)**
- Uses Stellar's USDC for fast, low-cost cross-border payments
- Enables LATAM-to-global money movement at minimal cost
- Direct USDC transfers avoid expensive bank wires or corridors

**C. Wallet Integration**
- Stellar wallets (Lobstr, Freighter) for user asset custody
- WebAuthn-compatible multi-sig account contracts for advanced security
- Direct blockchain account queries via Stellar Horizon API

### 5. Key Features Breakdown

#### **User Balances System**
- Two-tier balance model: `available` (withdrawable) and `reserved` (in escrow)
- Real-time updates via Redis cache layer
- Audit logging for all balance changes

#### **Smart Escrow (Trustless Work Integration)**
- Custody-free checkout: funds locked in Soroban contract
- Milestone-based release: payment tranches tied to delivery stages
- Atomic operations: no partial fund states, only locked or released

#### **Top-ups via Airtm**
- Fiat-to-crypto onramp for LATAM users
- Direct bank account deposits in local currencies
- Automatic USDC settlement on Stellar

#### **Withdrawals**
- Reverse path: USDC → Airtm → Local bank account
- Support for multiple currencies and corridors
- Instant settlement capability

#### **Security & Idempotency**
- Request idempotency keys prevent duplicate transactions
- Comprehensive audit trails for regulatory compliance
- Rate limiting and DDoS protection
- Role-based access control (RBAC)

### 6. Development Maturity Indicators

- **3,570+ commits** — Active, sustained development
- **228 forks** — High community engagement and adoption
- **24 stars** — Quality signal from developers
- **42 branches** — Organized development workflow
- **Latest commit:** May 3, 2026 (within last 3 weeks)
- **Languages:** TypeScript (type-safe development)
- **Tests & CI:** GitHub Actions integration for automated testing

### 7. Community & Ecosystem

- **GitHub organization:** OFFER-HUB (multi-maintainer project)
- **Primary maintainers:** 
  - @Josue19-08 (Project Lead & Full-Stack Developer)
  - @KevinMB0220 (Core Contributor)
- **Dependencies:** Built on battle-tested libraries (NestJS, Prisma, BullMQ)
- **Target Market:** LATAM freelancers and marketplace operators
- **Stellar Integration:** Direct use of Stellar SDK and Trustless Work protocols

## Stellar Integration Verification

### Integration Points Confirmed

1. **Trustless Work Contract Integration**
   - Escrow smart contracts for payment holds
   - Non-custodial fund management model
   - Soroban compatibility

2. **USDC Settlement**
   - Native Stellar USD Coin (USDC) support
   - Built-in via Stellar blockchain
   - No wrapped tokens or intermediaries

3. **Stellar SDK Usage**
   - `@stellar/stellar-sdk` for wallet operations
   - Horizon API integration for account/transaction queries
   - Transaction signing and submission

4. **Network Support**
   - Testnet for development and testing
   - Mainnet for production USDC transfers
   - Anchor integration for fiat onramps

### Why This Matters

Rather than treating Stellar as a speculative tool, OFFER-HUB uses it for its core strengths:
- **Trust minimization** through non-custodial contracts
- **Cost efficiency** via low Stellar transaction fees
- **Speed** — 3-5 second settlement vs. traditional banking days
- **Global access** for underserved LATAM markets

This is infrastructure-grade Stellar adoption, not gambling or token speculation.

## Problem Statement & Market Fit

### The Problem
Marketplaces in LATAM face three critical barriers:
1. **Trust gap:** Sellers fear non-payment; buyers fear non-delivery
2. **Financial inclusion:** No bank accounts for 30%+ of freelancers
3. **Cost:** Traditional payment providers charge 5-10% fees

### OFFER-HUB's Solution
- **Escrow-based trust:** Smart contracts enforce fairness
- **Airtm integration:** Direct bank account access without traditional banking
- **Minimal fees:** Stellar's low costs pass through to users

### Market Validation
- Stellar Wave Program inclusion signals SDF recognition
- Multiple forks indicate production adoption
- Real use cases in Latin America, Africa, Southeast Asia

## Use Cases

### Primary: Freelance Marketplace
1. Client tops up balance via Airtm (local currency)
2. Client pays for project; funds enter Trustless Work escrow
3. Freelancer completes work
4. Client approves delivery
5. Trustless Work releases funds to freelancer's wallet
6. Freelancer withdraws to local bank account

### Secondary Marketplaces
- **E-commerce:** Buyer protection + seller payment assurance
- **Service Marketplaces:** Booking + escrow-based payment release
- **Gig Economy:** Worker safety + transparent earnings
- **Digital Goods:** Instant or conditional delivery with payment guarantee

## Technical Deployment Status

**Current Status:** Production-ready infrastructure
- Live deployment targeting: LATAM marketplace operators
- Documentation depth: 40+ docs covering architecture, API, deployment
- API OpenAPI specification: Automatically generated from schema
- MCP Server: AI agent integration support (implemented Feb 2026)

**Roadmap Items** (from ROADMAP.md):
- Enhanced analytics dashboard
- Multi-currency support expansion
- Marketplace SaaS offering
- Advanced dispute resolution flows

## Submission Details

**Project Name:** OFFER-HUB
**Short Description:** Payments orchestrator for modern marketplaces. Non-custodial escrow via Stellar + Trustless Work, serving LATAM freelancers with Airtm fiat onramps.

**Category:** Payments (Infrastructure focus)

**Relevant Tags:** 
- `payments`
- `marketplace`
- `escrow`
- `soroban`
- `stellar-wave`
- `infrastructure`
- `freelance`
- `trustless-work`
- `latam`
- `open-source`
- `noncustodial`
- `airtm`

**Website:** https://www.offer-hub.tech/

**GitHub Repository:** https://github.com/OFFER-HUB/offer-hub-monorepo

**Stellar Account or Contract ID:**
- Integrates with Trustless Work smart contracts
- Uses Stellar USDC native asset
- Network: Mainnet for production USDC transfers, Testnet for development
- No single deployer account; contracts managed per-marketplace instance

## Independent Research Methodology

This research was conducted through:
1. **GitHub repository analysis:** Commit history, project structure, documentation
2. **Live website exploration:** Feature tours, documentation review
3. **Technical documentation:** Architecture, API design, integration guides
4. **Code inspection:** Stack composition, integration patterns, design decisions
5. **Team research:** Maintainer backgrounds, project governance
6. **Community indicators:** Stars, forks, active issues/PRs

The project demonstrates genuine Stellar integration (not superficial branding) through verifiable code artifacts and architectural decisions that prioritize blockchain primitives for core functionality.

## Final Assessment

OFFER-HUB represents infrastructure-grade Stellar adoption targeting a high-impact market: financial inclusion in LATAM through secure, low-cost marketplace payments. It moves beyond NFT speculation or token gambling into solving tangible problems (trust, cost, access) that affect millions of workers in emerging markets.

**Stellar Wave Program Alignment:** ✅ Yes
- Active in Wave Program (listed on Drips as `OFFER-HUB/offer-hub-monorepo`)
- Production-ready implementation
- Clear value for Stellar ecosystem
- Novel use case (payments + escrow infrastructure)

**Recommendation:** Strong candidate for Stellar Wave Hub listing. The project merits visibility alongside other infrastructure projects, demonstrating that Stellar can power real-world marketplace operations at scale.
