# OFFER-HUB — Stellar Wave Research Submission

## Project Selected

- **Project:** OFFER-HUB
- **Wave source:** `OFFER-HUB/offer-hub` on GitHub
- **Domain:** Marketplace / Escrow / Payments / Identity
- **Repository:** https://github.com/OFFER-HUB/offer-hub
- **Documentation / Project page:** https://github.com/OFFER-HUB/offer-hub (multiple docs in repository)
- **Category:** `marketplace`

## Why This Matches the Task

OFFER-HUB is a decentralized marketplace platform that leverages Stellar and Soroban smart contracts for non-custodial escrow management. The project integrates **Trustless Work** (a foundational Stellar Wave infrastructure project) to deploy escrow contracts on Stellar Testnet. The codebase includes comprehensive documentation of Stellar network integration, smart contract deployment, and on-chain fund management.

## Verifiable On-Chain IDs

- **Stellar Test Wallet (Buyer):** `GCV24WNJYX6QC3RX7QBB5GYE66YRDJPU6A4RKMRS33CDDTMWLQDA7Y27`
- **Platform Wallet (Dispute Resolver):** `GDGLXLBOS4DQYDIC3XAHUXXWWEB4OFPFHG2D2KL6AHTZ6W3KC2VTZW4J`
- **USDC Issuer (Testnet):** `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`
- **Stellar Expert Contract Verification Template:** https://stellar.expert/explorer/testnet/contract/{contractId}
- **Documentation source:** `docs/crypto-native/escrow-lifecycle.md` and `docs/api/endpoints/escrow.md` in the OFFER-HUB GitHub repository

> Notes: The OFFER-HUB repository includes detailed documentation of Stellar integration, Trustless Work escrow deployment, and testnet wallet examples. The architecture explicitly uses Soroban smart contracts (`contractId` format: `C...`) for non-custodial escrow management.

## What OFFER-HUB Does

OFFER-HUB is a Web3 marketplace platform that enables peer-to-peer transactions with built-in, non-custodial escrow powered by Stellar smart contracts. The platform connects buyers and sellers while funds are secured through Soroban escrow contracts. Key features include:

- Decentralized marketplace with buyer-seller matching
- Non-custodial escrow using Trustless Work smart contracts on Stellar
- USDC settlement currency for all transactions
- Dispute resolution with designated platform wallet as arbiter
- Invisible wallet infrastructure (orchestrator-managed encrypted keys)
- Full transaction lifecycle: order creation, escrow deployment, funding, release/refund
- Testnet deployment with complete end-to-end flow validation

## Technical Architecture

- **Frontend:** Web3 interface with wallet connectivity
- **Backend:** API-driven orchestrator managing invisible Stellar wallets and escrow deployment
- **Smart Contracts:** Soroban smart contracts (via Trustless Work) for escrow lock/release logic
- **Currency:** USDC on Stellar Testnet for all settlement
- **Network:** Stellar Testnet for contract deployment and transaction execution
- **Wallet Model:** Encrypted invisible wallets managed by orchestrator (non-custodial pattern)

## Stellar Integration

OFFER-HUB leverages Stellar by:

- Deploying Soroban smart contracts via the **Trustless Work** API for escrow management
- Managing invisible Stellar wallets (non-custodial pattern)
- Using **USDC on Stellar Testnet** for all transactions
- Storing contract IDs (e.g., `CBL3SW...`) on-chain for verification
- Implementing Horizon API integration for account lookups and transaction submission
- Exposing Stellar Expert links for contract verification and debugging
- Using Stellar's payment infrastructure for fund transfers between wallets and contracts

## Submission Notes

This research submission is prepared for inclusion in Stellar Wave Hub as a marketplace project demonstrating advanced Stellar integration patterns. OFFER-HUB exemplifies the Stellar Wave Program's goal of building production-grade Web3 infrastructure by combining identity, payments, and smart contract escrow on Stellar. The project's integration with Trustless Work demonstrates interoperability between Wave projects and reusability of foundational Stellar infrastructure.

Built for the [Stellar Wave Program](https://www.drips.network/wave/stellar) on Drips.
