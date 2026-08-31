# Research: Soroswap

## Project Name
Soroswap

## Project Description
Soroswap is a pioneering decentralized exchange (DEX) and automated market maker (AMM) built entirely on Stellar's smart contract platform, Soroban. It provides a secure, efficient, and low-cost environment for users to swap tokens, provide liquidity, and earn fees within the Stellar ecosystem. Soroswap aims to bring robust DeFi capabilities to Stellar by leveraging Soroban's rust-based smart contracts, offering high throughput, minimal transaction fees, and seamless integration with existing Stellar assets. The protocol enables developers to easily integrate token swapping functionalities into their decentralized applications (dApps), fostering a vibrant and interconnected DeFi landscape on the Stellar network.

## The Problem the Project Solves
Before the introduction of Soroban, the Stellar network lacked native, Turing-complete smart contracts, which limited the development of complex DeFi applications like AMMs. Users had to rely on Stellar's built-in order book DEX, which, while efficient, did not offer the liquidity pool models that have become the standard in modern DeFi. Soroswap solves this by providing a classic constant-product AMM (similar to Uniswap V2) natively on Soroban, ensuring deep liquidity, permissionless trading, and automated price discovery.

## How the Project Uses Stellar
Soroswap is deployed exclusively on Stellar's Soroban smart contract environment. It utilizes Soroban's compute capabilities to manage liquidity pools and execute trades securely. It integrates deeply with Stellar's native assets, allowing users to swap standard Stellar tokens alongside newly issued Soroban tokens seamlessly.

## Technical Approach
The protocol is written in Rust, utilizing the Soroban SDK. Its architecture consists of a Factory contract, which is responsible for deploying and keeping track of individual Pair contracts. Each Pair contract manages the reserves of two tokens, using the constant-product formula (x * y = k) to determine exchange rates. The contracts are optimized for Soroban's specific metering and storage models, ensuring efficient execution and low fees.

## Team and Community Information
The Soroswap team is an active participant in the Stellar developer community. They have been recipients of the Stellar Community Fund (SCF) and regularly contribute open-source tools and educational content to help other developers build on Soroban. The project maintains an active Discord server and Twitter presence for community engagement and governance discussions.

## Verified Soroban Contract ID
Factory Contract: `CCW3O5O3Q3Z4...` (Example mainnet contract ID)

## Category and Relevant Tags
- **Category:** DeFi
- **Tags:** AMM, DEX, Soroban, Smart Contracts, Liquidity

## Supporting Screenshots
- [Architecture Diagram] *(Image omitted)*
- [Soroswap UI Preview] *(Image omitted)*
