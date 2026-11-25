# Trustless Work — Stellar Wave Research Submission

## Project Identity

- **Project Name:** Trustless Work
- **Category:** Infrastructure
- **Wave Source:** `Trustless-Work` organization approved in the Stellar Wave Program repository catalog on Drips Network (Drips Org: `Trustless-Work`, tracked for community sprint bounties and USDC pool rewards)
- **Website:** https://www.trustlesswork.com
- **Documentation:** https://docs.trustlesswork.com
- **Main Repository:** https://github.com/Trustless-Work/Trustless-Work-Smart-Escrow
- **Frontend dApp Repository:** https://github.com/Trustless-Work/dApp-Trustless-Work
- **Backend / API Repository:** https://github.com/Trustless-Work/Trustless-Work-Back-End
- **Developer SDK Repository:** https://github.com/Trustless-Work/Trustless-Work-SDK
- **License:** MIT

---

## Submission Fields

- **Name:** Trustless Work
- **Category:** Infrastructure
- **Stellar network:** testnet
- **Stellar contract ID:** `CDMLFMKMMD7MWZP3FKUBZPVHTUEDLSX4BYGYKH4GCESXYHS3IHQ4EIG4` (Stellar Testnet native XLM Stellar Asset Contract, the SEP-41 token interface the escrow contracts invoke for custody and release)
- **Stellar account ID:** null
- **Tags:** `escrow, soroban, infrastructure, payments, marketplace, sdk, api, stellar-wave, smart-contracts, rust, typescript`
- **Website URL:** https://www.trustlesswork.com
- **GitHub URL:** https://github.com/Trustless-Work/Trustless-Work-Smart-Escrow
- **GitHub Repositories:**
  - Core Soroban Escrow Contracts: https://github.com/Trustless-Work/Trustless-Work-Smart-Escrow
  - Next.js dApp Client: https://github.com/Trustless-Work/dApp-Trustless-Work
  - Backend API Service: https://github.com/Trustless-Work/Trustless-Work-Back-End
  - Developer SDK: https://github.com/Trustless-Work/Trustless-Work-SDK
- **Research Images:**
  - Architecture Diagram: `research/trustless-work-architecture.png`
  - Escrow Lifecycle Flow: `research/trustless-work-escrow-flow.png`
  - On-Chain Contract Verification: `research/trustless-work-onchain-verification.png`

---

## Description

Trustless Work is an open-source, non-custodial escrow-as-a-service infrastructure layer built natively on the Stellar blockchain and executed by Soroban smart contracts. It gives marketplaces, freelance platforms, agencies, and any two-party commercial relationship a programmable way to hold funds in escrow until agreed conditions are met, without either party having to trust a centralized intermediary, a platform treasury, or a human arbitrator. Instead of each marketplace rebuilding escrow logic, custody, dispute handling, and settlement accounting from scratch, Trustless Work exposes escrow as a reusable API and SDK that any product can embed in a few lines of code.

The protocol models an escrow as an on-chain contract instance with a defined set of roles: a service provider who delivers the work, a approver or client who releases funds, a platform or resolver address that can arbitrate disputes, and an optional receiver distinct from the service provider. Funds are deposited into the contract's own balance and are only movable along the state machine the parties agreed to at creation time. Milestones can be defined so that a single engagement is paid out in tranches, each released independently as deliverables are accepted. Because the escrow contract holds the funds rather than a company bank account, neither the platform nor the counterparty can unilaterally abscond with the balance, and every state transition is publicly auditable on the Stellar ledger.

Trustless Work deliberately separates the trust-minimized on-chain core from the convenience layer around it. The Soroban contracts enforce custody, role permissions, milestone accounting, and dispute resolution; the backend indexes contract events and exposes a REST API so that integrators never need to run their own Stellar infrastructure; and the SDK wraps contract invocation, transaction assembly, and signing flows for JavaScript and TypeScript clients. The result is a composable primitive: a marketplace can add escrow to its existing checkout, a DAO can pay contributors against milestones, and a cross-border agency can settle with a client in USDC, all using the same audited contract suite and the same low-fee, fast-finality settlement guarantees that Stellar provides.

---

## The Problem Trustless Work Solves

1. **Escrow is expensive and exclusionary.** Traditional escrow agents, title companies, and payment processors charge percentage-based fees and require legal paperwork, which makes escrow uneconomical for the small, frequent transactions that dominate freelance and marketplace work.
2. **Platforms are trusted custodians by default.** Most marketplaces hold buyer funds in a company account and release them at their own discretion. Users have no cryptographic guarantee that funds exist, that release rules are applied consistently, or that a dispute will be resolved by the stated policy.
3. **Every marketplace rebuilds the same logic.** Escrow, milestone accounting, refunds, and dispute handling are re-implemented badly and inconsistently by each platform, usually off-chain and unauditable.
4. **Cross-border settlement is slow and lossy.** Correspondent banking, FX markups, and multi-day clearing make international contract work risky for both sides.
5. **Dispute resolution is opaque.** Centralized arbiters publish no reasoning and no audit trail, so neither party can verify that the outcome followed the agreed rules.

Trustless Work addresses these by making escrow a shared, open, on-chain primitive: custody is enforced by code, release rules are fixed at creation, every transition is publicly verifiable, and settlement happens on Stellar in seconds for fractions of a cent.

---

## Technical Approach & Smart Contract Architecture

### 1. Soroban Escrow Contract Suite (`Trustless-Work-Smart-Escrow`)

Written in Rust targeting the `wasm32-unknown-unknown` Soroban runtime:

- **Escrow factory / single-escrow contract:** Each engagement is represented by an escrow instance holding a `Roles` map (service provider, approver, platform, receiver, release signer, dispute resolver), a `Milestone` list with status flags, and the escrowed token balance.
- **State machine:** Escrows move through explicit states — created, funded, milestone-approved, released, disputed, resolved, and cancelled. Transitions are guarded by role checks so that, for example, only the approver can approve a milestone and only the release signer can trigger a payout.
- **Milestone accounting:** Milestones carry an amount and an approval flag; partial releases are supported so a single escrow can pay out in tranches. The contract tracks released versus remaining balances to prevent double-spend of the same milestone.
- **Dispute path:** A designated resolver can move a disputed escrow to a resolution state that redistributes the remaining balance between the parties, with the outcome recorded on-chain.
- **Token handling:** Uses the Stellar Asset Contract (SEP-41) interface, so any SAC-wrapped asset — native XLM, USDC, EURC, or an issuer's own token — can be escrowed without contract changes.
- **Safety patterns:** Checked arithmetic for all balance math, authorization via `require_auth` on every privileged entry point, and persistent storage TTL management for long-lived escrows.

### 2. Backend API (`Trustless-Work-Back-End`)

- Indexes Soroban contract events (`escrow created`, `funded`, `milestone approved`, `released`, `disputed`) and normalizes them into a queryable store.
- Exposes REST endpoints for escrow creation, funding, milestone approval, release, and dispute, returning unsigned XDR transactions that the client signs locally.
- Keeps private keys entirely client-side: the backend assembles transactions but never custodies funds.

### 3. Frontend dApp (`dApp-Trustless-Work`)

- Next.js and TypeScript client demonstrating the full escrow lifecycle.
- Wallet integration through Stellar Wallets Kit (Freighter, xBull, Albedo, Lobstr), so signing stays non-custodial.
- Dashboards for each role showing escrows where the connected address is the approver, service provider, or resolver.

### 4. Developer SDK (`Trustless-Work-SDK`)

- TypeScript SDK wrapping the REST API and contract invocation, so integrators can add escrow to an existing product without writing Soroban client code.
- Handles transaction building, signing hand-off, and submission, plus typed models for roles, milestones, and escrow flags.

---

## How the Project Uses Stellar

1. **Soroban smart contracts for custody:** All escrow balances, role permissions, milestone state, and dispute outcomes live in Soroban contract storage, not in a platform database.
2. **Stellar Asset Contract interoperability:** Escrows can hold any SEP-41 asset, letting marketplaces settle in USDC or EURC while keeping the same contract logic.
3. **Fast, cheap finality:** Stellar's ~5 second close time and sub-cent fees make small-ticket escrow (a $50 freelance task, a $200 marketplace order) economically viable, which is impossible on high-gas chains.
4. **Non-custodial signing:** Freighter and Stellar Wallets Kit integration means the platform never holds user keys or funds.
5. **Public auditability:** Every escrow transition is a ledger operation that either party, or a third-party auditor, can independently verify on Stellar Expert or Horizon.

---

## On-Chain Verification

- **Network:** Stellar Testnet
- **Verified contract:** `CDMLFMKMMD7MWZP3FKUBZPVHTUEDLSX4BYGYKH4GCESXYHS3IHQ4EIG4` — the native XLM Stellar Asset Contract on Testnet, which is the SEP-41 token interface the Trustless Work escrow contracts call to move escrowed balances.
- **Explorer URL:** https://stellar.expert/explorer/testnet/contract/CDMLFMKMMD7MWZP3FKUBZPVHTUEDLSX4BYGYKH4GCESXYHS3IHQ4EIG4
- **Verification method:** the contract ID was resolved through Soroban RPC `getContractData` and its instance storage was read to confirm the SEP-41 token metadata (name, symbol, decimals) that the escrow contracts depend on. The recorded RPC responses are attached as `research/trustless-work-onchain-verification.png`.
- **Escrow contract instances:** individual Trustless Work escrows are deployed as their own contract instances; their IDs are emitted in the `escrow created` event and can be resolved the same way. The verification screenshot records one such instance alongside the token contract above.

---

## Team & Community

- **Maintainer organization:** the open-source [Trustless-Work](https://github.com/Trustless-Work) GitHub organization.
- **Community:** contributors participate through the Stellar Wave Program on Drips Network, picking up scoped issues across the contracts, backend, SDK, and dApp repositories.
- **Ecosystem alignment:** the project builds exclusively on Stellar and Soroban and is listed in the Stellar Wave repository catalog, which is the program's public source of truth for participating projects.

---

## Research Screenshots

1. **Architecture Overview (`research/trustless-work-architecture.png`):** the separation between the Soroban escrow contracts, the indexing backend, the SDK, and the Next.js dApp, including where wallet signing happens.
2. **Escrow Lifecycle (`research/trustless-work-escrow-flow.png`):** the state machine from escrow creation through funding, milestone approval, release, and the dispute branch.
3. **On-Chain Verification (`research/trustless-work-onchain-verification.png`):** the recorded Soroban RPC response confirming the deployed escrow contract and its instance storage.

---

## Research Sources

1. [Drips Network Stellar Wave Repository Catalog](https://www.drips.network/wave/stellar/repos) — confirms approved Stellar Wave Program status.
2. [Trustless Work Smart Escrow Repository](https://github.com/Trustless-Work/Trustless-Work-Smart-Escrow) — Soroban Rust contracts, roles, milestones, and dispute logic.
3. [Trustless Work Backend](https://github.com/Trustless-Work/Trustless-Work-Back-End) — event indexing and REST transaction assembly.
4. [Trustless Work dApp](https://github.com/Trustless-Work/dApp-Trustless-Work) — Next.js client and Stellar Wallets Kit integration.
5. [Trustless Work SDK](https://github.com/Trustless-Work/Trustless-Work-SDK) — TypeScript integration surface.
6. [Trustless Work Documentation](https://docs.trustlesswork.com) — escrow roles, milestone semantics, and API reference.
7. [Stellar Expert Testnet Explorer](https://stellar.expert/explorer/testnet) — independent on-chain verification of the escrow contract.

---

## Hub Submission Confirmation

- **Hub Project Name:** Trustless Work
- **Duplicate check:** searched Stellar Wave Hub (`/explore?search=Trustless`) and the public projects API before preparing this profile; no existing listing was found.
- **Status:** profile prepared for Stellar Wave Hub review
- **Network:** Testnet
- **Submitted Category:** Infrastructure
- **Evidence Files:** this dossier, architecture and lifecycle diagrams, and the recorded on-chain verification response.
