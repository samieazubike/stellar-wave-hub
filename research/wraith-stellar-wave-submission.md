# Wraith — Stellar Wave Research Submission

## Project Identity

- **Project Name:** Wraith
- **Category:** Infrastructure / Tools
- **Wave Source:** `Miracle656/wraith` is visible as a Drips project page for a GitHub repository in the Stellar Wave ecosystem.
- **Website:** Not published as a standalone production website
- **Repository:** https://github.com/Miracle656/wraith
- **Drips Project Page:** https://drips.network/app/projects/github/Miracle656/wraith
- **Logo / Profile Image:** https://github.com/Miracle656.png

## Submission Fields

- **Name:** Wraith
- **Category:** infrastructure
- **Stellar network:** testnet
- **Stellar contract ID:** `CDMLFMKMMD7MWZP3FKUBZPVHTUEDLSX4BYGYKH4GCESXYHS3IHQ4EIG4`
- **Tags:** `soroban, indexer, infrastructure, stellar-rpc, sep-41, cap-67, token-events, developer-tools, stellar-wave`
- **GitHub repositories:**
  - Core indexer: https://github.com/Miracle656/wraith
- **Research images:**
  - `research/wraith-architecture.png`
  - `research/wraith-onchain-activity.png`
  - `research/wraith-wave-source.png`

## Description

Wraith is a Stellar infrastructure project that indexes incoming Soroban token transfers by recipient address, a query pattern that Horizon does not provide for Stellar Asset Contract and SEP-41 token events. Its core value is practical: wallets, payment apps, bots, dashboards, and accounting tools often need to answer "what did this address receive?" without running their own event decoder. Wraith fills that gap by polling Stellar RPC `getEvents`, decoding CAP-67 and SEP-41 token events, storing normalized transfer records in Postgres, and exposing both REST endpoints and WebSocket subscriptions for address-level transfer monitoring.

The technical design is deliberately small and indexer-focused. The `startIndexer()` loop tracks the latest ledger, fetches Soroban contract events in batches, and routes them through `fetchEventsSafe`. That safe fetcher is important because the README documents a bisection strategy for protocol/XDR decoding errors: if one ledger in a range cannot be decoded, the range is split until the problematic ledger is isolated, logged, skipped, and indexing continues. Parsed events are converted into typed records covering `transfer`, `mint`, `burn`, and `clawback`, then persisted with duplicate protection. Query APIs such as `/transfers/incoming/:address`, `/transfers/outgoing/:address`, `/transfers/address/:address`, `/transfers/tx/:txHash`, and `/summary/:address` make the indexed data directly useful to downstream applications.

Wraith uses Stellar through Soroban RPC rather than a custom contract. The project watches configured Stellar Asset Contract IDs via `SAC_CONTRACT_IDS` or `CONTRACT_IDS`; when unset, it defaults to the native XLM SAC for the selected network. The testnet native XLM SAC published in source is `CDMLFMKMMD7MWZP3FKUBZPVHTUEDLSX4BYGYKH4GCESXYHS3IHQ4EIG4`, and Stellar Expert's testnet contract API resolves it successfully. The README also documents mainnet configuration expectations and explains that production mainnet deployments should use an explicit Soroban RPC provider plus a constrained contract filter, for example native XLM and USDC SACs, to avoid scanning unnecessary event volume.

This makes Wraith a strong Stellar Wave Hub entry even though it is not a consumer dApp: it is ecosystem plumbing. It improves observability for Soroban token movement, makes address-centric incoming payment detection easier, and turns raw Stellar RPC events into application-friendly data. Its implementation goes beyond marketing claims because the repository includes concrete source code, OpenAPI documentation, Prisma-backed storage, environment configuration, and tests around SAC contract resolution and transfer decoding.

## On-chain Verification

- **Testnet native XLM SAC contract:** `CDMLFMKMMD7MWZP3FKUBZPVHTUEDLSX4BYGYKH4GCESXYHS3IHQ4EIG4`
- **Verification endpoint used:** `https://api.stellar.expert/explorer/testnet/contract/CDMLFMKMMD7MWZP3FKUBZPVHTUEDLSX4BYGYKH4GCESXYHS3IHQ4EIG4`
- **Result:** Stellar Expert returned a contract record for the testnet contract.

Wraith also documents the production native XLM SAC in source, but the testnet contract is the verified on-chain identifier used for this submission because it resolved cleanly during research.

## Research Sources

- Drips project page for `Miracle656/wraith`
- Wraith README and `.env.example`
- Wraith `src/indexer.ts`
- Stellar Expert testnet contract API

## Submission Checklist

- [x] Verified as a Stellar Wave-visible project via Drips
- [x] Confirmed the project is not already in the approved Hub project list
- [x] Wrote original 200+ word technical research description
- [x] Verified a Stellar/Soroban contract ID
- [x] Added category and accurate tags
- [x] Prepared research images for architecture, on-chain verification, and Wave source
- [x] Submitted to Stellar Wave Hub API as project `id: 88`, slug `wraith`, status `submitted`
