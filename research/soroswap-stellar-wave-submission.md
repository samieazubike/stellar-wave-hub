# Research: Soroswap

## Project Name

Soroswap

## Category

DeFi

## Tags

soroban, defi, dex, amm, aggregator, liquidity, swaps, stellar, rust, sdk

## Links

- **Official Website:** https://soroswap.finance
- **Documentation:** https://docs.soroswap.finance
- **GitHub Organization:** https://github.com/soroswap
- **Core Smart Contracts:** https://github.com/soroswap/core
- **Builder / Organization:** https://paltalabs.io (PaltaLabs)
- **X (Twitter):** https://x.com/SoroswapFinance
- **Discord:** https://discord.gg/f3a835a3
- **Stellar Wave Program:** https://www.drips.network/wave/stellar (`soroswap` repositories participate in Stellar Wave contribution cycles with `drips-wave` / `Stellar Wave` issues)

## Verified Stellar / Soroban Identifiers

All mainnet Soroban contract IDs and deployed WASM hashes below are sourced directly from the official Soroswap mainnet deployment manifest (`public/mainnet.contracts.json` in `soroswap/core`) and can be inspected on Stellar.Expert:

| Contract | Mainnet Soroban Contract ID | Explorer Link |
| --- | --- | --- |
| **SoroswapFactory** | `CA4HEQTL2WPEUYKYKCDOHCDNIV4QHNJ7EL4J4NQ6VADP7SYHVRYZ7AW2` | [Stellar.Expert](https://stellar.expert/explorer/public/contract/CA4HEQTL2WPEUYKYKCDOHCDNIV4QHNJ7EL4J4NQ6VADP7SYHVRYZ7AW2) |
| **SoroswapRouter** | `CAG5LRYQ5JVEUI5TEID72EYOVX44TTUJT5BQR2J6J77FH65PCCFAJDDH` | [Stellar.Expert](https://stellar.expert/explorer/public/contract/CAG5LRYQ5JVEUI5TEID72EYOVX44TTUJT5BQR2J6J77FH65PCCFAJDDH) |

### Verified Mainnet WASM Hashes (`soroswap/core`)

- **Pair WASM Hash:** `18051456816b66f12e773a56f77c5794fac1b1fb7ab6e22d4fad5a412770f73e`
- **Factory WASM Hash:** `5db738b05d9148128a240b0e2c1cb935c2805192bf98a579421aacda364c8dae`
- **Router WASM Hash:** `4c3db3ebd2d6a2ab23de1f622eaabb39501539b4611b68622ec4e47f76c4ba07`
- **Token WASM Hash:** `93c5e22d071a330e789bc6a62409a87a0c05966273977e22fcabfc57e834f548`

## Original Description

Soroswap is the first open-source Automated Market Maker (AMM) decentralized exchange and liquidity aggregator built natively on Stellar's Soroban smart contract platform by PaltaLabs. Designed to bring permissionless, constant-product liquidity pools and multi-venue trade routing to the Stellar ecosystem, Soroswap enables users, wallets, and DeFi applications to swap Stellar-native and Soroban-native assets with deterministic on-chain execution, low slippage, and sub-cent transaction fees.

At the protocol layer, Soroswap adapts the proven Factory-Pair-Router AMM architecture to Soroban's Rust-based execution environment and state model. Anyone can permissionlessly deploy a new liquidity pool through `SoroswapFactory`, supply paired token reserves to earn swap fees represented by LP tokens, and execute single-hop or multi-hop trades through `SoroswapRouter` with explicit slippage bounds and deadline protection. Because Stellar assets are natively exposed to Soroban via the Stellar Asset Contract (SAC) interface, Soroswap pools seamlessly bridge classic Stellar-issued assets—such as USDC, EURC, and XLM—with newly deployed Soroban tokens without requiring custom wrapped-token bridges.

Beyond its core AMM pools, Soroswap operates a DEX Aggregator layer that queries liquidity across multiple Stellar/Soroban venues (including Soroswap AMM, Aquarius, and other integrated pools) and splits orders across routes within a single atomic transaction. Paired with its developer SDK and routing API, Soroswap functions not only as a retail swap interface but also as foundational liquidity infrastructure for wallets, payment apps, and yield protocols across Stellar.

## The Problem It Solves

While Stellar has long supported a built-in orderbook decentralized exchange (SDEX) for classic assets, the launch of Soroban introduced programmable smart contracts and Soroban-native tokens that require composable, permissionless liquidity primitives. Without an AMM and aggregator layer on Soroban, liquidity fragments across isolated venues, developers cannot easily compose swaps inside smart contracts, and end users suffer from higher slippage on long-tail or newly issued assets. Soroswap solves this by providing audited, permissionless constant-product liquidity pools alongside an atomic multi-DEX aggregator and SDK so wallets and dApps can route trades across Stellar liquidity through a single integration.

## How It Uses Stellar

- **Soroban Smart Contracts (Rust):** Core Factory, Pair, Router, and Aggregator contracts are written in Rust using `soroban-sdk`, leveraging Soroban's host functions, explicit authorization (`require_auth`), and instance/persistent ledger storage with TTL rent management.
- **Stellar Asset Contract (SAC) Interoperability:** Pools natively interact with both classic Stellar-issued assets (via SAC) and pure Soroban SEP-41 tokens through a uniform token interface.
- **Fast Finality & Low Fees:** Stellar's ~5-second ledger close times and sub-cent fees make multi-hop routing, frequent liquidity rebalancing, and split-route aggregation economically practical for retail and institutional transactions alike.

## Technical Approach

- **Factory-Pair-Router Architecture:** `SoroswapFactory` deterministically deploys `SoroswapPair` contracts using the registered pair WASM hash, preventing duplicate pools for the same token pair. `SoroswapRouter` orchestrates liquidity additions, removals, and multi-hop swaps while enforcing minimum output amounts and transaction deadlines.
- **Constant-Product Invariant (`x * y = k`):** Pair contracts maintain reserve accounting and issue LP tokens representing proportional pool ownership, accruing swap fees directly into pool reserves.
- **Multi-DEX Aggregator & Split Routing:** The aggregator layer evaluates quotes across multiple Soroban liquidity venues and executes split trades atomically, reducing price impact on larger swaps.
- **Security & Auditing:** Core smart contracts underwent third-party security audits—including reviews by OtterSec—focusing on Soroban authorization flows, TTL/state expiration handling, arithmetic precision, and routing invariants prior to mainnet deployment.
- **Developer Tooling & Ecosystem Composability:** Open-source repositories under `github.com/soroswap` provide typed SDKs, token lists, router APIs, and frontend components used by downstream Stellar protocols (including yield infrastructure such as DeFindex).

## Team & Community

- **Builder:** PaltaLabs (Stellar/Soroban DeFi engineering studio)
- **Founder:** Esteban Iglesias
- **Core Contributors:** PaltaLabs engineering team and open-source contributors participating via the Stellar Wave Program
- **Community Channels:** X (`@SoroswapFinance`), Discord, and open-source development on GitHub (`github.com/soroswap`).

## Hub Duplicate Check

Before researching and preparing this submission, Stellar Wave Hub (`https://usestellarwavehub.vercel.app`) was checked across `/explore` and `/queue`, as well as existing entries in `research/`. **Soroswap** is not currently listed on Stellar Wave Hub.

## Sources

1. Soroswap Core Repository & Mainnet Deployment Manifest (`public/mainnet.contracts.json`): https://github.com/soroswap/core
2. Soroswap GitHub Organization: https://github.com/soroswap
3. Soroswap Official Website & Documentation: https://soroswap.finance / https://docs.soroswap.finance
4. PaltaLabs: https://paltalabs.io
5. Stellar Wave Program (Drips Network): https://www.drips.network/wave/stellar
6. Stellar.Expert Mainnet Contract Explorer (Factory): https://stellar.expert/explorer/public/contract/CA4HEQTL2WPEUYKYKCDOHCDNIV4QHNJ7EL4J4NQ6VADP7SYHVRYZ7AW2
7. Stellar.Expert Mainnet Contract Explorer (Router): https://stellar.expert/explorer/public/contract/CAG5LRYQ5JVEUI5TEID72EYOVX44TTUJT5BQR2J6J77FH65PCCFAJDDH
