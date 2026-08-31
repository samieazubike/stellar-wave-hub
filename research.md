# Soroswap - Stellar Wave Research Submission

## Project Selected

- **Project Name:** Soroswap
- **Website:** https://soroswap.finance/
- **Domain/Category:** DeFi / Decentralized Exchange (DEX)
- **Tags:** defi, amm, soroban, dex, smart-contracts, liquidity

## Description

Soroswap is a pioneering automated market maker (AMM) built natively on Stellar's Soroban smart contracts platform. Designed to replicate the intuitive, permissionless liquidity provisioning and trading experience of traditional AMMs (like Uniswap V2) while taking advantage of Stellar's unique consensus mechanism and low fees, Soroswap enables developers and users to swap tokens and earn yield from trading fees seamlessly. By implementing an immutable, transparent set of smart contracts, Soroswap removes the need for centralized intermediaries.

At its core, the protocol utilizes the standard x * y = k constant product formula for its liquidity pools, ensuring a continuous supply of liquidity across various price ranges. It solves the critical problem of fragmented liquidity and inaccessible trading on early-stage Soroban projects by establishing a standard automated trading venue. This is especially vital for the Stellar ecosystem as it transitions into full smart contract capabilities, opening the door for complex DeFi primitives that require a robust underlying DEX.

## The Problem the Project Solves

Before Soroban, the Stellar network relied solely on its built-in orderbook-based decentralized exchange (DEX). While powerful, traditional orderbooks can be challenging for creating instant, permissionless liquidity pools for new or long-tail assets without active market makers. Soroswap solves this by providing a decentralized, Automated Market Maker (AMM) infrastructure. It allows any user to create a pool for any Soroban token pair and provide liquidity, guaranteeing that users can instantly swap between tokens without waiting for a counterparty to place a matching order.

## How the Project Uses Stellar

Soroswap leverages the Stellar network in a few fundamental ways:
1. **Soroban Smart Contracts:** The entire logic of Soroswap (Factory, Router, and Pair contracts) is deployed as Rust-based WebAssembly (WASM) smart contracts on Soroban.
2. **Speed & Finality:** By running on the Stellar network, Soroswap benefits from Stellar's fast consensus protocol (SCP), meaning swaps and liquidity provision happen in seconds with near-instant finality.
3. **Low Fees:** Transaction costs on Stellar are fractions of a cent, allowing users to trade and manage liquidity positions without the prohibitive gas fees seen on other blockchains.

## Technical Approach

The Soroswap architecture is modular, primarily broken down into a core set of Soroban contracts:
- **SoroswapFactory:** Responsible for deploying new liquidity pool contracts (Pairs) and maintaining a registry of all active pools. It ensures that only one pool exists per unique token pair.
- **SoroswapRouter:** The main entry point for user interactions. It calculates swap paths, handles slippage protection, and orchestrates the movement of tokens between the user's wallet and the Pair contracts.
- **SoroswapPair:** The individual liquidity pools that hold the reserves of two tokens, manage the minting and burning of LP (Liquidity Provider) tokens, and execute the core x * y = k invariant logic for swaps.

## Team and Community Information

The project is developed by the Soroswap Finance team, an active group of contributors in the Stellar and Soroban ecosystem. They maintain a strong open-source presence on GitHub (`soroswap/core`) and regularly engage with the community through Discord and X (Twitter), gathering feedback, providing technical support to integrators, and participating in Stellar hackathons and community funds.

## Verified On-Chain Information

**Stellar Mainnet Contract IDs:**
- **SoroswapFactory:** `CA4HEQTL2WPEUYKYKCDOHCDNIV4QHNJ7EL4J4NQ6VADP7SYHVRYZ7AW2`
- **SoroswapRouter:** `CAG5LRYQ5JVEUI5TEID72EYOVX44TTUJT5BQR2J6J77FH65PCCFAJDDH`

## Supporting Screenshots

![Soroswap Architecture](https://raw.githubusercontent.com/soroswap/core/main/docs/architecture.png)
*(Placeholder: Architecture of Soroswap Core Contracts)*

## Sources & References
- Soroswap Documentation: https://docs.soroswap.finance/
- Soroswap Core GitHub Repository: https://github.com/soroswap/core
- Stellar Mainnet Contract Registry
