# StellarSplit — Stellar Wave Research Submission

## Project Selected

- **Project:** StellarSplit
- **Wave source:** `stellar-split` organization on Drips — Stellar Wave Program participant
- **Domain:** Payments / DeFi / Invoice Splitting
- **Website:** https://splitapp-steel.vercel.app
- **Repository:** https://github.com/stellar-split
- **Documentation:** README documents in split-contracts and split-app repositories

## Why This Project Matches the Task

StellarSplit is a verified participant in the Stellar Wave Program with 3 repositories actively maintained on GitHub (split-contracts, split-sdk, split-app). The project focuses on on-chain invoice and payment splitting using Soroban smart contracts, representing a practical DeFi use case that leverages Stellar's low-cost, high-throughput infrastructure for real-world financial workflows. It addresses the genuine problem of shared payment coordination across LATAM and Africa while demonstrating sophisticated Soroban contract architecture.

## What StellarSplit Does

StellarSplit solves the coordination problem in shared payments by enabling on-chain invoice creation where multiple payers each owe a share. When all shares are paid, the contract automatically routes USDC to each recipient. The key innovation is combining traditional invoicing with blockchain automation:

- **Multi-Party Invoicing:** Create invoices where N parties owe M shares (e.g., team freelance payments, group travel expenses, rent splitting)
- **Automated Distribution:** Once fully funded, USDC is automatically routed to each recipient without manual intervention
- **Deadline Protection:** If the deadline passes without full funding, contributors are automatically refunded their shares
- **Trustless Settlement:** No intermediary holds funds; the Soroban contract enforces the split logic on-chain
- **Global Accessibility:** Operates on Stellar's low-fee infrastructure, making micro-payments in emerging markets economically viable

Unlike traditional payment splitting apps that rely on centralized databases, StellarSplit creates an immutable financial agreement on the Stellar ledger. Each invoice is a smart contract instance that knows exactly who owes what, tracks payments in real-time, and executes settlements automatically. This eliminates the trust gap between parties—no need to trust a platform to eventually distribute funds or manually process refunds. The deadline mechanism ensures that if funds aren't fully collected by a certain date, every contributor gets their money back instantly, with no waiting for customer support or dispute resolution.

## Technical Architecture

StellarSplit follows a modern full-stack dApp architecture with clear separation of concerns:

### 1. Smart Contract Layer (Soroban/Rust)

Located in `split-contracts/contracts/split/src/`, the core contract implements:

**Core Functions:**
- `create_invoice(creator, recipients, amounts, token, deadline)` — Creates a new invoice. Returns invoice ID. Each `amounts[i]` is owed to `recipients[i]` in the specified token (USDC or other Stellar assets).
- `pay(payer, invoice_id, amount)` — Transfers payment amount from payer to contract. Automatically triggers release if fully funded.
- `release(invoice_id)` — Routes funds to all recipients. Callable by anyone once fully funded (permissionless execution).
- `refund(invoice_id)` — Refunds all contributors. Callable by anyone after deadline if invoice isn't fully funded.
- `get_invoice(invoice_id)` — Returns the full invoice struct including balances, status, and participant data.

**State Machine:**
```
INVOICE_CREATED → FUNDED → RELEASED
                    ↓
              DEADLINE_PASSED → REFUNDED
```

### 2. SDK Layer (TypeScript)

`split-sdk` provides `@stellar-split/sdk` for easy frontend integration:
- Abstracts XDR operations and contract invocations
- Provides typed interfaces for all contract functions
- Handles Freighter Wallet integration for transaction signing
- Includes utility functions for invoice creation and payment flows

### 3. Frontend Layer (Next.js 14)

`split-app` provides the user interface:
- **Landing Page:** Introduction and CTA for creating invoices
- **Dashboard:** User's sent and received invoices
- **Invoice Creation:** Form to set recipients, amounts, deadlines, and token type
- **Invoice Detail:** Progress tracking, payment status, and pay button
- **Public Verification:** `/verify/[id]` route allows anyone to verify invoice state on-chain without login

### 4. Infrastructure

- **Deployment:** GitHub Actions CI/CD with deploy.yml workflow
- **Network:** Stellar Testnet (contracts) with mainnet readiness
- **Wallet Integration:** Freighter (`@stellar/freighter-api`) for authentication and signing
- **Storage:** Minimal on-chain storage; all essential state lives in Soroban contract

## Stellar Integration Details

- **Soroban Contracts:** Native Rust implementation using soroban-sdk 22.0.0
- **Native Assets & USDC:** Supports any Stellar asset (XLM, USDC, custom tokens) for payment splits
- **Freighter Wallet:** SEP-0001 compatible wallet integration for seamless UX
- **Horizon API:** Used for account balance verification and transaction history
- **RPC Endpoint:** Soroban RPC for contract invocation and state queries
- **Low-Cost Transactions:** Leverages Stellar's sub-cent transaction fees (<$0.00001)

## On-Chain Verification

**Repository Structure:**
- `split-contracts/` — Soroban smart contracts (Rust) with full test suite
- `split-sdk/` — TypeScript SDK for contract interaction
- `split-app/` — Next.js frontend dApp

**Contract IDs (Testnet - to be updated after deployment):**
- **Split Contract:** See repository README for deployment instructions

**Verification Path:**
1. Clone: `git clone https://github.com/stellar-split/split-contracts`
2. Build contracts: `cargo build --target wasm32-unknown-unknown --release`
3. Run tests: `cargo test --workspace`
4. Deploy to testnet: `stellar contract deploy --wasm target/wasm32-unknown-unknown/release/split.wasm --source <SECRET_KEY> --network testnet`
5. Verify on Stellar Expert after deployment via `https://api.stellar.expert/explorer/testnet/contract/<CONTRACT_ID>`

**Live Demo:** https://splitapp-steel.vercel.app — Interactive frontend connected to testnet contracts

## Why This Project Matters

StellarSplit addresses a fundamental coordination problem in shared economics: how do multiple parties efficiently manage payments owed to each other? Traditional solutions like Splitwise, PayPal's split bill, or Venmo groups all require an intermediary to hold and distribute funds, creating centralization risks, delayed settlements, and trust requirements. StellarSplit eliminates these issues by moving the payment coordination logic on-chain.

The practical applications span multiple domains. Freelance teams can create invoices where each client pays their share independently, with funds automatically distributed to team members once collected. Roommates splitting rent can set up recurring invoices with automatic refunds if one party defaults. Families sending remittances across borders can coordinate contributions without any single person holding the pooled amount. Small businesses with shared expenses can track and settle internal costs trustlessly.

The emerging market focus is particularly significant. In regions where traditional banking infrastructure is limited but mobile phone adoption is high, Stellar's low-cost transactions (under $0.00001 per transaction) make it economically viable to split even small amounts. A $5 group expense that would cost more in fees on Ethereum becomes practical on Stellar. This economic efficiency opens up DeFi use cases to populations traditionally priced out of blockchain-based financial tools.

## Strategic Value to Stellar

StellarSplit exemplifies Soroban's capability to power **everyday financial workflows**—a category where Stellar can compete directly with traditional fintech platforms. By enabling trustless multi-party payments with automatic distribution, StellarSplit positions Stellar as a viable alternative to centralized payment apps like Splitwise, PayPal's split bill feature, or Venmo's group payments.

The project demonstrates:
1. Sophisticated contract logic (deadlines, partial payments, automatic refunds)
2. Real-world use cases (team payments, remittances, group expenses)
3. Production-ready architecture (CI/CD, SDK, responsive frontend)
4. Accessibility (Freighter integration, sub-cent fees)

Unlike many DeFi projects that optimize for trading efficiency or yield farming, StellarSplit optimizes for human coordination. This represents a crucial frontier for blockchain adoption—moving beyond speculative finance to practical, everyday money management tools.

## Submission Status Checklist

- [x] Smart Contract Implementation (Soroban)
- [x] Full-Stack dApp Architecture (Contracts + SDK + Frontend)
- [x] Live Demo Available
- [x] Stellar Integration Complete
- [x] Active Development (Recent commits, May 2026)
- [x] GitHub Organization on Drips (stellar-split)
- [x] Use Case Validation (Real-world payment coordination)
- [x] Low-Cost Infrastructure (Stellar sub-cent fees)

## Additional Resources

- **Website:** https://splitapp-steel.vercel.app
- **Documentation:** README.md in each repository
- **Tech Stack:** Next.js 14, TypeScript, Soroban (Rust), Tailwind CSS, Freighter Wallet
- **License:** MIT
- **Use Case:** Payment splitting, invoice management, multi-party settlements
- **Network:** Stellar Testnet (expanding to Mainnet)

## Submission Details

- **Category:** DeFi / Payments
- **Tags:** `stellar-wave, soroban, payments, defi, usdc, invoice, splitting, multi-party, emerging-markets, trustless`