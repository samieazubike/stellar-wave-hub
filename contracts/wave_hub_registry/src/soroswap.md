---
name: "Soroswap"
description: "A full-featured decentralized exchange and AMM protocol built on Soroban."
category: "defi"
contractId: "CACV7Y...[Insert Full ID]"
tags: ["dex", "amm", "liquidity", "stellar-wave"]
links:
  website: "https://soroswap.finance"
  github: "https://github.com/soroswap"
---

## Project Overview
Soroswap is the foundational decentralized exchange (DEX) of the Soroban ecosystem, bringing Automated Market Maker (AMM) capabilities to the Stellar network via smart contracts. As a participant in the Stellar Wave program, Soroswap provides a critical financial primitive that allows for permissionless asset swaps and liquidity provision.

## DeFi Mechanics
The protocol utilizes a factory-pair architecture inspired by Uniswap V2 logic but re-engineered for the Soroban environment. It operates using the constant product formula:
$$x \times y = k$$
This ensures that the product of the quantities of two assets in a liquidity pool remains constant, providing a price discovery mechanism without the need for an order book.

## On-Chain Architecture
Soroswap consists of a central Factory contract that manages the deployment of individual Pair contracts. Each Pair contract holds the reserves for a specific token pair. By leveraging Soroban's native 'Auth' framework, Soroswap ensures that liquidity providers can manage their positions securely while maintaining high capital efficiency on-chain.
