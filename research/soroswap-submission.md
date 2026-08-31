# Soroswap - Stellar Wave Research Submission

## Project Identity

- **Project Name:** Soroswap
- **Category:** DeFi
- **Website:** https://soroswap.finance
- **Repository:** https://github.com/soroswap/core
- **Logo:** `research/soroswap-logo.png`

## Submission Fields

- **Name:** Soroswap
- **Category:** defi
- **Stellar network:** mainnet
- **Stellar contract ID:** `CA4HEQTL2WPEUYKYKCDOHCDNIV4QHNJ7EL4J4NQ6VADP7SYHVRYZ7AW2`
- **Tags:** `soroban, defi, dex, amm, liquidity, stellar-wave`
- **GitHub repositories:**
  - Core AMM contracts: https://github.com/soroswap/core
- **Research images:**
  - `research/soroswap-logo.png`

## Description

Soroswap is a pioneering decentralized exchange (DEX) and automated market maker (AMM) protocol built specifically for the Stellar network using the Soroban smart contract platform. Its core objective is to provide seamless, permissionless, and efficient token swapping capabilities that leverage Stellar's high speed and low transaction costs. Before the introduction of Soroban, Stellar relied heavily on its native, protocol-level DEX (SDEX). Soroswap expands upon this foundation by introducing a Uniswap V2-style liquidity pool model directly on-chain, which enables more flexible DeFi interactions, better developer programmability, and liquidity aggregation across the ecosystem.

The technical architecture of Soroswap revolves around a set of Rust-based smart contracts deployed on the Soroban network. The primary components include the Factory contract (`CA4HEQTL2WPEUYKYKCDOHCDNIV4QHNJ7EL4J4NQ6VADP7SYHVRYZ7AW2` on Mainnet), which is responsible for creating and tracking individual liquidity pool contracts for different token pairs. There is also a Router contract (`CAG5LRYQ5JVEUI5TEID72EYOVX44TTUJT5BQR2J6J77FH65PCCFAJDDH`) that acts as the entry point for users and other applications to execute swaps, add liquidity, or remove liquidity. By acting as an aggregator, Soroswap can also route trades optimally between its own AMM pools, Phoenix, Aqua, and the classic SDEX, ensuring users get the best possible execution price for their trades. 

Soroswap is developed and maintained by PaltaLabs and features an active community presence. Its integration within the Stellar Wave ecosystem encourages community contributions to its open-source repositories, focusing on front-end SDKs, smart contract optimizations, and documentation. This project solves the critical need for a modern, developer-friendly AMM on Stellar, transitioning the network from a pure payments layer to a robust, composable DeFi ecosystem.

## On-chain Verification

- **Mainnet Factory Contract:** `CA4HEQTL2WPEUYKYKCDOHCDNIV4QHNJ7EL4J4NQ6VADP7SYHVRYZ7AW2`
- **Mainnet Router Contract:** `CAG5LRYQ5JVEUI5TEID72EYOVX44TTUJT5BQR2J6J77FH65PCCFAJDDH`
- **Result:** Verified on Stellar Expert and Soroswap documentation.

## Research Sources

- Soroswap Official Website (soroswap.finance)
- Soroswap Core GitHub Repository (github.com/soroswap/core)
- Soroswap Documentation (docs.soroswap.finance)

## Submission Checklist

- [x] Verified as a Stellar Wave ecosystem project
- [x] Confirmed the project is not already in the approved Hub project list
- [x] Wrote original 200+ word technical research description
- [x] Verified a Stellar/Soroban contract ID
- [x] Added category and accurate tags
- [x] Prepared research images
- [x] Added research.md to the repository
- [x] Added myself to CONTRIBUTORS.md
