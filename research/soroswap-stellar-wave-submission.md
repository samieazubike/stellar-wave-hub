# Soroswap - Stellar Wave Research Submission

## Project Selected

- **Project:** Soroswap
- **Wave source:** Approved in the Stellar Wave Program
- **Category:** DeFi
- **Website:** https://soroswap.finance/
- **Repository:** https://github.com/soroswap
- **Network:** Stellar Mainnet / Soroban

## Eligibility And Duplicate Check

Soroswap is an active ecosystem project in the Stellar Wave Program. A Hub search for `Soroswap` returned no projects, meaning it has not been previously listed on Stellar Wave Hub.

## What Soroswap Does

Soroswap is an open-source Automated Market Maker (AMM) protocol and decentralized exchange (DEX) aggregator built specifically on Soroban, the smart contract platform on the Stellar network. The core problem that Soroswap aims to solve is providing a reliable, fully decentralized, and seamless mechanism for trading digital assets natively on the Stellar blockchain without relying on centralized intermediaries or off-chain order books. By bringing the standard AMM model to the Soroban ecosystem, Soroswap enables permissionless liquidity provision and token swapping, facilitating deeper liquidity and robust price discovery for the burgeoning Stellar DeFi landscape.

At a technical level, Soroswap’s architecture is inspired by established AMM models, utilizing a non-upgradeable factory-and-pair smart contract system. The `SoroswapFactory` contract serves as the central hub, deploying individual, immutable Pair contracts for specific token pairings. Each of these Pair contracts strictly manages a liquidity pool and enforces the constant-product formula (x * y = k) to price assets and execute trades. 

Additionally, Soroswap goes beyond standard liquidity pools by providing an advanced Aggregator System. This aggregator queries various liquidity sources (like Soroswap itself, Aqua, and Phoenix) and routes trades intelligently to secure the most favorable exchange rates for users with minimal slippage. The protocol is completely open-source and provides extensive SDKs, allowing other developers to easily integrate swapping or liquidity provisioning functionalities into their own Soroban dApps. Built and maintained by PaltaLabs, the project demonstrates significant technical maturity and actively supports the Stellar community by expanding foundational DeFi infrastructure.

## On-Chain Verification

Soroswap's contracts are deployed on the Stellar Mainnet via Soroban. Instead of a single monolithic contract, Soroswap uses a factory system where the factory generates dynamic ID pairs for trading. 

- **SoroswapFactory Contract:** `CA4HEQTL2WPEUYKYKCDOHCDNIV4QHNJ7EL4J4NQ6VADP7SYHVRYZ7AW2`
- **SoroswapRouter Contract:** `CAG5LRYQ5JVEUI5TEID72EYOVX44TTUJT5BQR2J6J77FH65PCCFAJDDH`

The factory and router are verifiable on Stellar network explorers (like Stellar.Expert) where active liquidity provisioning and trading operations take place.

## Suggested Hub Submission

- **Name:** Soroswap
- **Category:** DeFi
- **Network:** Mainnet
- **Tags:** `defi, amm, dex, soroban, liquidity, aggregator, stellar-wave`
- **Website:** https://soroswap.finance/
- **GitHub repository:** https://github.com/soroswap
- **Soroban Contract ID:** `CA4HEQTL2WPEUYKYKCDOHCDNIV4QHNJ7EL4J4NQ6VADP7SYHVRYZ7AW2`

## Sources

1. [Soroswap Finance Official Site](https://soroswap.finance/)
2. [Soroswap GitHub Repository](https://github.com/soroswap)
3. [Stellar Expert - Factory Contract Explorer](https://stellar.expert/explorer/public/contract/CA4HEQTL2WPEUYKYKCDOHCDNIV4QHNJ7EL4J4NQ6VADP7SYHVRYZ7AW2)
