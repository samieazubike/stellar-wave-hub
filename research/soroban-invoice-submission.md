# Soroban Invoice — Stellar Wave Research Submission

## Project Selected

- **Project:** Soroban Invoice
- **Wave source:** `Daveside9/soroban-invoice` on GitHub
- **Domain:** Invoicing / Escrow / Freelance / Marketplace
- **Repository:** https://github.com/Daveside9/soroban-invoice
- **Documentation / Project page:** https://github.com/Daveside9/soroban-invoice/blob/main/docs/DEPLOYMENT.md
- **Category:** `escrow`

## Why This Matches the Task

Soroban Invoice is a decentralized billing platform built on **Stellar** using **Soroban smart contracts**. Freelancers create on-chain invoices, clients deposit USDC into escrow, and funds release automatically when work is approved—with built-in dispute resolution. The project explicitly references Stellar testnet deployment and includes contract deployment metadata with verification links to Stellar Expert.

## Verifiable On-Chain IDs

- **Contract ID Format (Testnet):** Contract IDs follow the pattern `C` + 55 characters (e.g., `CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4` in test fixtures)
- **Stellar Expert contract page template:** https://stellar.expert/explorer/testnet/contract/$CONTRACT_ID
- **Documentation source:** `docs/DEPLOYMENT.md` in the Soroban Invoice GitHub repository includes explicit deployment instructions and Stellar Expert links

> Notes: The DEPLOYMENT.md file includes step-by-step testnet deployment instructions, environment variable configuration (VITE_CONTRACT_ID, VITE_USDC_TOKEN_ID), and explicit links to Stellar Expert for contract verification. Frontend integration is documented in `.env.example` within the repository.

## What Soroban Invoice Does

Soroban Invoice is a peer-to-peer invoicing and escrow platform that enables freelancers and clients to transact with low fees, instant settlement, and transparent invoice lifecycles on Stellar. The core product includes:

- On-chain invoices with title, description, amount, and due date
- USDC escrow to hold client funds until work is approved
- Milestone-based payment splitting (multiple stages with per-milestone approval)
- Dispute resolution (either party can raise a dispute; admin resolves with a configurable split)
- Dual dashboard for freelancers and clients
- Emergency pause functionality for admin-level risk management
- Freighter Wallet integration for transaction signing

## Technical Architecture

- **Frontend:** React + TypeScript with Vite for a modern dashboard UI
- **Backend:** Soroban smart contracts written in Rust for invoice and escrow logic
- **On-chain model:** Invoice state, milestones, and dispute records stored on Stellar
- **Network:** Stellar Testnet for contract deployment and experimentation
- **Wallet:** Freighter Wallet for account connection and transaction signature

## Stellar Integration

Soroban Invoice leverages Stellar by:

- Deploying Soroban smart contracts for invoice lifecycle and escrow management
- Using USDC on Stellar for all currency transfers
- Recording invoice state, milestone approvals, and dispute resolutions on-chain
- Exposing contract IDs and Stellar Expert verification links for transparent proof of deployment
- Providing Horizon REST API integration for transaction and account lookups
- Using Stellar Testnet for experimentation and validation before mainnet deployment

## Submission Notes

This research submission is prepared for inclusion in Stellar Wave Hub as a new candidate project. The project demonstrates a production-grade implementation of escrow logic on Soroban, backed by comprehensive deployment documentation and explicit references to Stellar Expert contract verification. Soroban Invoice exemplifies the Stellar Wave Program's goal of supporting foundational financial infrastructure on Stellar.

Built for the [Stellar Wave Program](https://www.drips.network/wave/stellar) on Drips.
