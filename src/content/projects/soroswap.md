---
name: "Soroswap"
description: "The primary decentralized exchange and AMM protocol on the Soroban smart contract platform."
category: "defi"
contractId: "CACV7YMCT7TMA6Y7YM..."
tags: ["dex", "amm", "liquidity", "soroban"]
links:
  website: "https://soroswap.finance"
  github: "https://github.com/soroswap"
---

## Project Overview
Soroswap is a foundational Automated Market Maker (AMM) protocol built specifically for the Soroban smart contract environment on Stellar. As a key participant in the Stellar Wave program, Soroswap enables decentralized, non-custodial asset swaps that are essential for the growth of a robust on-chain economy.

## DeFi Mechanics
The protocol operates using the constant product formula, $x \times y = k$, which ensures that the product of the quantities of two assets in a liquidity pool remains constant. This mechanism allows for price discovery and liquidity provision without the need for traditional centralized market makers. Users can contribute assets to liquidity pools to earn a portion of the trading fees, effectively acting as decentralized yield-earners.

## On-Chain Architecture
Soroswap's architecture is composed of a Factory contract that handles the deployment of individual Pair contracts for every unique token pair. It utilizes Soroban's native 'Auth' framework to manage secure interactions, such as adding or removing liquidity and executing cross-asset swaps. This design maximizes capital efficiency while minimizing gas costs, making it a sustainable primitive for the broader Stellar DeFi ecosystem.

