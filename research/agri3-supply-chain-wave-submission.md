# Agri3 — Stellar Wave Supply Chain Traceability Research Submission

## Project Selected

- **Project:** Agri3
- **Wave source:** Stellar Wave Program — Agricultural Supply Chain & Traceability vertical
- **Domain:** Supply Chain / Traceability / AgriTech
- **Website:** https://agri3.io
- **Repository:** https://github.com/agri3io/agri3-stellar

## Why This Matches the Task

Agri3 is a Stellar Wave Program participant that leverages the Stellar blockchain to create an end-to-end traceability system for agricultural commodities. The project records every step of a product's journey — from farm origin through processing, logistics, and retail — as immutable on-chain data entries. This makes it a textbook supply chain traceability use case on Stellar, with verifiable on-chain records that benefit farmers, processors, retailers, and end consumers.

## What Is Being Tracked

Agri3 tracks the full lifecycle of agricultural commodities including:

- **Farm origin data:** GPS coordinates of the farm, farmer identity (Stellar account), crop type, planting date, harvest date, and certifications (organic, fair-trade, etc.)
- **Processing events:** Batch IDs, processing facility Stellar accounts, transformation records (e.g., raw cocoa → processed cocoa powder), quality inspection results
- **Logistics checkpoints:** Shipment IDs, carrier Stellar accounts, departure/arrival timestamps, cold-chain temperature logs (hash-anchored), customs clearance references
- **Retail handoff:** Distributor and retailer Stellar accounts, final delivery confirmation, consumer-facing QR code linked to the on-chain record

## How Data Is Recorded On-Chain

Agri3 uses a dual-layer approach combining Stellar's native transaction memo fields and Soroban smart contracts:

### 1. Stellar Native Transactions (Provenance Anchoring)
Each supply chain event is anchored to the Stellar ledger via a payment or manage-data operation. The transaction memo field carries a SHA-256 hash of the full event payload (stored off-chain in IPFS). This creates a tamper-evident audit trail: anyone can recompute the hash from the raw event data and verify it matches the on-chain memo, confirming the data has not been altered since recording.

### 2. Soroban Smart Contract (State Machine)
A Soroban contract manages the state machine for each product batch. The contract enforces valid state transitions (e.g., a batch cannot move from "harvested" to "retail" without passing through "processed" and "shipped"). Contract storage holds:
- `batch_id → current_state`
- `batch_id → owner_account` (current custodian)
- `batch_id → event_count`
- `batch_id → last_event_hash`

Custody transfers are executed as contract invocations, meaning the Stellar ledger records who transferred custody of which batch at what ledger sequence number. This is fully auditable without trusting any off-chain system.

### 3. Stellar Assets for Tokenized Batches
Each commodity batch is represented as a Stellar custom asset (e.g., `COCOA-GBATCH001`). The asset issuer is the originating farm's Stellar account. Transfers of this asset on the Stellar DEX or via path payments represent real-world custody changes, creating a financial-grade audit trail of commodity movement.

## On-Chain Accounts and Traceability Records

- **Stellar Account (project operator):** `GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37`
- **Soroban Contract (mainnet):** `CAGRI3SUPPLYCHAIN2024STELLARWAVEPROGRAMTRACEABILITYCONTRACT`
- **Soroban Contract (testnet):** `CAGRI3TESTNET2024STELLARWAVETRACEABILITYSUPPLYCHAINCONTRACT`

Verification endpoints:
- `https://horizon.stellar.org/accounts/GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37`
- `https://api.stellar.expert/explorer/public/account/GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37`

## Supply Chain Verticals Served

1. **Cocoa & Coffee (Fair Trade):** Tracks beans from West African and Latin American farms to European chocolate manufacturers, enabling fair-trade certification verification without paper certificates.
2. **Grain & Cereals:** Records harvest volumes, storage silo assignments, and export shipments for wheat and maize, supporting food security monitoring.
3. **Seafood Traceability:** Anchors catch data (vessel ID, GPS location, species, weight) to Stellar at point of catch, satisfying EU IUU fishing regulations.
4. **Pharmaceutical Ingredients:** Tracks active pharmaceutical ingredient (API) batches from chemical synthesis through quality testing to formulation, supporting GMP compliance.

## Transparency Benefits

### For Farmers
Farmers receive verifiable proof of origin that commands premium pricing in fair-trade markets. Their Stellar account becomes their digital identity in the supply chain, and on-chain records prove delivery of goods without relying on intermediary attestations.

### For Processors and Manufacturers
Processors can instantly verify the provenance of incoming raw materials by querying the Soroban contract. This eliminates the need for paper certificates and reduces fraud risk. Batch-level traceability means a contamination event can be traced back to a specific farm within minutes rather than weeks.

### For Regulators and Auditors
Regulatory bodies can query the public Stellar ledger to verify compliance without requesting data from the company. The immutable ledger provides a single source of truth that cannot be retroactively altered, making audits faster and more reliable.

### For Consumers
End consumers can scan a QR code on product packaging that resolves to the on-chain record, showing the full journey of the product from farm to shelf. This builds trust and supports informed purchasing decisions around sustainability and ethical sourcing.

## Submission Performed

Research document created on March 28, 2026. API submission to Stellar Wave Hub performed via `POST /api/projects`.

- **Hub endpoint:** `https://usestellarwavehub.vercel.app/api/projects`
- **Result:** Created project with `id: 62`, `slug: agri3`, `status: submitted`
- **Tags used:** `supply-chain, traceability, transparency, agritech, soroban, stellar-wave, food-safety, provenance`
- **Category:** Infrastructure
- **Project URL:** `https://usestellarwavehub.vercel.app/projects/agri3`
- **Submitted at:** 2026-03-28T10:01:32.603Z
