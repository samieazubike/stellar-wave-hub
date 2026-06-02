# Soroban Invoice — Decentralized Billing Platform

## Project Overview

**Soroban Invoice** is a decentralized invoice and billing platform built on the Stellar blockchain using Soroban smart contracts. It enables freelancers and service providers to create on-chain invoices with USDC escrow, milestone-based payments, and built-in dispute resolution mechanisms. The platform combines workflow automation with financial transparency, making it suitable for remote work, freelancing, and service-based transactions in the Stellar ecosystem.

## What It Does

### Core Features

**On-Chain Invoice Management**: Freelancers create invoices specifying client, amount, due date, and optional milestones. All invoice state is recorded on the Stellar blockchain, ensuring immutability and transparency. Invoices follow a well-defined lifecycle from Draft → Funded → InProgress → UnderReview → Completed, with provisions for disputes and refunds.

**USDC Escrow System**: Funds are held in the smart contract rather than transferred directly, protecting both parties. Clients deposit USDC into contract escrow, which releases automatically upon client approval. This eliminates the need for trust between parties and reduces default risk for freelancers.

**Milestone-Based Payments**: Instead of single lump-sum payments, invoices can be split into multiple milestones. Each milestone has a title and amount, and funds release per-milestone upon client approval. This structure is ideal for long-term projects requiring staged delivery.

**Dispute Resolution Framework**: If disagreement arises between freelancer and client, either party can raise a dispute. An admin then resolves the dispute with a configurable percentage split, ensuring both parties have a fair mechanism for conflict resolution. This is critical for cross-border, trustless transactions.

**Dual Dashboard Interface**: The React frontend provides separate views optimized for freelancers and clients, with distinct functionality for each role. Freelancers can create and submit invoices; clients can review, fund, and approve work.

**Admin Controls**: Protocol administrators can pause/unpause operations (for emergency situations), adjust fee rates (up to 5%), and designate fee recipients. This governance structure balances operational flexibility with decentralization.

## Technical Approach

### Smart Contract Architecture (Soroban/Rust)

The contract is written in Rust targeting WebAssembly via Soroban, Stellar's smart contract platform. Key components:

- **lib.rs**: Entry point and core contract functions
- **escrow.rs**: Token transfer and escrow management using Stellar SDK
- **storage.rs**: Data persistence with optimized storage keys
- **events.rs**: Event emission for off-chain indexing
- **errors.rs**: Custom error types for detailed failure diagnostics
- **types.rs**: Shared data structures (Invoice, Milestone, DisputeResolution)

**Storage Model**: The contract stores:
- Invoice objects (client, freelancer, amount, status, milestones)
- Admin configuration (fee rate, fee recipient)
- Pause state
- Event log for auditability

The contract enforces state transitions, validates amounts, prevents reentrancy, and ensures role-based access control through address verification.

### Frontend Stack

Built with **React 18** + **TypeScript** + **Vite**, the frontend integrates with Stellar via:

- **@stellar/freighter-api**: Browser wallet integration for Freighter extension
- **@stellar/stellar-sdk**: Stellar SDK for transaction building and signing
- **Zustand**: Client-side state management for wallet connection and user session
- **Recharts**: Data visualization for invoice analytics and financial tracking
- **date-fns**: Date manipulation for deadline management

The frontend communicates with the contract by building Soroban invocation transactions, signing them via Freighter Wallet, and broadcasting to the Stellar network. No centralized backend is required for core functionality.

## Stellar Integration & On-Chain Activity

### Network Integration

- **Blockchain**: Stellar Public Network (primary) / Testnet (development)
- **Token**: USDC (issued by Stellar Development Foundation)
- **Smart Contract Platform**: Soroban (next-gen smart contracts on Stellar)
- **Wallet Integration**: Freighter Wallet for key management and signing

### Contract Deployment

The contract is deployed to Stellar via the Soroban CLI:
```bash
soroban contract deploy --network testnet \
  --source-account <account> \
  --wasm-ref <path-to-contract.wasm>
```

Once deployed, the contract has a deterministic contract ID on Stellar, which can be queried via Stellar Horizon API.

### On-Chain Verification

All transactions are verifiable on the Stellar network:
- Invoice creation is recorded as a contract invocation
- Fund deposits create Soroban transfer events
- Approvals and disputes generate contract state changes
- Fee collection is transparent and auditable

Historical data can be indexed via:
- **Stellar Horizon API**: Query transactions and operations
- **Event Streams**: Soroban emits events for invoice state changes
- **Contract State Queries**: Read current invoice status and balances

## Use Cases

1. **Freelance Work**: Developers, designers, and consultants use Soroban Invoice to invoice clients globally without intermediaries, with automatic escrow protecting both parties.

2. **Service-Based Businesses**: Agencies and contractors use milestone payments to align payment with delivery stages, reducing credit risk for clients.

3. **Cross-Border Transactions**: Eliminates intermediaries, currency conversion overhead, and settlement delays for international work.

4. **Dispute Resolution**: Built-in admin arbitration provides recourse for conflicts, making trustless transactions feasible between unknown parties.

5. **Financial Transparency**: All transactions are on-chain and auditable, suitable for accounting and compliance purposes.

## Technical Stack Summary

| Component | Technology |
|-----------|------------|
| Smart Contract | Soroban (Rust, WebAssembly) |
| Frontend | React 18, TypeScript, Vite |
| Blockchain | Stellar Network |
| Wallet Integration | Freighter |
| State Management | Zustand |
| Payment Token | USDC |
| Data Visualization | Recharts |

## Project Maturity & Status

- **Development Stage**: Functional prototype with core features implemented
- **Testing**: Integration tests for smart contract functions
- **Deployment Readiness**: Deployable to Stellar Testnet and Mainnet
- **Documentation**: Comprehensive CONTRACT.md and DEPLOYMENT.md guides

## Team & Community

The project is developed as part of the **Stellar Wave Program**, Stellar's grants initiative to fund innovative projects in the ecosystem. This indicates backing by the Stellar Development Foundation and alignment with ecosystem priorities.

## Tags

- **Category**: Payments & Finance
- **Technical Tags**: Soroban, Smart Contracts, USDC, Escrow, Milestone Payments, Dispute Resolution
- **Use Case Tags**: Freelancing, B2B Payments, Cross-Border Transactions, Financial Services
- **Architecture Tags**: Decentralized, Trustless, On-Chain, Smart Contract Driven

## Research Findings

**Strengths**:
1. Solves a real problem (payment risk in freelancing) with a novel blockchain approach
2. Milestone-based payment structure is innovative and addresses project-based work
3. Built-in dispute resolution creates trust without intermediaries
4. Minimal dependencies (Stellar SDK, React, Zustand) keeps codebase lean
5. Full on-chain transparency for compliance and auditability

**Architectural Highlights**:
1. Clean separation between contract logic and frontend presentation
2. Role-based access control (freelancer, client, admin) enforces business rules
3. Comprehensive error handling with custom error types
4. Event emission enables efficient off-chain indexing
5. USDC integration with Stellar SDK ensures secure token transfers

**Integration Depth**:
1. Deep Soroban integration for core business logic
2. Freighter wallet provides seamless UX for Stellar users
3. Contract lifecycle management via Soroban CLI
4. Full leverage of Stellar's low-cost, fast settlement

## Verification

- ✅ **Project Verified**: Part of official Stellar Wave Program
- ✅ **Technical Implementation**: Fully functional Soroban contract + React frontend
- ✅ **Stellar Integration**: Native Soroban deployment, USDC escrow, Freighter wallet support
- ✅ **Use Case Clarity**: Addresses real-world freelancing and payment challenges
- ✅ **Code Quality**: Well-structured, documented, and tested codebase

## Conclusion

Soroban Invoice represents a sophisticated implementation of trustless payments on Stellar, combining smart contract security with user-friendly interfaces. It demonstrates the potential of Soroban for DeFi applications and addresses a significant pain point in the gig economy. The project exemplifies how Stellar can enable financial services that were previously only possible through centralized intermediaries.

---

**Submitted for Stellar Wave Hub Registry**
**Category**: Payments & Finance
**Complexity**: High (Smart Contract + Full-Stack Application)
**Star Date**: June 2, 2026
