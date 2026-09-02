# Soroswap — Stellar Wave Research Submission

## Project Selected

- **Project:** Soroswap
- **Wave source:** Stellar Wave Program / Stellar ecosystem project
- **Domain:** DeFi / DEX Aggregator / Infrastructure
- **Website:** https://soroswap.finance
- **Documentation:** https://docs.soroswap.finance
- **GitHub:** https://github.com/soroswap
- **Primary contracts:** `CA4HEQTL2WPEUYKYKCDOHCDNIV4QHNJ7EL4J4NQ6VADP7SYHVRYZ7AW2` (SoroswapFactory) and `CAG5LRYQ5JVEUI5TEID72EYOVX44TTUJT5BQR2J6J77FH65PCCFAJDDH` (SoroswapRouter)
- **Verified deployer account:** `GAYPUMZFDKUEUJ4LPTHVXVG2GD5B6AV5GGLYDMSZXCSI4QILQKSY25JI`

## Why Soroswap Fits the Task

Soroswap is a credible and active DeFi infrastructure project built on Stellar. It is not a marketing-only concept; it is live on mainnet and documented as a decentralized exchange and aggregator for Stellar liquidity. According to the project’s own docs, Soroswap is “the first DEX and exchange aggregator built on Stellar, powered by smart contracts on Soroban.” That directly aligns with the research objective: it is a real blockchain product with actual protocol contracts, public deployments, and developer tooling that operates within the Stellar ecosystem.

The project also satisfies the requirement to verify a real on-chain identity. The official Soroswap core repository lists the deployer address and the main contract IDs publicly, and these IDs are visible in the canonical GitHub README. That gives a clear and auditable starting point for a project profile on the Hub.

## Problem Soroswap Solves

Before Soroswap, a significant part of Stellar’s DeFi experience was fragmented. Users and developers had to navigate multiple liquidity sources across Stellar’s ecosystem, including Soroban-native AMMs and the Stellar Classic DEX. That fragmentation created friction for swap routing, price discovery, and user onboarding. The project addresses this by providing one integration point that aggregates liquidity across different networks and protocols on Stellar.

This is especially important for developers building apps that need trade execution without forcing end users to understand the details of liquidity routing, trustlines, or protocol-specific execution logic. Soroswap reduces the burden by creating a unified interface for quotes, swaps, and transaction generation.

## How the Project Uses Stellar

Soroswap is built directly on Stellar and Soroban. Its official documentation explains that it operates as an AMM, an AMM aggregator, and an API layer. The project uses Soroban smart contracts for the AMM core, which allows token swaps and liquidity provisioning through smart-contract-based liquidity pools. It also aggregates liquidity from several protocols, including Soroswap, Phoenix, Aqua, and SDEX, to offer better quote execution for users and developer integrations.

The platform also exposes an API for developers who want to quote swaps, retrieve liquidity data, and build XDR transactions. This infrastructure sits on top of Stellar’s public network and demonstrates how an app can use Stellar primitives and Soroban smart contracts to build a high-utility DeFi layer. The gasless trustline capability also shows a practical UX layer designed to lower onboarding friction for users who are not yet familiar with Stellar’s trustline model.

## Technical Approach

The project’s technical model is straightforward and strong: it combines smart-contract AMM primitives with a routing and aggregation layer. The `core` repository describes Soroswap’s smart contracts as “AMM, Factory, Router” written in Rust with `soroban-sdk`, which is a clear signal that the protocol’s base logic is natively Soroban-based rather than a wrapper around a central service.

The system then extends into an aggregation layer that routes across multiple liquidity venues to optimize trade execution. The Soroswap API is essentially the developer-facing integration point: it offers quote retrieval, route optimization, transaction construction, and submission. The documentation explicitly states that the API gives access to real-time pricing and routing, along with pooled liquidity data, and that it is designed for wallets, frontends, and other apps.

## Team and Community Information

Soroswap is published under the Soroswap GitHub organization, and the official docs and product site identify PaltaLabs as the team behind the platform. The docs also provide developer support contact details: `dev@paltalabs.io`. The project maintains an official Discord community and has active public documentation at `https://docs.soroswap.finance`, a live app at `https://soroswap.finance`, and a public GitHub organization with multiple repositories including `core`, `docs`, `frontend`, `sdk`, `aggregator`, and `backend`.

The presence of a strong documentation structure, public API access, open GitHub repos, and direct support channels indicates an active, maintainable project rather than a dormant prototype.

## Verified On-Chain Identity

The `soroswap/core` GitHub README is a strong verification source for the protocol’s public deployment information. It lists:

- Deployer account: `GAYPUMZFDKUEUJ4LPTHVXVG2GD5B6AV5GGLYDMSZXCSI4QILQKSY25JI`
- SoroswapFactory: `CA4HEQTL2WPEUYKYKCDOHCDNIV4QHNJ7EL4J4NQ6VADP7SYHVRYZ7AW2`
- SoroswapRouter: `CAG5LRYQ5JVEUI5TEID72EYOVX44TTUJT5BQR2J6J77FH65PCCFAJDDH`

These are publicly listed by the official project repo and are therefore suitable for independent verification on Stellar explorers and Soroban inspection tools.

## Category and Tags

- **Primary category:** DeFi
- **Secondary categories:** DEX, Infrastructure, Aggregator, AMM, Developer Tools
- **Tags:** `stellar`, `soroban`, `defi`, `dex`, `amm`, `aggregator`, `routing`, `infrastructure`, `payments`, `mainnet`

## Supporting Evidence and Screenshots

Supporting materials are available from the official public sources:

- https://soroswap.finance
- https://docs.soroswap.finance
- https://github.com/soroswap/core
- https://api.soroswap.finance/docs
- Stellar.Expert contract links publicly referenced in the source repository README

These official pages provide screenshots, product visuals, API documentation, and contract metadata that are appropriate for a project profile submission.

## Research Conclusion

Soroswap is a strong Stellar Wave candidate because it is a live, developer-facing DeFi protocol with a real mainnet deployment, public smart contracts, SDK/API integration points, and documented ecosystem impact. It solves a genuine problem in Stellar’s DeFi stack by aggregating routing and liquidity across multiple protocols, which makes it more useful to both users and app developers. The combination of official docs, contract IDs, GitHub repos, and community support makes it sufficiently verifiable for a robust submission.

## Source Notes

- Soroswap docs: https://docs.soroswap.finance
- Soroswap homepage: https://soroswap.finance
- Soroswap core repo: https://github.com/soroswap/core
- Soroswap GitHub org: https://github.com/soroswap
- Soroswap API docs: https://api.soroswap.finance/docs
- Soroswap product documentation and contract IDs as published in the core repository README
