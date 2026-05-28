# OFFER-HUB — Stellar Wave Research Submission

## Project Identity

- **Project Name:** OFFER-HUB
- **Category:** Payments / Marketplace Infrastructure
- **Wave Source:** `OFFER-HUB/offer-hub-monorepo` on Stellar Wave Drips — **4x Points tier**
- **Repository:** [github.com/OFFER-HUB/offer-hub-monorepo](https://github.com/OFFER-HUB/offer-hub-monorepo)
- **Website:** [offer-hub.tech](https://www.offer-hub.tech/)
- **License:** MIT

---

## What OFFER-HUB Does

OFFER-HUB is a self-hosted, open-source **payments orchestration system** designed for freelance marketplaces and any platform that needs to manage buyer-seller payments with escrow protection. It solves a real problem that every marketplace faces: how do you hold funds securely between a buyer and a seller without becoming a custodian yourself, and without trusting a centralised intermediary?

The answer OFFER-HUB gives is to route all escrow logic through **Trustless Work**, a non-custodial escrow protocol built on Stellar's Soroban smart contracts. Funds are locked on-chain and released only when the agreed conditions are met — no platform wallet, no custodial risk.

From a user perspective the flow is straightforward:
1. A client tops up their OFFER-HUB balance via **Airtm** (a fiat-to-crypto on-ramp).
2. When they hire a freelancer, the payment goes into a Soroban escrow contract — the platform never holds the money.
3. The freelancer completes the work; the client approves.
4. Stellar settles the USDC directly to the freelancer in 3–5 seconds.
5. The freelancer withdraws to their Airtm account.

This is meaningfully different from traditional freelance platforms (Upwork, Fiverr) where the platform holds funds in a bank account and takes days to settle. OFFER-HUB's architecture eliminates the custodial layer entirely.

---

## Technical Approach

### Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS |
| Backend API | NestJS 10, Node.js 20 LTS, TypeScript |
| Database | PostgreSQL via Prisma ORM |
| Queue / Workers | Redis + BullMQ (async job processing) |
| Fiat On/Off-ramp | Airtm API |
| Escrow | Trustless Work (Soroban smart contracts on Stellar) |
| Settlement asset | USDC (Circle) on Stellar |

### Monorepo Structure

The project is organised as an npm workspace monorepo:

```
apps/
  api/      — NestJS server (port 4000)
  worker/   — BullMQ async task processor
packages/
  shared/   — DTOs, enums, utilities
  database/ — Prisma schema and migrations
  sdk/      — Official client SDK for marketplace integrations
```

The SDK is a notable design choice: OFFER-HUB is not just a product for end-users, it is infrastructure that other marketplace builders can embed. Any platform can install the SDK and get escrow-protected payments without writing Soroban code themselves.

### Stellar Integration

OFFER-HUB does not deploy its own Soroban contract. Instead it integrates with the **Trustless Work Smart Escrow** contract, which is already deployed and audited on the Stellar testnet:

- **Trustless Work Escrow Contract (Testnet):** `CBMEZ3FEJISOCYOTRXJAPUZEPH4IL43P6VQ4FQOZSIQEFL5HJH3WDYHQ`
- **Network:** Test SDF Network (September 2015)
- **Explorer:** [stellar.expert/explorer/testnet/contract/CBMEZ3FEJISOCYOTRXJAPUZEPH4IL43P6VQ4FQOZSIQEFL5HJH3WDYHQ](https://stellar.expert/explorer/testnet/contract/CBMEZ3FEJISOCYOTRXJAPUZEPH4IL43P6VQ4FQOZSIQEFL5HJH3WDYHQ)

This is a deliberate architectural decision: rather than reinventing escrow logic, OFFER-HUB composes on top of an existing, battle-tested Soroban primitive. The Trustless Work contract handles the on-chain state machine (funded → disputed → released / refunded), while OFFER-HUB's NestJS backend handles the off-chain orchestration (balance tracking, job queues, webhooks, idempotency).

The backend uses native idempotency keys on all payment operations, which is critical for a system that bridges async Stellar transactions with synchronous API calls. BullMQ workers handle retries and failure recovery so that a network hiccup on the Stellar side does not leave a user's balance in an inconsistent state.

---

## Why This Is Interesting Beyond the README

A few things stand out when you look past the marketing copy:

**1. The MCP server.** The repo includes an `mcp/` directory — a Model Context Protocol server. This means OFFER-HUB is building AI-agent integration from the start, allowing LLM-based agents to interact with the payment orchestration layer programmatically. This is forward-looking: as AI agents begin to transact on behalf of users, having a payment layer that speaks MCP natively is a real differentiator.

**2. The SDK-first design.** Most Wave projects build a product. OFFER-HUB is building infrastructure with a product on top. The `packages/sdk` package means other developers can integrate OFFER-HUB's escrow flow into their own marketplaces without touching Soroban directly. This multiplies the potential on-chain activity surface.

**3. Airtm as the fiat bridge.** Airtm is a peer-to-peer exchange popular in Latin America, particularly in countries with currency controls (Venezuela, Argentina). By choosing Airtm over a traditional payment processor, OFFER-HUB is explicitly targeting underbanked freelancers in emerging markets — the same demographic Stellar was designed to serve.

**4. 231 forks.** For a project with 24 stars, 231 forks is an unusually high ratio. This suggests a large number of contributors are actively building on or extending the codebase, consistent with its Wave Program participation and open contribution model.

---

## Team

| Handle | Role |
|---|---|
| [@Josue19-08](https://github.com/Josue19-08) | Project Lead & Full-Stack Developer |
| [@KevinMB0220](https://github.com/KevinMB0220) | Core Contributor & Developer |

The project has 231 forks and an active contributor community through the Stellar Wave Program.

---

## On-Chain Verification

OFFER-HUB's Stellar footprint is through the Trustless Work escrow contract it integrates with. The contract ID below is the canonical Trustless Work escrow deployment on Stellar testnet, confirmed from the `.stellar/contract-ids/escrow.json` file in the Trustless Work repository:

```
CBMEZ3FEJISOCYOTRXJAPUZEPH4IL43P6VQ4FQOZSIQEFL5HJH3WDYHQ
```

This contract handles the escrow state machine for all OFFER-HUB payment flows. Each freelance job creates a new escrow instance via this contract, with USDC as the settlement asset.

---

## Submission Fields

| Field | Value |
|---|---|
| **Name** | OFFER-HUB |
| **Slug** | offer-hub |
| **Description** | Self-hosted, non-custodial payments orchestrator for freelance marketplaces. Uses Trustless Work Soroban escrow on Stellar to hold funds on-chain until work is approved, with Airtm for fiat on/off-ramp. Zero custodial risk, MIT licensed, SDK available for marketplace integrations. |
| **Category** | Payments / Marketplace Infrastructure |
| **Stellar Contract ID** | `CBMEZ3FEJISOCYOTRXJAPUZEPH4IL43P6VQ4FQOZSIQEFL5HJH3WDYHQ` (Trustless Work escrow, testnet) |
| **GitHub** | https://github.com/OFFER-HUB/offer-hub-monorepo |
| **Website** | https://www.offer-hub.tech/ |
| **Tags** | payments, escrow, freelance, marketplace, soroban, usdc, airtm, nestjs, sdk, mcp |
| **Wave Tier** | 4x Points |
