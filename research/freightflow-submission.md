# FreightFlow — Stellar Wave Supply Chain Research

## Project Details

- **Name:** FreightFlow
- **Description:** A Web3-enabled logistics and supply chain platform designed to stream freight and cargo operations, utilizing Stellar smart contracts for immutable tracking.
- **Category:** supply-chain
- **Stellar account ID:** `GBVG2QOHHFPSHDCKFBBOW5SR6DB2V3RPEHLRCZBDLBEK2AUNFVZ7K3M4`
- **Tags:** supply-chain, traceability, transparency, logistics, web3, stellar-wave

## How On-Chain Data Creates Transparency

FreightFlow leverages Stellar's Soroban smart contracts to create an immutable, shared ledger for the entire supply chain lifecycle. This creates transparency in the following ways:

### What is being tracked
1. **Shipment Location Data:** Real-time checkpoint scans of containers and individual high-value pallets at ports, warehouses, and distribution centers.
2. **Quality Assurance Metrics:** IoT sensor data recording temperature, humidity, and shock events during transit, stored in verifiable batches.
3. **Custody Transfers:** Cryptographic signatures of both the transferring and receiving parties when goods change hands.

### How data is recorded on-chain
Data is anchored to the Stellar network using a hybrid approach:
- **Smart Contracts (Soroban):** A master `Shipment` contract maintains the state of each tracking ID.
- **Data Model:** The struct stores `checkpoint_hash`, `timestamp`, `location_id`, and `custodian_pubkey`.
- **Batching:** High-frequency IoT data is hashed periodically, and the Merkle root is submitted to the Stellar contract, keeping transaction costs low while ensuring data integrity.
- **Asset Tokenization:** High-value shipments are occasionally minted as NFTs (Non-Fungible Tokens) representing the bill of lading, transferring ownership digitally on-chain.

### Who benefits from the transparency
1. **Manufacturers/Shippers:** They gain real-time, undeniable proof of where their goods are and who holds liability at any given moment.
2. **End Consumers:** By scanning a QR code, consumers can trace the product back to its origin, verifying its authenticity, ethical sourcing, and proper handling (e.g., cold chain integrity for pharmaceuticals).
3. **Customs and Auditors:** Regulatory bodies have unalterable logs to review, reducing paperwork and speeding up cross-border dispute resolutions.
4. **Financiers/Insurers:** Smart contracts can automatically trigger escrow payouts or insurance claims based on clear on-chain evidence (e.g., if temperature thresholds are breached).
