# Tansu — Stellar Wave Soroban Research Submission

## Project Selected

- **Project:** Tansu
- **Wave source:** `Consulting-Manao/tansu` listed in Stellar Wave repositories on Drips
- **Domain:** Governance / DAO infrastructure
- **Website:** https://tansu.dev
- **Repository:** https://github.com/Consulting-Manao/tansu

## Why This Matches the Task

Tansu is explicitly built on Stellar Soroban and is actively part of the Stellar Wave ecosystem. The project focuses on decentralized project governance and code integrity with on-chain proposal and voting flows. It is not a duplicate in the target Hub instance at the time of submission and includes verifiable Stellar account and Soroban contract artifacts.

## Verifiable On-Chain IDs

- **Soroban contract (testnet):** `CBXKUSLQPVF35FYURR5C42BPYA5UOVDXX2ELKIM2CAJMCI6HXG2BHGZA`
- **Soroban contract (mainnet):** `CDXINK2T3P46M4LWK35FVIXXHJ2XHAS4FOVCGVPJ63YV5OVTM24IY5BI`
- **Stellar account (maintainer):** `GD4FXNCYPQWNDWZYZZD4WFYYFTP466IKAKCZOYE5TPFTSSOZDA4QF3ER`

Verification endpoints used:

- `https://api.stellar.expert/explorer/testnet/contract/CBXKUSLQPVF35FYURR5C42BPYA5UOVDXX2ELKIM2CAJMCI6HXG2BHGZA`
- `https://api.stellar.expert/explorer/public/contract/CDXINK2T3P46M4LWK35FVIXXHJ2XHAS4FOVCGVPJ63YV5OVTM24IY5BI`
- `https://horizon.stellar.org/accounts/GD4FXNCYPQWNDWZYZZD4WFYYFTP466IKAKCZOYE5TPFTSSOZDA4QF3ER`

## Smart Contract Architecture (Detailed)

Tansu uses Soroban contracts as the authoritative execution layer for governance logic. Instead of treating governance data as an off-chain concern, it pushes key state transitions on-chain so independent observers can verify outcomes directly from ledger history. The practical effect is that proposal lifecycle operations (creation, vote casting, finalization) are executed under deterministic contract rules rather than mutable server-side business logic.

The architecture follows a layered model:

1. **Soroban contract layer:** stores and enforces governance state, access rules, and transitions.
2. **Indexing/UI layer:** reads contract state and events for presentation, filtering, and usability.
3. **Metadata/content layer:** attaches project context and proposal content with decentralized references.

This design enables a strong trust model: users can validate that governance outcomes were produced by the deployed contract IDs, inspect contract creators and deployment metadata on explorers, and correlate account-level activity through Horizon/Stellar Expert without relying on a centralized backend for truth. In addition, event-driven indexing allows real-time UX while preserving an auditable source-of-truth on Soroban.

For Stellar Wave context, Tansu demonstrates a governance-native use case in the Soroban ecosystem: transparent proposal workflows, accountable voting, and verifiable governance records suitable for open-source communities and public-goods processes.

## Submission Performed

Live API submission was completed successfully on March 26, 2026.

- **Hub endpoint:** `https://usestellarwavehub.vercel.app/api/projects`
- **Result:** created project with `id: 15`, `status: submitted`
- **Tags used:** `soroban, smart-contract, governance, dao, open-source, stellar-wave`
