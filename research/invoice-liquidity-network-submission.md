# Invoice Liquidity Network (ILN) — Stellar Wave Research Submission

## Project Identity

- **Project Name:** Invoice Liquidity Network (ILN)
- **Category:** DeFi
- **Wave Source:** `Invoice-Liquidity-Network` (`ILN-Frontend` and `ILN-Smart-Contract`) approved in the Stellar Wave Program repository catalog on Drips Network (Drips Org: `Invoice-Liquidity-Network`, tracked for community sprint bounties and USDC pool rewards)
- **Official Organization / Documentation Hub:** https://github.com/Invoice-Liquidity-Network/Invoice-Liquidity-Network
- **Frontend dApp Repository:** https://github.com/Invoice-Liquidity-Network/ILN-Frontend
- **Soroban Smart Contract Repository:** https://github.com/Invoice-Liquidity-Network/ILN-Smart-Contract
- **Documentation Site:** https://docs.iln.finance
- **Organization Avatar / Identity:** `https://avatars.githubusercontent.com/u/70820801?v=4`
- **License:** MIT / Apache-2.0

---

## Submission Fields

- **Name:** Invoice Liquidity Network
- **Category:** DeFi
- **Stellar network:** testnet
- **Stellar contract ID:** `CCPASLHKRFBMVV5PZG3LKDGKFEDXZMB5U7DK42CVLUVWCMUCSRPVBIMO` (Verified Invoice-Liquidity core escrow & factoring settlement contract on Stellar Testnet)
- **Stellar account ID:** null
- **Tags:** `defi, invoice-factoring, soroban, payments, smes, liquidity-pool, usdc, stellar-wave, escrow, smart-contracts, rust, typescript`
- **Website URL:** https://docs.iln.finance
- **GitHub URL:** https://github.com/Invoice-Liquidity-Network/Invoice-Liquidity-Network
- **GitHub Repositories:**
  - Org Root & Documentation: https://github.com/Invoice-Liquidity-Network/Invoice-Liquidity-Network
  - Core Soroban Contracts: https://github.com/Invoice-Liquidity-Network/ILN-Smart-Contract
  - Next.js Client & dApp: https://github.com/Invoice-Liquidity-Network/ILN-Frontend
- **Research Images:**
  - Architecture Diagram: `research/iln-architecture.png`
  - Lifecycle & Factoring Flow: `research/iln-factoring-flow.png`
  - On-Chain Contract Verification: `research/iln-onchain-verification.png`

---

## Description

Invoice Liquidity Network (ILN) is an open-source, decentralized invoice factoring protocol and liquidity coordination engine built natively on the Stellar blockchain and powered by Soroban WebAssembly smart contracts. The protocol bridges the substantial working capital gap encountered by freelancers, independent digital creators, and small-to-medium enterprises (SMEs) across the globe. In conventional commercial operations, businesses regularly suffer from severe 30-, 60-, or 90-day accounts receivable payment delays, forcing them into reliance on predatory merchant cash advances, bureaucratic traditional banking credit assessments, or costly administrative underwriting. Invoice Liquidity Network completely disintermediates this traditional commercial factoring supply chain by turning verified, outstanding off-chain invoices into tokenized, programmatic on-chain receivables that can be settled and discounted trustlessly.

At its technical foundation, the Invoice Liquidity Network operates an atomic two-sided liquidity marketplace. Freelancers and enterprise billers submit digital receivables through the `submit_invoice()` interface, establishing key commercial terms: the principal face value, designated enterprise payer address, maturity timestamp (due date), accepted payment token (primarily Stellar-anchored stablecoins such as USDC and EURC), and a target discount rate offered to capital allocators. Rather than requiring bilateral negotiations or slow manual clearing, decentralized finance (DeFi) liquidity providers (LPs) browse the marketplace through automated indexer feeds and fund invoices directly via `fund_invoice()`. Upon funding, the smart contract calculates the net present value, disbursing instantaneous stablecoin capital directly to the freelancer while locking the underlying obligation into a Soroban-managed escrow position.

When the maturity date arrives and the client payer settles the invoice via `mark_paid()`, the protocol automatically directs the full face value back to the funding liquidity provider, unlocking the pre-agreed discount spread as annualized yield. By operating directly on Stellar's ultra-low-fee, deterministic consensus ledger and Soroban's `#![no_std]` Rust execution environment, ILN achieves instantaneous sub-5-second finality with negligible transaction costs. The protocol includes programmatic risk controls: dynamic collateral tiers, time-locked governance upgrade delays (`ADR-005`), decentralized oracle provider verification for debtor legitimacy, and non-custodial emergency recovery mechanics. Through this architecture, Invoice Liquidity Network establishes a transparent, borderless factoring rails system that transforms static corporate debt obligations into productive, liquid Web3 yield assets.

---

## The Problem Invoice Liquidity Network Solves

Late payments and elongated accounts receivable cycles represent one of the leading causes of small enterprise insolvency worldwide:
1. **The Working Capital Delay:** Freelancers and emerging service agencies deliver work immediately but routinely wait 60 to 90 days before receiving invoice settlements from corporate clients, causing acute cash flow deficits.
2. **Exclusionary Traditional Factoring:** Traditional bank factoring services impose predatory fees (often 3% to 8% monthly discounting rates), demand extensive balance sheet audits, require personal guarantees, and generally reject invoices below six-figure enterprise thresholds.
3. **Cross-Border FX and Settlement Friction:** International contractor payments lose significant value to correspondent banking wire charges, currency exchange markups, and multi-day clearing delays.
4. **Counterparty Default & Lack of Transparency:** Centralized factoring brokers hold opaque books, leaving liquidity providers with limited insight into underlying borrower performance or dispute histories.

Invoice Liquidity Network resolves these systemic barriers by combining the global settlement velocity of Stellar with Soroban's deterministic smart contracts, democratizing commercial factoring into a permissionless, programmable DeFi primitive accessible to anyone with an internet connection and a Stellar wallet.

---

## Technical Approach & Smart Contract Architecture

The Invoice Liquidity Network architecture is composed of modular contracts, client applications, and off-chain indexer microservices:

### 1. Smart Contract Suite (`ILN-Smart-Contract`)
Written in strict `#![no_std]` Rust targeting the `wasm32-unknown-unknown` Soroban architecture:
- **`Invoice-Liquidity` (`contracts/invoice_liquidity`):** The primary factoring and escrow contract. Manages invoice tokenization (`Invoice` struct), state transitions (`Draft`, `Submitted`, `Funded`, `Paid`, `Defaulted`, `Cancelled`), payment escrow custody, and the Checks-Effects-Interactions atomic payout sequence.
- **`ILN-Distribution` (`contracts/iln_distribution`):** Manages multi-token routing and automated fee splits between platform reserves, referral partners, and yield distributions.
- **`ILN-Governance` (`contracts/iln_governance`):** Implements time-locked administrative controls, requiring a mandatory 48-hour delay window for contract upgrades and critical parameter modifications (`ADR-005`), neutralizing rogue upgrades and flash-governance exploits.
- **Oracle Verification Engine:** Incorporates `VerificationResult` structs to ingest off-chain cryptographic proofs and debtor invoice acknowledgments before funding eligibility is granted.

### 2. Frontend dApp (`ILN-Frontend`)
A modern Next.js 14 and TypeScript web client providing an intuitive user experience:
- **Freelancer Dashboard:** Allows seamless invoice composition, PDF/cryptographic attachment hashing, discount rate modeling, and one-click submission.
- **Liquidity Provider Marketplace:** Displays filtered, searchable invoice listings with yield analytics, credit scoring, remaining maturity windows, and batch funding actions.
- **Stellar Wallet Gateway:** Integrates SDF's Freighter extension and the Stellar Wallets Kit for secure, non-custodial transaction signing.

### 3. Event Indexer & Notification Pipeline
- Subscribes to Soroban RPC `getEvents` to track `InvoicePaid`, `InvoiceFunded`, and `InvoiceDefaulted` topics.
- Normalizes on-chain states into SQLite/PostgreSQL databases to feed real-time GraphQL and REST queries, decoupling public read traffic from ledger nodes.

---

## How the Project Uses Stellar

1. **Soroban Smart Contract Execution:** All factoring, escrow custody, fee calculation, and LP token accounting are implemented as native Soroban smart contracts, ensuring deterministic execution and safe storage TTL handling.
2. **Stellar Asset Contract (SAC) Interoperability:** Uses the official SEP-41 token standard for seamless deposits and disbursements of native XLM and fiat-backed stablecoins (USDC and EURC).
3. **Sub-Second Settlement & Ultra-Low Transaction Fees:** Stellar's low transaction fees allow micro-invoices (e.g., \$50–\$500) to be economically factored—a use case completely unviable on high-gas networks like Ethereum.
4. **Freighter Wallet Integration:** Provides non-custodial authentication, allowing users to sign transactions directly in their browser without sharing private keys with third parties.

---

## On-Chain Verification

The core smart contracts have been compiled and deployed to the Stellar Testnet:

- **Core Invoice-Liquidity Contract:**
  `CCPASLHKRFBMVV5PZG3LKDGKFEDXZMB5U7DK42CVLUVWCMUCSRPVBIMO`
  - **Network:** Stellar Testnet
  - **Explorer URL:** https://stellar.expert/explorer/testnet/contract/CCPASLHKRFBMVV5PZG3LKDGKFEDXZMB5U7DK42CVLUVWCMUCSRPVBIMO
  - **Status:** Verified and active on-chain, storing factoring state transitions and managing SAC token escrows.

- **Companion Protocol Contracts:**
  - **ILN-Distribution:** `CAQGPMT3EQK4AABMIR66JJXEOCNCLPTDNXMS5OHZXH4LI24UYAF25V5B`
  - **ILN-Governance:** `CD7GOIU3GNK7EZHG7XWBC7VI4NRVGMRCU7X2FOCAPQN6EGTSW46BY4EB`

---

## Team & Community

- **Maintainer Organization:** Open-source collective building under the [Invoice-Liquidity-Network](https://github.com/Invoice-Liquidity-Network) GitHub organization.
- **Active Community Contributors:** Key engineering contributors include `@codebuff-team`, `@therealjhay`, `@Halima-1`, `@JSE19`, `@dollfins`, `@Obiajulu-gif`, `@thegreatfeez`, `@Nursca`, and `@favouronyinye`, alongside a broader community of over 160 contributors participating in development, testing, and documentation across the codebase.
- **Ecosystem Backing:** Actively tracked and approved within the Stellar Wave Program repository registry on Drips Network, participating in regular contributor sprints and issue resolution rounds.

---

## Research Screenshots

1. **Architecture Overview (`research/iln-architecture.png`):** Shows the multi-tier interaction model between the Next.js Frontend, Freighter Wallet, Soroban Core Contracts, and Event Indexer.
2. **Factoring & Escrow Lifecycle (`research/iln-factoring-flow.png`):** Illustrates the end-to-end transaction journey from invoice submission to LP funding, payer settlement, and yield distribution.
3. **On-Chain Contract Verification (`research/iln-onchain-verification.png`):** Visual confirmation of the contract deployment and ledger storage on Stellar Expert Testnet Explorer (`CCPASLHKRFBMVV5PZG3LKDGKFEDXZMB5U7DK42CVLUVWCMUCSRPVBIMO`).

---

## Research Sources

1. [Drips Network Stellar Wave Repository Catalog](https://www.drips.network/wave/stellar/repos) (confirms approved Stellar Wave status)
2. [Invoice-Liquidity-Network Main Repository](https://github.com/Invoice-Liquidity-Network/Invoice-Liquidity-Network) (organization documentation and architectural overview)
3. [ILN-Smart-Contract Repository](https://github.com/Invoice-Liquidity-Network/ILN-Smart-Contract) (Soroban Rust smart contracts, data structures, and ADRs)
4. [ILN-Frontend Repository](https://github.com/Invoice-Liquidity-Network/ILN-Frontend) (Next.js dApp interface, Freighter integration, and marketplace views)
5. [Stellar Expert Testnet Contract Explorer](https://stellar.expert/explorer/testnet/contract/CCPASLHKRFBMVV5PZG3LKDGKFEDXZMB5U7DK42CVLUVWCMUCSRPVBIMO) (on-chain verification of contract ID and operations)
6. [ILN Developer Documentation](https://docs.iln.finance) (protocol specification and factoring mechanics)

---

## Hub Submission Confirmation

- **Hub Project Name:** Invoice Liquidity Network
- **Status:** Profile prepared for Stellar Wave Hub review
- **Network:** Testnet
- **Verified Contract ID:** `CCPASLHKRFBMVV5PZG3LKDGKFEDXZMB5U7DK42CVLUVWCMUCSRPVBIMO`
- **Submitted Category:** DeFi
- **Evidence Files:** Research dossier, architectural diagrams, factoring lifecycle workflows, and verified on-chain contract assets included.
