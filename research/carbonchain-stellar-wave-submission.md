# CarbonChain - Stellar Wave Research Submission

## Project Selected

- **Project:** CarbonChain
- **Wave source:** Transparent, tamper-proof carbon credit registry and marketplace built on the Stellar network
- **Domain:** ReFi (Regenerative Finance) / Infrastructure
- **Category:** ReFi / Infrastructure

## Why This Matches the Task

CarbonChain is a Soroban-native platform designed for issuing, trading, and retiring tokenized carbon credits. It perfectly aligns with the Stellar Wave ecosystem by demonstrating how Stellar's native primitives and Soroban smart contracts can enforce real-world climate accountability. By integrating a multi-sig verifier flow, an MRV (Measurement, Reporting, and Verification) oracle, and leveraging the native Stellar DEX for secondary market trading, CarbonChain serves as robust ReFi infrastructure that eliminates trust assumptions while bringing transparency to environmental asset markets.

## Verifiable On-Chain Information

**Stellar Network:** Testnet (Mainnet planned)
**Smart Contract Platform:** Soroban (Rust / WASM)
**Core Infrastructure:** `credit_registry`, `retirement`, `marketplace`, and `mrv_oracle` smart contracts

**Verification & Security:**
- Replay attack protection on all contract state transitions.
- Immutable session traceability and audit trails for compliance verification.
- Secure client-side signing using SEP-10 Freighter authentication.

## Technical Architecture and Stellar Integration

### 1. Credit Registry & Multi-sig Enforcement
- The authoritative record for all carbon credits (CCR tokens), requiring issuer and registered verifier multi-sig approval to trigger the Soroban token mint function.
- Employs Stellar Claimable Balances to safely escrow credits during the verifier approval window.

### 2. Native Stellar DEX Marketplace
- Instead of utilizing a custom Automated Market Maker (AMM), CarbonChain taps directly into Stellar's built-in DEX using manage_sell_offer operations.
- Allows native trading of Carbon Credit tokens against XLM, USDC, or other assets for highly liquid price discovery. Recently enhanced with a smart contract marketplace fee collection mechanism.

### 3. MRV Oracle Integration
- Authenticated data ingestion from real-time IoT or satellite feeds to monitor carbon sequestration.
- Smart contracts automatically flag credits for re-verification if anomalies deviate beyond configured thresholds.

### 4. Immutable Retirement Engine
- Facilitates the permanent, irreversible burning of tokens with an immutable on-chain retirement record.
- Tied directly to a NestJS backend that syncs ledger state into PostgreSQL via a Soroban RPC events indexer.

## Description: DeFi Infrastructure and Real-World Impact

CarbonChain tackles the opaque and fragmented nature of the traditional voluntary carbon market by migrating the entire lifecycle of a carbon credit onto the Stellar ledger. Working across five layers—Soroban Smart Contracts, NestJS API, Angular 17+ SPA, Stellar Protocol, and Off-chain IPFS storage—the platform ensures that nobody, including the platform's backend, can lie about the state of a credit.

By supporting major environmental methodologies like REDD+, VCS (Verra), Gold Standard, and Plan Vivo, CarbonChain can flexibly adapt to established and emerging standards. The project ties off-chain documentation to on-chain assets by anchoring project satellite imagery and audit reports to IPFS and storing the IPFS hash natively within the credit metadata.

Economically, the architecture is designed to make climate action highly accessible. Stellar’s sub-cent transaction fees allow CarbonChain to support fractional carbon credits natively (resolving down to 0.1 tonne using i128 integer storage), making it economically viable for retail buyers or smaller dApps to offset granular carbon footprints without restrictive overhead costs.

## Real-World Impact Metrics

- **Methodologies Supported**: REDD+, VCS, Gold Standard, CDM, Plan Vivo, Custom
- **Credit Resolution**: 0.1 tonne precision enabled by `i128` storage
- **Infrastructure Integrations**: Native Stellar DEX orderbook, IPFS content addressing, webhook-based MRV tracking

## Category and Tags

**Primary Category:** ReFi
**Asset Type:** Tokenized Carbon Credits (CCR Token mapped 1:1 with 1 tonne CO₂e)
**Tags:** refi, soroban, smart-contracts, carbon-credits, mrv, stellar-dex, nestjs, angular

## Submission Details

- **Submitted to:** Stellar Wave Hub
- **Submission Date:** May 27, 2026
- **Status:** Research Phase
- **Verification:** Four core contract IDs deployed on the Soroban Testnet, off-chain logic trackable via public GitHub repository.