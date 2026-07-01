# StellarRent — Stellar Wave Research Submission

## Project Selected

- **Project:** StellarRent
- **Wave source:** `Stellar-Rent/stellar-rent` on GitHub
- **Domain:** Rentals / Marketplace / Escrow / PropTech
- **Repository:** https://github.com/Stellar-Rent/stellar-rent
- **Documentation / Project page:** https://stellar-rent.gitbook.io/stellar-rent
- **Category:** `marketplace`

## Why This Matches the Task

StellarRent is a Stellar Wave Program project that builds a decentralized rental marketplace on Stellar using Soroban smart contracts. The codebase includes smart contract documentation, contract deployment metadata, and explicit Testnet contract links. This project is not currently present in the existing Hub research files, and it adds a strong use case for property rental with escrow and booking management on Stellar.

## Verifiable On-Chain IDs

- **BookingContract (Testnet Smart Contract):** `CB3ILSDNHL6TWZYZJAS4L27GLHNAGW4ISW6YXIBHGHL4QYI4JPLP6W3E`
- **Stellar Expert contract page:** https://stellar.expert/explorer/testnet/contract/CB3ILSDNHL6TWZYZJAS4L27GLHNAGW4ISW6YXIBHGHL4QYI4JPLP6W3E
- **Documentation source:** `apps/stellar-contracts/contracts/booking/CONTRACT_OVERVIEW.md` in the StellarRent GitHub repository

> Notes: The BookingContract documentation includes explicit `Contract ID` and `Contract Link` metadata. Additional StellarRent contract docs exist for `property-listing` and `review-contract` in the repo.

## What StellarRent Does

StellarRent is a peer-to-peer rental platform that enables property owners and tenants to transact with low fees, instant settlement, and transparent booking logic on Stellar. The core product includes:

- On-chain property booking management via the `BookingContract`
- Off-chain property listing storage and metadata with on-chain hash verification
- Escrow-style payment handling to protect guests and hosts during rental lifecycles
- A trust-minimized flow for availability checks, reservation creation, and status updates

The platform is designed to reduce traditional rental platform fees, remove double-booking risk, and make rental transactions verifiable on Stellar.

## Technical Architecture

- **Frontend:** Next.js with a modern UI for hosts and guests
- **Backend:** Node.js/Express plus Supabase for off-chain storage, user management, and integration logic
- **Smart Contracts:** Rust/Soroban contracts for booking and listing workflows
- **On-chain model:** Minimal essential state stored on-chain, with off-chain details hashed for integrity
- **Network:** Stellar Testnet for contract deployment and experimentation

## Stellar Integration

StellarRent leverages Stellar by:

- deploying Soroban smart contracts for booking and listing control
- recording reservation state and data integrity hashes on-chain
- using Stellar testnet contract deployment and contract invocation for rental flows
- exposing contract IDs and Stellar Expert verification links for transparent proof of deployment

## Submission Notes

This research submission is prepared for inclusion in Stellar Wave Hub as a new candidate project. The key verified artifact is the BookingContract contract ID on Stellar testnet, backed by the StellarRent GitHub repository and contract documentation.
