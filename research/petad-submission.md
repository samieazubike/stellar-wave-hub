# PetAd — Stellar Wave Research Submission

## Project Selected

- **Project:** PetAd
- **Wave source:** `amina69/PetAd-Frontend` + `amina69/petad-stellar` — Stellar Wave Program repositories
- **Domain:** Pet Adoption / Payments / Trust Infrastructure
- **Frontend Repository:** https://github.com/amina69/PetAd-Frontend
- **SDK Repository:** https://github.com/amina69/petad-stellar
- **Category:** Payments

## Why This Project

PetAd is one of the most socially impactful projects in the Stellar Wave ecosystem. It solves a real-world trust problem in pet adoption by using Stellar's blockchain infrastructure to create transparent, tamper-proof escrow arrangements between pet owners, adopters, and shelters. In an industry historically plagued by fraud, abandoned adoptions, and misrepresented animals, PetAd introduces cryptographic guarantees that protect all parties involved. This is blockchain solving a genuine human problem, not technology for its own sake.

## What The Project Does

PetAd is a full-stack pet adoption and temporary custody management platform powered by Stellar blockchain trust guarantees. The platform enables users to browse pets, initiate adoption processes, and manage temporary custody arrangements — with all financial settlements handled transparently on-chain via Stellar escrow accounts.

The system addresses three critical problems in traditional pet adoption:

1. **Trust Gap** — Adopters and shelters have no trustless mechanism to ensure funds are only released when adoption conditions are met. PetAd solves this with Stellar escrow accounts that lock funds until both parties confirm completion.

2. **Dispute Resolution** — When adoptions go wrong (misrepresented health conditions, custody violations), there is typically no neutral arbitration mechanism. PetAd implements a full dispute system with escrow settlement pausing, evidence submission, and admin-mediated resolution.

3. **Transparency** — All financial flows are recorded on the Stellar blockchain, giving shelters, adopters, and regulators full visibility into transaction history via Stellar Horizon API.

## Technical Architecture

PetAd is structured as three interconnected layers:

**Frontend Layer (`amina69/PetAd-Frontend`):**
Built with React 18, TypeScript, Vite, and TailwindCSS. Uses TanStack Query for server state management and React Router for navigation. Implements real-time escrow status polling, adoption timeline tracking, and a full dispute management UI. Key components include `EscrowProgressStepper`, `DisputeBanner`, `EscrowStatusCard`, and `EscrowTimelinePanel` — all connected to live Stellar transaction data via `StellarTxLink` components that deep-link to Stellar Expert explorer.

**Blockchain SDK Layer (`amina69/petad-stellar`):**
A purpose-built TypeScript SDK (`@petad/stellar-sdk`) that abstracts Stellar operations for the PetAd use case. Provides `buildPaymentOp()` for constructing XLM payment operations, `decodeMemo()` for transaction memo parsing, `createEscrowAccount()` for multi-signature escrow setup, `lockCustodyFunds()` for temporary custody arrangements, and `anchorTrustHash()` / `verifyEventHash()` for cryptographic event verification. All operations use the official `@stellar/stellar-sdk` under the hood.

**Backend API Layer:**
RESTful API handling user authentication, adoption workflows, escrow lifecycle management, document uploads, and webhook processing. Integrates with Stellar Horizon for on-chain data and implements SEP-10 style authentication patterns.

## Stellar Integration Details

PetAd uses Stellar specifically for:

- **Escrow Accounts** — Multi-signature Stellar accounts holding adoption funds until conditions are met. Escrow state machine: `AWAITING_FUNDS → FUNDED → SETTLEMENT_TRIGGERED → FUNDS_RELEASED`
- **Payment Operations** — XLM transfers between adopters, shelters, and escrow accounts
- **Transaction Memos** — Encoding adoption IDs and custody conditions in Stellar transaction memos for on-chain auditability
- **Horizon API** — Real-time polling of escrow account status, transaction history, and settlement confirmations
- **Trust Hashing** — Cryptographic hashing of custody conditions anchored to Stellar transaction hashes for tamper-proof verification

## Dispute System

PetAd implements a sophisticated on-chain dispute resolution system:
- Disputes pause escrow settlement immediately
- Evidence (documents, photos, statements) can be submitted by either party
- Admin mediators review disputes and trigger resolution
- All dispute events are recorded with Stellar transaction references
- Escrow funds are held safely throughout the dispute process

## Independent Research Assessment

PetAd represents a genuinely novel application of Stellar's trust infrastructure. While most blockchain pet adoption concepts remain theoretical, PetAd has built production-ready frontend components, a tested TypeScript SDK with 85+ passing unit tests, and a complete dispute resolution workflow. The project demonstrates deep understanding of Stellar's escrow primitives and applies them to a domain with clear social impact.

The SDK's constant-time validation, proper error handling with typed error classes (`ValidationError`, `EscrowNotFoundError`, `HorizonSubmitError`), and comprehensive test coverage indicate a mature engineering approach suitable for production deployment.

## Verified Repository Artifacts

- **Frontend:** https://github.com/amina69/PetAd-Frontend
- **SDK:** https://github.com/amina69/petad-stellar
- **SDK Package:** `@petad/stellar-sdk` v0.1.0
- **Key SDK functions verified:** `buildPaymentOp`, `decodeMemo`, `createEscrowAccount`, `lockCustodyFunds`, `anchorTrustHash`, `verifyEventHash`
- **Stellar SDK dependency:** `@stellar/stellar-sdk ^12.0.0`

## Submission Details

- **Hub URL:** https://usestellarwavehub.vercel.app
- **Category:** Payments
- **Tags:** `pet-adoption, escrow, stellar, payments, trust, custody, dispute-resolution, stellar-wave, social-impact`
- **Status:** SUBMITTED

## Submission Confirmed

Live submission completed successfully on March 29, 2026.

- **Hub URL:** https://usestellarwavehub.vercel.app
- **Status:** SUBMITTED (pending admin approval)
- **Account:** spiffamani
- **Submitted:** 29/03/2026