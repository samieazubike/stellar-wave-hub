# QuickEx — Stellar Wave Privacy Research Submission

## Project Selected
- **Project:** QuickEx (Pulsefy/QiuckEx)
- **Wave source:** Stellar Wave repos listed on Drips for Pulsefy (Stellar Wave Program)
- **Domain:** Payment links, remittances, and creator tooling with privacy toggles
- **Website:** https://quickex.to (QuickEx custom username links)
- **Repository:** https://github.com/Pulsefy/QiuckEx

## Why This Matches the Task
QuickEx is a privacy-first payment link platform built on Stellar that explicitly advertises optional X-Ray shielding and a Soroban-based privacy/escrow stack. The main README highlights fast USDC/XLM links, QR code payouts, and a toggle that hides amounts and senders with ZK-style commitments. These features squarely align with the Stellar Wave requirement for a privacy/security project, and the repo is not yet represented in Stellar Wave Hub submissions.

The README also mentions TurboRepo, Supabase, Horizon, and Soroban components, which means the project delivers a full-stack experience (frontend, backend, mobile, contracts) rather than just documentation.

## Verifiable On-Chain IDs
- No official QuickEx mainnet account or contract ID has been published in the repo yet; the Soroban code in `app/contract` shows how privacy and escrow state will live on-chain once the contract is deployed.
- Test snapshots reference placeholder contract IDs such as `CBUSYNQKASUYFWYC3M2GUEDMX4AIVWPALDBYJPNK6554BREHTGZ2IUNF`, and the organization has pinned its Stellar-focused repos on the Stellar Wave page.

## Smart Contract & Privacy Architecture
QuickEx organizes client, backend, mobile, and contract code in a monorepo with TurboRepo. Its README calls out Soroban Rust contracts for privacy/escrow, which implies:
1. A Soroban contract to manage deposits, withdraws, and privacy toggles.
2. A backend that ingests Horizon/Soroban events and enforces username lookups.
3. A frontend that lets users claim quickex.to usernames and toggle X-Ray before generating links.

These layers enable straightforward auditing while keeping sensitive flows inside Soroban, so sensitive values become commitments stored on-chain rather than raw transaction data.

The combination of these on-chain and off-chain systems lets QuickEx enforce deterministic policies while giving users a UX that feels like pitching a single app. The backend acts as the boundary for usernames, webhook flighting, and metrics ingestion, while the Soroban contract provides the strong guarantees for deposits, withdrawals, and privacy level tracking.

## Privacy & Threat Model
QuickEx targets users facing ledger-level visibility: anyone observing Horizon can usually read every amount, memo, and source. To counter that, QuickEx exposes:
- An X-Ray toggle powered by amount commitments that conceal transaction amounts and owners via deterministic salts and hash-based commitments (ZK-style placeholder).
- Self-custodial links so funds flow directly to user wallets, removing centralized custody risks.
- A Soroban escrow contract that proves ownership of funds before releasing them, which limits front-running and double-spend threats.

This model assumes adversaries can watch public ledgers but cannot break SHA256-sized commitments without knowing salts; it also assumes users keep salts/private keys secrets and the backend verifies event payloads before confirming completions. Users who disable privacy still enjoy the same escrow logic but without the shielded commitments.

The threat model also covers identity leakage: QuickEx hides usernames behind quickex.to links, which reduces the surface area for chain analysts trying to correlate payments back to a specific account. Optional scam alerts and memo enforcement guard against social-engineering attacks that try to trick users into revealing salts or running unsafe transactions.

Data protected by the X-Ray flow includes transaction amounts, sender addresses, and memos (when privacy is enabled). The escrow contract only stores status flags and encrypted commitment hashes, so the ledger only records that a commitment was created or spent, not the secret that generated it. When privacy is disabled, these fields are intentionally exposed so recipients can see amounts and origin information, giving the user control over privacy versus transparency.

## Submission Status
- Documented the research and verified QuickEx is a Pulsefy-listed Stellar Wave repo while confirming the repository is not yet in the Hub.
- Plan to submit via `POST /api/projects` with tags `privacy`, `security`, `stellar-wave`, and the template fields (name, description, category, ids, urls).
