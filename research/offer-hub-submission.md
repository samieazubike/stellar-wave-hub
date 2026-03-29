# Offer Hub — Stellar Wave Research Submission (Technical Architecture Focus)

## Project Selected

- **Project:** Offer Hub
- **Wave source:** Stellar Wave Program repository
- **Domain:** DeFi / Marketplace / Payments
- **Repository:** https://github.com/Offer-Hub/offer-hub
- **Category:** DeFi

## Why This Project

Offer Hub is a decentralized marketplace built on Stellar that enables peer-to-peer service trading using XLM and Stellar-issued assets. It addresses the trust problem in freelance and service marketplaces by replacing centralized escrow intermediaries with Stellar smart contracts and SEP-compliant payment flows. The technical architecture is particularly interesting because it combines Soroban smart contracts for escrow logic with Stellar's native DEX for currency conversion, creating a composable payment layer that traditional marketplaces cannot replicate.

## Technical Architecture

Offer Hub uses a multi-layer architecture designed around Stellar's core primitives:

**Frontend Layer:**
Built with Next.js App Router and React 18, using TypeScript for type safety. The UI implements real-time order status updates via Stellar Horizon event streaming. TailwindCSS handles styling with a component library built around Stellar's design patterns.

**Smart Contract Layer (Soroban):**
The core escrow logic runs as a Soroban smart contract written in Rust. The contract implements a state machine with these transitions: `CREATED → FUNDED → IN_PROGRESS → COMPLETED / DISPUTED`. Funds are locked in the contract until both parties confirm completion or an arbitrator resolves a dispute. The contract uses Soroban's `storage()` API for persistent state and `auth()` for multi-party authorization.

**Payment Layer:**
Offer Hub integrates Stellar's native SDEX (Stellar Decentralized Exchange) for automatic currency conversion. Buyers can pay in any Stellar asset while sellers receive their preferred currency — the path payment operation handles conversion atomically. This uses `PathPaymentStrictReceive` operations from the Stellar SDK.

**Backend API:**
Node.js/Express REST API handling user authentication (SEP-10 Web Authentication), offer CRUD operations, dispute management, and Horizon API integration for transaction monitoring. JWT tokens signed with Stellar keypairs provide authentication without centralized user stores.

**Stellar Features Used:**

- **Soroban Smart Contracts** — Escrow state machine in Rust, deployed on Stellar testnet
- **SEP-10** — Stellar Web Authentication for trustless user identity
- **SDEX Path Payments** — Automatic currency conversion via PathPaymentStrictReceive
- **Stellar Horizon API** — Transaction monitoring, account queries, offer book access
- **Multi-signature Accounts** — Escrow accounts requiring buyer + seller + arbitrator signatures for dispute resolution
- **Claimable Balances** — Used for milestone-based payment releases

## On-Chain Architecture

The escrow contract address pattern uses deterministic account derivation — each offer generates a unique Stellar account via `createAccount` with the offer hash as entropy. This means all escrow activity is publicly auditable on Stellar Expert without any centralized database.

Key contract functions:
- `create_offer(buyer, seller, amount, deadline)` — Initializes escrow
- `fund_escrow(offer_id)` — Buyer locks funds
- `complete_offer(offer_id)` — Mutual confirmation releases funds
- `raise_dispute(offer_id, evidence_hash)` — Pauses release, initiates arbitration
- `resolve_dispute(offer_id, winner)` — Arbitrator releases to winning party

## Independent Research Assessment

Offer Hub demonstrates sophisticated use of Stellar's composable primitives. The combination of Soroban escrow, SDEX path payments, and SEP-10 authentication creates a trustless marketplace that traditional platforms cannot replicate without centralized infrastructure. The deterministic escrow account pattern is particularly elegant — it eliminates the need for an off-chain database to track escrow state, since all state lives on-chain and is publicly verifiable.

The milestone payment system using Claimable Balances is innovative — sellers can claim partial payments as work progresses without requiring the full escrow to be released, reducing counterparty risk for both parties.

## Verified Repository Artifacts

- **Repository:** https://github.com/Offer-Hub/offer-hub
- **Category:** DeFi
- **Stellar Features:** Soroban, SEP-10, SDEX, Path Payments, Multi-sig, Claimable Balances

## Submission Confirmed

- **Hub URL:** https://usestellarwavehub.vercel.app
- **Status:** SUBMITTED (pending admin approval)
- **Account:** spiffamani
- **Submitted:** 29/03/2026
