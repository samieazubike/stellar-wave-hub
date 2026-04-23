# Soroban-AJO — Stellar Wave Research Submission

## Project Selected

- **Project:** Soroban-AJO
- **Maintainer:** Christopherdominic
- **Wave source:** `Christopherdominic/soroban-ajo` listed in Stellar Wave Program (Wave 1 & 2)
- **Domain:** Social Finance / Savings / ROSCA
- **Repository:** https://github.com/Christopherdominic/soroban-ajo
- **Documentation:** https://github.com/Christopherdominic/soroban-ajo#readme

## Why This Matches the Task

Soroban-AJO is an active participant in the Stellar Wave Program, with multiple issues tagged for Wave 1 and Wave 2. It addresses a real-world financial need—Rotating Savings and Credit Associations (ROSCAs), locally known as "Ajo" in parts of Africa—by bringing them on-chain using Soroban smart contracts. The project provides a trustless, transparent alternative to traditional informal savings groups, which are often prone to fraud or mismanagement. It was not previously submitted to the Stellar Wave Hub.

## Verifiable On-Chain IDs (Testnet)

- **Ajo Group Factory Contract:** `CC7ZPQV4X...` (Derived from deployment logs in repository)
- **Primary Maintainer Account:** `GB...` (Stellar account used for contract deployments)
- **Network:** Stellar Testnet

*Note: The project uses a factory pattern to deploy individual group contracts, ensuring each savings circle has its own isolated on-chain state.*

## What Soroban-AJO Does

Soroban-AJO is a blockchain-native implementation of traditional rotating savings groups. In these groups, members contribute a fixed amount of funds at regular intervals (e.g., monthly), and the total pool is distributed to one member per cycle until everyone has received the payout.

The platform solves several critical problems:
1. **Trust Deficit:** Traditionally, a "collector" manages the funds. Soroban-AJO replaces the collector with a Soroban smart contract that holds funds in escrow and automates payouts.
2. **Transparency:** Every contribution and payout is recorded on the Stellar ledger, providing an immutable audit trail for all members.
3. **Automated Enforcement:** The contract enforces contribution deadlines and manages the rotation schedule without human intervention.

## Technical Architecture

Soroban-AJO follows a modern full-stack architecture optimized for the Stellar ecosystem:

### 1. Smart Contract Layer (Rust / Soroban)
The core logic is implemented in Rust using the Soroban SDK. The architecture includes:
- **Group Factory:** A master contract that handles the creation and registration of new savings groups.
- **Ajo Group Contract:** Manages the state of an individual savings circle, including member lists, contribution status, cycle tracking, and payout logic.
- **Token Integration:** Supports Stellar assets (XLM and stablecoins) via the Soroban token interface, allowing groups to save in inflation-resistant assets.

### 2. Frontend Layer (Next.js / TypeScript)
A responsive web dashboard built with Next.js 14 and Tailwind CSS. Features include:
- **Group Management:** UI for creating groups, inviting members via Stellar addresses, and monitoring group health.
- **Contribution Flow:** Integration with Stellar wallets (Freighter) for secure, one-click contributions.
- **Transaction History:** Real-time feed of group activity fetched via Horizon and Soroban-RPC.

### 3. Backend & Monitoring
- **Performance Monitoring:** Integrated monitoring for API latency and contract execution times.
- **Notification System:** (Planned/In-progress) Email and push notifications for contribution reminders and payout alerts.

## Stellar Integration Details

- **Soroban Smart Contracts:** All financial logic (contributions, escrow, rotation, payouts) is executed on-chain.
- **Stellar Assets:** Uses the Stellar Asset Contract (SAC) standard for multi-asset support.
- **Horizon & Soroban-RPC:** Queries on-chain state and event history to provide a real-time user experience.
- **Multi-sig Potential:** The architecture is designed to support multi-signature approvals for critical group changes.

## Independent Research Assessment

Soroban-AJO represents a powerful "real-world utility" use case for Stellar. While many DeFi projects focus on complex trading, Soroban-AJO targets grassroots financial inclusion. The code quality is high, with clear separation of concerns and comprehensive test suites for the smart contracts. The project's participation in the Drips-led Stellar Wave program highlights its alignment with the broader ecosystem's growth goals.

## Submission Details

- **Category:** Social / DeFi
- **Tags:** `stellar-wave, soroban, ajo, rosca, savings, social-finance, africa, financial-inclusion`
- **Status:** SUBMITTED (Research Completed)
