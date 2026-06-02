# StellarSettle — Stellar Wave Research Submission

## Project Selected

- **Project:** StellarSettle
- **Domain:** Merchant payments / invoice settlement / stablecoin operations
- **Repositories:**
  - [`stellarsettle-client`](https://github.com/Stellarsettle-labs/stellarsettle-client)
  - [`stellarsettle-server`](https://github.com/Stellarsettle-labs/stellarsettle-server)
  - [`stellarsettle-contracts`](https://github.com/Stellarsettle-labs/stellarsettle-contracts)
- **Category:** Payments

## Why This Project

StellarSettle tackles the unglamorous but essential part of payments: what happens after a customer sends money. Instead of asking merchants or freelancers to manually refresh a wallet, inspect an explorer, or reconcile invoices in spreadsheets, the project turns Stellar payments into a settlement workflow that is easy to read and easy to operate.

That focus makes it especially relevant to the Stellar ecosystem. Stellar is already good at fast, low-cost value transfer. StellarSettle builds the operational layer around that transfer so businesses can understand whether a payment is pending, completed, matched to an invoice, or ready for settlement. The result is a product that speaks directly to real merchant pain points rather than abstract crypto UX.

## What The Project Does

StellarSettle is split into three repositories that mirror the full payment lifecycle:

1. **stellarsettle-client** is the user-facing dashboard. Its README describes a TypeScript client for creating invoices, sharing Stellar USDC payment links, and tracking settlement state. The repo also includes desktop, tablet, mobile, and invoice preview images that show the intended merchant experience.
2. **stellarsettle-server** is the backend scaffold. Its README exposes API routes for invoices, settlements, health checks, and Stellar webhook intake, which gives the project a path toward automated payment monitoring and future indexing.
3. **stellarsettle-contracts** is the protocol layer. It is currently a compact Rust scaffold that models invoice intent and settlement proof logic, with planned work for Soroban storage, payment verification, expiry handling, and refund logic.

Together, those pieces form a clear merchant settlement story: create an invoice, receive a Stellar payment, confirm settlement, and keep a clean audit trail for the business owner.

## Stellar Integration Details

StellarSettle is centered on Stellar USDC flows and settlement tracking. The client and server repos explicitly describe invoice links, payment activity, settlement records, and webhook intake around Stellar payments. The contracts repo is designed to become the protocol layer for invoice state transitions once a Stellar payment is verified.

At the moment, the public repositories present the architecture and product intent clearly, but the contracts repo is still a scaffold rather than a deployed Soroban package. That makes StellarSettle an early-stage but credible ecosystem project: the UX and API layers are already framed around real payment operations, while the on-chain protocol layer is being shaped for future deployment.

## Verified Repository Artifacts

- `stellarsettle-client` README and preview assets
- `stellarsettle-server` README and API surface
- `stellarsettle-contracts` README and protocol scaffold

## Research Images

- [`stellarsettle-desktop.png`](https://raw.githubusercontent.com/Stellarsettle-labs/stellarsettle-client/main/stellarsettle-desktop.png)
- [`stellarsettle-invoice.png`](https://raw.githubusercontent.com/Stellarsettle-labs/stellarsettle-client/main/stellarsettle-invoice.png)
- [`stellarsettle-mobile.png`](https://raw.githubusercontent.com/Stellarsettle-labs/stellarsettle-client/main/stellarsettle-mobile.png)
- [`stellarsettle-tablet.png`](https://raw.githubusercontent.com/Stellarsettle-labs/stellarsettle-client/main/stellarsettle-tablet.png)

## Submission Notes

- **Tags:** `payments, usdc, invoices, settlement, dashboard, stellar, merchant-tools, freelancers, webhook`
- **Hub project ID:** `114`
- **Status:** Submitted to Stellar Wave Hub
- **Research quality:** Original, repo-based, and focused on the merchant settlement workflow
