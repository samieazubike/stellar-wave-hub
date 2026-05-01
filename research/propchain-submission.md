# PropChain — Stellar Wave Research Submission

## Project Identity

- **Project Name:** PropChain
- **Category:** Real Estate / RWA / Fractionalization
- **Wave Source:** `MettaChain/PropChain-contract` listed in Stellar Wave repositories on Drips
- **Website:** [propchain.io](https://propchain.io)
- **Repository:** [github.com/MettaChain/PropChain-contract](https://github.com/MettaChain/PropChain-contract)
- **Documentation:** [docs.propchain.io](https://docs.propchain.io)

## Why This Project Matches the Task

PropChain is a high-impact Real-World Asset (RWA) project building on the Stellar network. It provides a complete end-to-end infrastructure for real estate fractionalization, compliance, and secondary market liquidity. By leveraging Soroban smart contracts for automated legal compliance and milestone-based escrow, PropChain demonstrates the power of Stellar for high-value asset management. The project is an active participant in the Stellar Wave Program, consistently delivering modular, open-source primitives for the RWA space.

## What PropChain Does

PropChain democratizes real estate investment by allowing fractional ownership of high-value properties. It solves the liquidity and entry-barrier issues in traditional real estate through:
- **Fractional Ownership:** Tokenizing properties into compliant security tokens.
- **Automated Compliance:** Utilizing on-chain identity registries to enforce regulatory requirements (KYC/AML) for every transaction.
- **Secondary Market:** A built-in decentralized exchange (DEX) specifically for property tokens.
- **Cross-Chain Bridging:** Modular adapters for IBC and L2 support, allowing property tokens to move across the interchain ecosystem.

## Technical Architecture (Detailed)

PropChain is built as a suite of interoperable Soroban contracts:

### 1. Property Registry Contract
The core source of truth for all tokenized assets.
- **Metadata Management:** Stores property details, legal descriptions, and valuation history.
- **Ownership Tracking:** Manages the lifecycle of property tokens from issuance to transfer.
- **Access Control:** Role-based permissions for admins, oracles, and property managers.

### 2. Advanced Escrow System
Handles high-value transactions with multi-signature security.
- **Milestone-Based Release:** Funds are released to developers or sellers only when verified property milestones are met.
- **Document Custody:** Cryptographic hashes of legal documents are stored on-chain to ensure data integrity.
- **Dispute Resolution:** Built-in mediation logic for multi-participant escrows.

### 3. Modular Bridge Adapter System
Enables cross-chain interoperability for property tokens.
- **EVM Adapter:** Connects PropChain to Ethereum and L2 ecosystems (Arbitrum, Optimism).
- **IBC Adapter:** Enables bridging to Cosmos-SDK based chains.
- **Relayer Protection:** Nonce-based replay protection and signature verification for all bridge operations.

### 4. Identity & Compliance Registry
Integrates with `propchain-identity` to ensure all participants are verified.
- **Whitelisting:** Enforces jurisdiction-based restrictions.
- **Revocable Identity:** Admins can update compliance status in real-time.

## Stellar Integration Details

- **Soroban (Rust):** The entire logic is implemented in Rust, utilizing Soroban's efficient storage and compute models.
- **Native Assets & USDC:** Uses Stellar-native assets and USDC for primary investment and settlement rails.
- **Identity (SEP-12 compatible):** Integrates with Stellar identity standards for user onboarding.
- **Multi-Sig & Cooldowns:** Implements advanced security patterns like key rotation cooldowns and multi-sig thresholds for treasury management.

## On-Chain Verification

PropChain activity can be tracked via its main registry and bridge contracts.
- **Registry Contract (Testnet):** `C...[Verify on Stellar Expert]`
- **Bridge Contract (Testnet):** `B...[Verify on Stellar Expert]`

Verification Steps:
1. Search for the Property Registry contract on [Stellar Expert](https://stellar.expert).
2. Inspect `register_property` invocations to see real-world assets being tokenized.
3. Monitor `execute_bridge` events for cross-chain token movements.

## Why This Project Matters

- **Financial Inclusion:** Lowers the entry barrier for real estate investment from $100k+ to as little as $100.
- **Transparency:** All legal documents and valuation updates are cryptographically anchored to the Stellar ledger.
- **Interoperability:** The modular bridge system ensures that PropChain is not a siloed ecosystem but a core part of the broader Web3 financial infrastructure.

## Submission Status Checklist

- [x] Technical Architecture Documented
- [x] Stellar Integration Details Verified
- [x] Value Proposition Defined
- [ ] Live Contract IDs (Pending Final Audit)
- [ ] Secondary Market Demo Link
