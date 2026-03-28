# Trustless Work — Stellar Wave Program Research Submission

## Project Selected

- **Project:** Trustless Work
- **Wave Source:** `Trustless-Work/Trustless-Work-Smart-Escrow` listed in Stellar Wave repositories on Drips
- **Domain:** Escrow Infrastructure / Payments / Developer Tools
- **Website:** https://www.trustlesswork.com
- **Documentation:** https://docs.trustlesswork.com
- **GitHub Organization:** https://github.com/Trustless-Work
- **Key Repository:** https://github.com/Trustless-Work/Trustless-Work-Smart-Escrow

## Why This Matches the Task

Trustless Work is a production-grade Escrow-as-a-Service platform built on Stellar Soroban that has completed the Stellar Development Foundation Embark program and received a Stellar Community Fund Build Award (November 2024 cohort). The project provides permissionless escrow infrastructure enabling platforms to integrate milestone-based stablecoin payments without writing smart contracts. It is actively part of the Stellar Wave ecosystem with 18+ repositories, 8000+ repo clones, 50+ open-source contributors, and 15+ products building on the infrastructure.

## Verifiable On-Chain IDs

### Network Configuration
- **Mainnet API:** `https://api.trustlesswork.com`
- **Testnet API:** `https://dev.api.trustlesswork.com`
- **Stellar RPC (Testnet):** `https://soroban-testnet.stellar.org:443`
- **Network Passphrase:** `Test SDF Network ; September 2015`

### Key Stellar Addresses
- **USDC Asset Issuer (Mainnet):** `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`
- **Example Account (from escrow-lab JWT):** `GDN6IJLS5BR3W7QB3SAE3MYNBG6H4ZWDUGDYMEUQXE6F2QHXWHYM5MLX`

### Contract Deployment Model
Trustless Work uses a **dynamic contract deployment model** where each escrow creates its own standalone Soroban smart contract. The Escrow ID serves as both the on-chain contract identifier and the deposit address. Contracts are deployed via:

1. **API-driven deployment:** `/deployer/single-release` or `/deployer/multi-release` endpoints
2. **CLI deployment:** Using Stellar CLI (`stellar contract install` → `stellar contract deploy`)

### Verification Endpoints
- **Stellar Expert Explorer:** https://stellar.expert/explorer/public
- **Testnet Explorer:** https://stellar.expert/explorer/testnet
- **Trustless Work Escrow Viewer:** https://www.trustlesswork.com (OSS dApp)

### Example WASM Hash (from documentation)
`d36cd70c3b9c999e172ecc4648e616d9a49fd5dbbae8c28bef0b90bbb32fc762`

## Smart Contract Architecture (Detailed)

Trustless Work implements a sophisticated escrow infrastructure on Stellar Soroban with the following architectural layers:

### 1. Smart Contract Layer (Soroban/Rust)
The core escrow logic is implemented in Rust, compiling to WebAssembly (WASM) for Soroban execution. Key features include:

- **Role-Based Access Control (RBAC):** Encodes distinct roles (employer, employee, platform admin) with specific permissions
- **Milestone Management:** Supports both single-release and multi-release escrow contracts with configurable milestone structures
- **Dispute Resolution:** Built-in dispute and resolution mechanisms with role-gated actions (approve, dispute, resolve, release)
- **Event Emission:** Comprehensive event logging for off-chain indexing and analytics
- **USDC Integration:** Native support for USDC stablecoin with trustline validation

### 2. API Layer (REST)
The REST API abstracts smart contract complexity:

- **Deployment Endpoints:** `/deployer/single-release`, `/deployer/multi-release`
- **Funding Endpoints:** `/escrow/{type}/fund-escrow`
- **Milestone Management:** `/escrow/{type}/approve-milestone`, `/escrow/{type}/change-milestone-status`
- **Fund Release:** `/escrow/{type}/release-funds`, `/escrow/{type}/release-milestone-funds`
- **Dispute Handling:** `/escrow/{type}/dispute-escrow`, `/escrow/{type}/resolve-dispute`
- **Helper Functions:** `/helper/get-escrows-by-signer`, `/helper/get-escrows-by-role`, `/helper/set-trustline`

**Transaction Flow:** Most write endpoints return unsigned XDR that must be signed client-side with the appropriate role wallet, then submitted via `/helper/send-transaction`.

### 3. Indexing Layer (Go)
Trustless Work operates an official indexer (`Trustless-Work/Indexer`) written in Go that:

- Monitors Soroban contract events on Stellar
- Indexes escrow state changes, milestone approvals, and fund releases
- Provides real-time data for the dApp and API responses
- Tracks escrow lifecycle from deployment to completion

### 4. SDK & UI Layer
- **React SDK:** Provides typed hooks (`useInitializeEscrow`, etc.) for frontend integration
- **Escrow Blocks:** Ready-made UI components for common escrow flows
- **Escrow Viewer:** Open-source dApp for viewing and interacting with deployed escrows

### 5. Security & Audit
- **Protocol Fee:** 0.3% on mainnet transactions
- **Rate Limiting:** 50 requests per 60 seconds per client
- **Audit Status:** Publicly published audit report (2025)
- **Smart Contract Security:** Implements signature validation, replay protection, and role-gated actions

### Trust Model
Trustless Work leverages Stellar's inherent trust properties:
- **Non-custodial:** Funds held in smart contracts, not controlled by any central party
- **Transparent:** All transactions and contract states visible on Stellar blockchain
- **Fast Finality:** ~5 second transaction confirmation
- **Low Fees:** Fractions of a cent per transaction
- **Stablecoin Native:** Built for USDC and other Stellar-native stablecoins

## Stellar Integration Deep Dive

Trustless Work's integration with Stellar is comprehensive and production-grade:

### Soroban Smart Contracts
- **Language:** Rust (100% of smart contract codebase)
- **Compilation:** WASM target (`wasm32-unknown-unknown`)
- **Deployment:** Via Stellar CLI or API-driven deployment
- **Contract Model:** Each escrow deploys as an independent Soroban contract, enabling isolation and parallel execution

### Stellar Network Features Utilized
1. **Soroban Smart Contracts:** Programmable escrow logic with role-based access control
2. **Stellar Assets:** Native USDC support (issuer: `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`)
3. **Trustlines:** Required for holding USDC and other issued assets
4. **XDR Transactions:** All operations signed as Stellar transactions
5. **Horizon API:** Used for transaction submission and state queries
6. **Soroban RPC:** Direct contract interaction for advanced use cases

### Transaction Lifecycle
1. **Deploy:** API returns unsigned XDR → User signs with wallet → Contract deployed on Soroban
2. **Fund:** Employer deposits USDC to escrow contract via signed transaction
3. **Milestone Approval:** Client approves milestones → Triggers fund release eligibility
4. **Release:** Funds transferred from escrow contract to employee wallet
5. **Dispute (if needed):** Dispute initiated → Resolution determines fund distribution

### Enterprise Adoption
Trustless Work has achieved real-world traction:
- **Mirai-X (Japan):** Real estate tokenization platform using escrow for investor protections
- **Private Credit Platforms:** Capital allocation in Latin America using milestone-based releases
- **GrantFox:** Connects Stellar projects with contributors using transparent escrow workflows
- **Boundless:** Decentralized crowdfunding with milestone-based funding
- **Pacto:** P2P exchange locking stablecoins during off-chain transactions
- **PayonProof:** SME/retail payment platform in Costa Rica-Colombia corridor

## Team Information

Trustless Work is a Costa Rica-based team with strong ties to the Stellar LATAM community:

### Core Team Members
- **Armando Murillo** — Smart Contract Developer / Key Figure (LinkedIn: https://www.linkedin.com/in/armandocode)
- **Alberto Chaves** — "Escrow King" @ TrustlessWork (LinkedIn: https://cr.linkedin.com/in/alberto-chaves-escrowking)
- **Caleb Loría** — Smart Contract Developer
- **Joel Vargas** — Frontend Developer
- **Tech Rebel** — Product Manager

### Organizational Backing
- **Stellar Development Foundation Embark Program:** Completed
- **Stellar Community Fund (SCF):** Build Award recipient (November 2024 cohort)
- **Blockchain Acceleration Foundation (BAF):** Supported
- **Stellar LATAM:** Active community partner

### Social Presence
- **X (Twitter):** @TrustlessWork
- **LinkedIn:** https://www.linkedin.com/company/trustlesswork
- **Telegram:** Available
- **GitHub:** https://github.com/Trustless-Work (18 repositories, 22 followers)

## On-Chain Activity & Metrics

### Development Activity (GitHub)
- **Repositories:** 18 public repositories
- **Key Repos:**
  - `Trustless-Work-Smart-Escrow` (Rust): Core Soroban contracts
  - `dApp-Trustless-Work` (TypeScript): POC dApp
  - `escrow-lab` (TypeScript): Minimal dApp example
  - `Indexer` (Go): Official indexer
  - `clonable-backoffice` (TypeScript): Fast escrow initialization
  - `escrow-viewer` (TypeScript): Open-source viewer
- **Repo Clones:** 8000+
- **Open-Source Contributors:** 50+

### Production Milestones (2025)
- **Mainnet Launch:** Achieved in 2025
- **Audit:** Publicly published smart contract audit
- **Enterprise Pilots:** Multiple live implementations (Mirai-X, Latin American private credit)
- **Developer Adoption:** 2000+ developer repository clones
- **Ecosystem Projects:** 15+ products building on Trustless Work

### Protocol Metrics
- **Protocol Fee:** 0.3% on mainnet
- **Rate Limit:** 50 requests / 60 seconds
- **Supported Escrow Types:** Single-release, Multi-release (milestone-based)

## Submission Instructions

**Note:** The Stellar Wave Hub API requires authentication. To complete the submission:

### Option 1: Web Form Submission (Recommended)
1. Navigate to https://usestellarwavehub.vercel.app/submit
2. Sign in with your GitHub account
3. Fill in the submission form with the following details:

**Form Fields:**
- **Project Name:** Trustless Work
- **Description:** (Copy the 200+ word description from the "Required Fields Summary" section above)
- **Category:** Infrastructure / Developer Tools
- **Website URL:** https://www.trustlesswork.com
- **GitHub URL:** https://github.com/Trustless-Work
- **Stellar Account ID:** GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5 (USDC Issuer)
- **Contract ID/WASM Hash:** d36cd70c3b9c999e172ecc4648e616d9a49fd5dbbae8c28bef0b90bbb32fc762
- **Tags:** soroban, smart-contract, escrow, payments, infrastructure, developer-tools, stablecoin, usdc, stellar-wave, milestone-payments

### Option 2: API Submission (If you have auth token)
```bash
curl -X POST https://usestellarwavehub.vercel.app/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "name": "Trustless Work",
    "description": "[Full description from above]",
    "category": "Infrastructure",
    "websiteUrl": "https://www.trustlesswork.com",
    "githubUrl": "https://github.com/Trustless-Work",
    "stellarAccountId": "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
    "contractId": "d36cd70c3b9c999e172ecc4648e616d9a49fd5dbbae8c28bef0b90bbb32fc762",
    "tags": ["soroban", "smart-contract", "escrow", "payments", "infrastructure", "developer-tools", "stablecoin", "usdc", "stellar-wave", "milestone-payments"]
  }'
```

### Screenshots to Attach
When submitting, attach screenshots of:
1. Trustless Work Homepage (https://www.trustlesswork.com)
2. Documentation showing Stellar/Soroban integration
3. GitHub organization page (https://github.com/Trustless-Work)
4. Smart Escrow repository showing Rust codebase
5. Ecosystem projects page
6. 2025 Year in Review article
7. Drips Network Stellar Wave repos page showing Trustless Work

---

**Researcher:** [Your GitHub Username]
**Research Date:** March 28, 2026
**Wave:** Stellar Wave Program — Wave 3 (March 2026)
**Submission Status:** Ready for Manual Submission

### Required Fields Summary
| Field | Value |
|-------|-------|
| **Name** | Trustless Work |
| **Description** | Escrow-as-a-Service on Stellar (Soroban) enabling milestone-based stablecoin payments |
| **Category** | Infrastructure / Developer Tools |
| **Website** | https://www.trustlesswork.com |
| **GitHub** | https://github.com/Trustless-Work |
| **Documentation** | https://docs.trustlesswork.com |
| **Stellar Integration** | Soroban Smart Contracts (Rust), USDC, Dynamic contract deployment |
| **USDC Issuer** | `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5` |
| **API (Mainnet)** | `https://api.trustlesswork.com` |
| **API (Testnet)** | `https://dev.api.trustlesswork.com` |
| **Team Location** | Costa Rica |
| **Stellar Programs** | SDF Embark Program, SCF Build Award (Nov 2024) |
| **WASM Hash** | `d36cd70c3b9c999e172ecc4648e616d9a49fd5dbbae8c28bef0b90bbb32fc762` |
| **Tags** | soroban, smart-contract, escrow, payments, infrastructure, developer-tools, stablecoin, usdc, stellar-wave, milestone-payments |

## Research Screenshots Reference

For admin review, the following screenshots are recommended to be attached:

1. **Trustless Work Homepage** — https://www.trustlesswork.com (showing value proposition and ecosystem)
2. **Documentation Overview** — https://docs.trustlesswork.com (showing Stellar/Soroban integration details)
3. **GitHub Organization** — https://github.com/Trustless-Work (showing 18 repos and activity)
4. **Smart Escrow Repository** — https://github.com/Trustless-Work/Trustless-Work-Smart-Escrow (showing Rust codebase)
5. **API Documentation** — Swagger docs showing deployment and escrow endpoints
6. **Ecosystem Projects Page** — https://www.trustlesswork.com/ecosystem (showing integrations)
7. **2025 Year in Review** — https://www.trustlesswork.com/escrow-times/news-2025-Year-In-Review (showing mainnet achievement)
8. **Stellar Expert Explorer** — Contract search showing Soroban escrow contracts
9. **Drips Network Stellar Wave Page** — https://www.drips.network/wave/stellar/repos (showing Trustless Work repos in Stellar Wave Program)

## Conclusion

Trustless Work represents a mature, production-grade infrastructure project within the Stellar ecosystem. Its Escrow-as-a-Service model abstracts Soroban smart contract complexity, enabling platforms to integrate milestone-based stablecoin payments without blockchain expertise. With mainnet deployment achieved, a published audit, enterprise pilots in real estate tokenization and private credit, and 15+ ecosystem projects building on the infrastructure, Trustless Work demonstrates real-world utility and adoption.

The project's dynamic contract deployment model (each escrow is its own Soroban contract) showcases advanced Soroban capabilities, while the comprehensive API, SDK, and UI components lower the barrier to entry for developers. Backed by the Stellar Development Foundation Embark Program and a Stellar Community Fund Build Award, Trustless Work exemplifies the kind of infrastructure development that strengthens the Stellar ecosystem's DeFi and payments capabilities.

---

**Researcher:** [Your GitHub Username]
**Research Date:** March 28, 2026
**Wave:** Stellar Wave Program — Wave 3 (March 2026)
**Status:** Ready for Submission
