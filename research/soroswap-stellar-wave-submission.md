# Soroswap - Stellar Wave Research Submission

## Project Selected

- **Project:** Soroswap
- **Wave source:** Decentralized Exchange (DEX) & Aggregator utilizing Stellar's Soroban smart contracts
- **Domain:** DeFi / Decentralized Exchange
- **Website:** https://soroswap.finance (App: https://app.soroswap.finance)
- **Category:** Financial Protocols / DeFi

## Why This Matches the Task

Soroswap is a pioneering decentralized exchange and liquidity protocol built on the Stellar network’s Soroban smart contract platform. It is a verified Stellar Community Fund (SCF) awardee and an active participant in the Stellar Wave ecosystem. By offering an Automated Market Maker (AMM) model alongside a smart contract aggregator, Soroswap provides fundamental DeFi infrastructure that helps solve liquidity fragmentation in the Stellar ecosystem. Its seamless integration with Soroban makes it an essential building block for developers looking to add swapping, lending, or earning capabilities to their dApps.

## Verifiable On-Chain Information

**Stellar Network:** Public Mainnet (Deployed March 2024)
**Smart Contract Platform:** Soroban 
**Core Infrastructure:** Liquidity Pools, AMM Smart Contracts, Aggregator Router

**Verification & Security:**
- Fully audited by industry leaders OtterSec and Runtime Verification
- Supported by the Stellar Community Fund (SCF) for infrastructure and security enhancements
- Open-source smart contracts

## Technical Architecture and Stellar Integration

### 1. Automated Market Maker (AMM)
- Soroswap operates using a constant product formula (\(x * y = k\)). 
- It facilitates peer-to-contract trading through isolated liquidity pools, allowing users to permissionlessly swap tokens like XLM and USDC without intermediaries.

### 2. DEX Aggregator
- A standout feature of Soroswap is its 'Aggregator' smart contract. 
- It uses a sophisticated routing mechanism to split trades across multiple Stellar DEXs (such as Phoenix and Aquarius). This ensures users receive the best possible execution price and experience minimal slippage when converting assets.

### 3. Developer Tooling
- Offers a 'one-call' API for developers to access liquidity across the entire Stellar ecosystem.
- Integrates gasless onboarding features to simplify the Web3 user experience, abstracting away transaction fee hurdles for new users.

## Description: DeFi Infrastructure and Real-World Impact

Soroswap represents a critical piece of the puzzle for Stellar’s evolution into a full-featured DeFi ecosystem via Soroban. Historically, while Stellar excelled at cross-border payments and RWA issuance, complex decentralized finance applications were limited before smart contracts. Developed by the specialized blockchain team at PaltaLabs, Soroswap directly addresses this by providing an open-source, highly efficient financial infrastructure designed specifically for Soroban. 

By combining an AMM DEX with a cross-DEX aggregator, Soroswap solves the problem of fragmented liquidity—a common issue in emerging smart contract networks. When a user or application executes a trade, Soroswap's router dynamically sources liquidity from the deepest pools available on Stellar, ensuring optimal pricing. This is critical not just for retail traders, but for institutional players and RWA platforms that require deep liquidity to function effectively.

Beyond basic swapping, the protocol introduces "Soroswap Earn" strategies, enabling users to generate yield by providing liquidity to the network. This capital efficiency is essential for bootstrapping a healthy DeFi economy on Stellar. Furthermore, its architecture is designed with interoperability in mind, setting the stage for bridging assets from other blockchains while maintaining the high-speed, low-cost transaction environment native to Stellar.

For the Stellar Wave Program, Soroswap is a textbook example of composability. Because it offers accessible developer APIs, other SCF projects—such as localized financial apps in Latin America or remittance tools—can plug directly into Soroswap’s liquidity engine to seamlessly swap stablecoins or fiat tokens in the background.

## Real-World Impact Metrics

- **Cumulative Routed Volume:** Over $50M+ 
- **Total Value Locked (TVL):** ~$1.2M 
- **Transaction Speed:** ~5 second settlement time (native to Stellar)
- **Security:** Multiple audits (OtterSec, Runtime Verification)

## Category and Tags

**Primary Category:** DeFi
**Asset Type:** Stellar Native & Bridged Assets (XLM, USDC, etc.)
**Tags:** defi, dex, soroban, smart-contracts, liquidity-pool, aggregator, stellar, soroswap, scf-funded, financial-protocols, amm

## Submission Details

- **Submitted to:** Stellar Wave Hub
- **Submission Date:** May 27, 2026
- **Status:** Research Phase
- **Verification:** Smart contracts and TVL verifiable on Stellar Mainnet via Soroban block explorers (e.g., StellarExpert)