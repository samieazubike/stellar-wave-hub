# QuickEx — Stellar Wave Privacy Research Submission

## Project Selected
- **Project:** QuickEx (Pulsefy/QiuckEx)
- **Wave source:** Stellar Wave repos listed on Drips for Pulsefy (Stellar Wave Program)
- **Domain:** Payment links, remittances, and creator tooling with privacy toggles
- **Website:** https://quickex.to (QuickEx custom username links)
- **Repository:** https://github.com/Pulsefy/QiuckEx

## Why This Matches the Task
QuickEx is a privacy-first payment link platform built on Stellar that explicitly advertises optional X-Ray shielding and a Soroban-based privacy/escrow stack. The main README highlights fast USDC/XLM links, QR code payouts, and a toggle that hides amounts and senders with ZK-style commitments. These features squarely align with the Stellar Wave requirement for a privacy/security project, and the repo is not yet represented in Stellar Wave Hub submissions.

## Verifiable On-Chain IDs
- No official QuickEx mainnet account or contract ID has been published in the repo yet; the Soroban code in `app/contract` shows how privacy and escrow state will live on-chain once the contract is deployed.
- Test snapshots reference placeholder contract IDs such as `CBUSYNQKASUYFWYC3M2GUEDMX4AIVWPALDBYJPNK6554BREHTGZ2IUNF`, and the organization has pinned its Stellar-focused repos on the Stellar Wave page.

## Smart Contract & Privacy Architecture
QuickEx organizes client, backend, mobile, and contract code in a monorepo with TurboRepo. Its README calls out Soroban Rust contracts for privacy/escrow, which implies:
1. A Soroban contract to manage deposits, withdraws, and privacy toggles.
2. A backend that ingests Horizon/Soroban events and enforces username lookups.
3. A frontend that lets users claim quickex.to usernames and toggle X-Ray before generating links.

These layers enable straightforward auditing while keeping sensitive flows inside Soroban, so sensitive values become commitments stored on-chain rather than raw transaction data.

## Privacy & Threat Model
QuickEx targets users facing ledger-level visibility: anyone observing Horizon can usually read every amount, memo, and source. To counter that, QuickEx exposes:
- An X-Ray toggle powered by amount commitments that conceal transaction amounts and owners via deterministic salts and hash-based commitments (ZK-style placeholder).
- Self-custodial links so funds flow directly to user wallets, removing centralized custody risks.
- A Soroban escrow contract that proves ownership of funds before releasing them, which limits front-running and double-spend threats.

This model assumes adversaries can watch public ledgers but cannot break SHA256-sized commitments without knowing salts; it also assumes users keep salts/private keys secrets and the backend verifies event payloads before confirming completions. Users who disable privacy still enjoy the same escrow logic but without the shielded commitments.

## Submission Status
- Documented the research and verified QuickEx is a Pulsefy-listed Stellar Wave repo.
- Plan to submit via `POST /api/projects` with tags `privacy`, `security`, `stellar-wave`, and the template fields (name, description, category, ids, urls).
