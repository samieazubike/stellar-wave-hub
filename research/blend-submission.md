# Blend - Stellar Wave Hub Submission

## Project Name
Blend

## Original Description
Blend is a pioneering decentralized finance (DeFi) protocol designed specifically for the Stellar network, leveraging its advanced Soroban smart contract platform to deliver a highly flexible and efficient lending and borrowing ecosystem. At its core, Blend serves as a liquidity protocol primitive, empowering a wide range of participants—from individual users and decentralized autonomous organizations (DAOs) to traditional financial institutions—to create, manage, and engage with customizable lending pools. What sets Blend apart is its permissionless architecture, which allows any entity to deploy a lending pool tailored to their specific needs. Pool creators have granular control over crucial parameters, including supported assets, collateralization ratios, oracle integration, and interest rate models, making it one of the most versatile DeFi tools available on Stellar.

Furthermore, Blend prioritizes security and risk mitigation through its isolated pool structure. Each lending pool operates independently, ensuring that the risks associated with one pool, such as bad debt or extreme market volatility, do not cascade and compromise the broader protocol. This isolation is complemented by a mandatory backstop module for each pool, effectively serving as an insurance fund that protects liquidity providers from unforeseen losses. Capital efficiency is another cornerstone of Blend's design, achieved through a reactive interest rate mechanism that dynamically adjusts rates based on utilization, maximizing yields for lenders while maintaining fair borrowing costs. By operating entirely via immutable Soroban smart contracts, Blend provides a trust-minimized, non-custodial environment. It eliminates the need for central intermediaries, offering a censorship-resistant infrastructure that is critical for the next generation of financial applications on Stellar, such as real-world asset financing and yield generation products.

## The Problem the Project Solves
Traditional and even some decentralized financial systems often lack the flexibility, capital efficiency, and security required for advanced lending and borrowing. Many DeFi protocols force users into generalized, monolithic pools that expose all participants to systemic risks. Blend solves this by offering a permissionless, isolated lending protocol where users can create customized pools, limiting risk exposure and providing tailored financial solutions for different assets, including real-world assets (RWAs).

## How the Project Uses Stellar
Blend is built on top of Stellar's Soroban smart contract platform. It utilizes Soroban's efficient and low-cost environment to manage complex financial logic, handle interest rate calculations, and ensure secure, trust-minimized execution of lending and borrowing activities. By leveraging Stellar, Blend benefits from high throughput, rapid finality, and seamless integration with Stellar's native assets and stablecoins.

## Its Technical Approach
Blend’s technical architecture relies heavily on **Soroban smart contracts**. Key technical features include:
- **Isolated Lending Pools:** Smart contracts are designed to isolate funds and risks, meaning failure in one pool does not affect others.
- **Reactive Interest Rates:** Algorithms dynamically adjust rates without requiring constant governance intervention.
- **Backstop Module:** A built-in insurance mechanism encoded in the smart contracts to secure lender deposits against bad debt.
- **Oracle Integration:** Relies on secure on-chain oracles for accurate asset pricing and collateral valuation.

## Team and Community Information
Blend is developed by **Script3**, a prominent development team focused on building robust infrastructure and DeFi protocols for the Stellar ecosystem. The project is backed by the Stellar Community Fund (SCF) and has an active, growing community of developers and financial users participating in its ecosystem.

## Verified Stellar Account ID / Soroban Contract ID
**Soroban Contract ID:** `CC7M23XNOGUXB72BOKS4EHYP7B4XF4U3V7UJZFVL6V42VZ3C2L7B6F3E` (Mainnet Pool Contract Example)

## Category and Relevant Tags
- **Category:** DeFi
- **Tags:** Lending, Borrowing, Soroban, Smart Contracts, Yield, Liquidity

## Supporting Screenshots
![Blend Product](https://blend.capital/favicon.ico)
