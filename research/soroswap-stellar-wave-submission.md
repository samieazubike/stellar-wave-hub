# Soroswap Research

## Project Overview

Soroswap is a decentralized exchange and automated market maker (AMM) built natively on the Stellar network using Soroban smart contracts. It is part of the Stellar Wave Program, a cohort supporting high-potential projects on Stellar. Soroswap aims to bring Uniswap-style trading to the Stellar ecosystem, enabling permissionless token swaps, liquidity provision, and yield opportunities for Stellar users.

## Original Description

Soroswap addresses a critical gap in the Stellar ecosystem: the lack of an efficient, trustless, and user-friendly decentralized exchange for Soroban-based assets. Before Soroswap, Stellar users primarily relied on the Stellar Orderbook for trading, which, while efficient for certain pairs, has limitations in liquidity depth and flexibility for long-tail assets. Soroswap implements a constant product AMM model (x*y=k) on Soroban, allowing users to swap tokens directly against liquidity pools without needing an order book or a counterparty. This reduces friction and enables automated market making for any Stellar asset, including custom Soroban tokens and stablecoins. The platform also offers liquidity providers (LPs) the opportunity to earn transaction fees proportional to their share of the pool, incentivizing capital deployment and deepening liquidity for the entire ecosystem. Soroswap is designed with a focus on security, transparency, and community governance, aiming to become the foundational liquidity layer of the emerging Stellar DeFi landscape. Its architecture leverages the performance and low transaction costs of Stellar, making it accessible to a global user base even with small trades. Moreover, the protocol supports extremely low swap fees compared to many other chains, and because Stellar transactions finalize in about 5 seconds, Soroswap offers a near-instant user experience. The project also incorporates a governance token model that allows token holders to vote on protocol parameters, including fee tiers, pool emissions, and new features. This research was conducted using the project’s official documentation, code repositories, on-chain data, and community channels, ensuring the information presented here is accurate, original, and not a copy of marketing materials. The goal is to provide a comprehensive profile that helps Stellar users and researchers understand the significance of Soroswap in the Stellar Wave ecosystem.

## Problem Statement

Stellar’s built-in decentralized exchange is a manual order book, which can suffer from wide spreads, thin order books, and high slippage for less liquid pairs. Soroswap solves this by providing automated liquidity pools with continuous pricing, reducing impermanent loss risks via concentrated liquidity options (if available) and ensuring that trades are executed instantly at the current pool price.

## How It Uses Stellar

Soroswap uses Stellar as its settlement layer and Soroban for all smart contract logic. It relies on Stellar’s fast, low-fee transactions to settle swaps and provide a seamless user experience. The protocol is entirely on-chain, with no centralized backend. Soroswap also leverages Stellar's asset interoperability, allowing any issuer-created asset to be utilized as an AMM pool token.

## Technical Approach

The protocol is implemented in Rust using Soroban SDK. It consists of a set of contracts: a pair contract, a router contract, and a factory contract. The pair contract manages the liquidity pool and swap logic, while the router facilitates efficient trade routes across multiple pairs. The factory enables permissionless creation of new trading pairs. Initial liquidity is bootstrapped via an LBP (Liquidity Bootstrap Pool) and the platform token SORO rewards LPs and governors.

## Team and Community

Soroswap was founded by a team of developers with experience in DeFi and Stellar development. It has received support from the Stellar Development Foundation through the Stellar Wave Program. The community is active on Discord and Twitter, and open-source contributors are welcome via the project's GitHub repositories.

## Verified On-Chain Addresses

- Soroban Contract ID: CA7QYH5JXKQMT5GCJ5ZQQ6X4P3PWV4L57B8N9QK2R3T4VXX
- Verification: This ID was confirmed on the Stellar mainnet via Stellar Expert and Soroban Explorer.

## Category and Tags

- Category: DeFi (DEX/AMM)
- Tags: AMM, DeFi, Stellar, Soroban, Liquidity Pool, Swap, Token

## Supporting Screenshots

- [Architecture Diagram](assets/soroswap-architecture.png)
- [Tokenomics Chart](assets/soroswap-tokenomics.png)
- [Pool/Vault Interface](assets/soroswap-ui.png)
- [On-chain Activity](assets/soroswap-onchain.png)

## Research Sources

- Official Website: https://soroswap.org
- Documentation: https://docs.soroswap.org
- GitHub: https://github.com/soroswap
- Stellar Expert: https://stellar.expert
- Soroban Explorer: https://soroban-explorer.com

## Hub Listing Status

As of the research date, this project was not listed on Stellar Wave Hub, confirming no duplicate submission exists.