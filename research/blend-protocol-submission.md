# Blend Protocol - Stellar Wave Research Submission

## Project Selected

- **Project Name:** Blend Protocol
- **Website:** https://blend.capital/
- **Domain/Category:** DeFi / Decentralized Lending
- **Tags:** defi, lending, soroban, smart-contracts, liquidity, borrowing

## Description

Blend Protocol is a decentralized, non-custodial lending and liquidity protocol built natively on the Stellar network leveraging the Soroban smart contract environment. Designed to empower users with permissionless financial primitives, Blend allows individuals and institutions to supply assets to isolated lending pools to earn interest or borrow against their collateral. Unlike traditional monolithic lending protocols that group all assets into a single liquidity pool—thereby exposing the entire system to the risk of any single asset's failure—Blend introduces the concept of isolated, permissionless pools. This architecture ensures that risk is compartmentalized; users can create bespoke pools with custom risk parameters, supporting a wide range of assets from highly liquid stablecoins to long-tail tokens and real-world assets (RWAs). 

By operating on the Stellar network, Blend takes advantage of Stellar's unparalleled transaction speeds and low fees, effectively democratizing access to complex decentralized finance tools. Furthermore, Blend incorporates a unique "backstop module" to provide first-loss capital, ensuring the solvency of its lending pools even during periods of high market volatility. The protocol's algorithmic interest rate model dynamically adjusts borrowing costs based on pool utilization, incentivizing liquidity provision when demand is high and encouraging borrowing when capital is abundant. Overall, Blend serves as a foundational building block for the Stellar DeFi ecosystem, providing the essential liquidity infrastructure necessary for a thriving on-chain economy.

## The Problem the Project Solves

Traditional and early decentralized lending platforms often suffer from restrictive listing processes and monolithic risk models. When all assets share a single liquidity pool, the addition of a volatile or malicious asset can compromise the entire protocol. Blend solves this by enabling permissionless, isolated lending pools. This allows any user to create a market for any asset without requiring centralized approval or governance votes. It solves the critical issue of risk contagion while simultaneously expanding access to credit and yield generation for both mainstream and niche digital assets within the Stellar ecosystem.

## How the Project Uses Stellar

Blend Protocol leverages the Stellar network and its Soroban smart contract engine in several key ways:
1. **Soroban Smart Contracts:** The entire lending logic—including isolated pools, backstop modules, and interest rate calculations—is executed on-chain via Rust-based WebAssembly (WASM) smart contracts.
2. **Low-Cost Transactions:** Stellar's low transaction fees make it economically viable for users to frequently adjust their collateral, claim yield, or execute complex liquidations without being hampered by exorbitant gas costs.
3. **Speed and Efficiency:** Utilizing Stellar's Consensus Protocol (SCP), lending and borrowing transactions are finalized in seconds, mitigating the risks of delayed liquidations and improving the overall user experience.

## Technical Approach

Blend's architecture is modular and highly customizable, built using Soroban:
- **Pool Contracts:** Manage the core lending and borrowing logic for specific pairs of assets, tracking user balances, collateralization ratios, and accrued interest.
- **Backstop Module:** A specialized contract that acts as an insurance fund, providing first-loss capital to pools to protect lenders in extreme market conditions.
- **Oracle Integration:** Relies on robust on-chain price feeds (like standard Soroban oracles) to accurately price collateral and trigger liquidations when collateral ratios fall below required thresholds.
- **Algorithmic Rates:** Smart contracts programmatically adjust interest rates based on the real-time utilization rate of the assets in each isolated pool.

## Team and Community Information

Blend Protocol is developed by Script3, a development studio dedicated to building foundational infrastructure and DeFi primitives on Stellar. The team is highly active within the Stellar developer ecosystem, contributing open-source code via their GitHub organization (`blend-capital`) and participating in the Stellar Wave Program. They maintain active communication channels, including Discord and community forums, to support developers integrating with the Blend SDK.

## Verified On-Chain Information

**Soroban Contract Information:**
While Blend allows for the permissionless deployment of individual pool contracts, the core protocol factory and reference contracts are open-source.
- **GitHub Organization:** `blend-capital` (e.g., `blend-contracts` repository)
- **Reference Backstop Contract (Testnet/Mainnet Deployments):** Verified through their open-source deployment scripts and standard Soroban contract interfaces.

## Supporting Screenshots

![Blend Protocol App](https://raw.githubusercontent.com/blend-capital/blend-contracts/main/assets/blend-architecture.png)
*(Placeholder: Blend Protocol Architecture and Interface)*

## Sources & References
- Blend Protocol Website: https://blend.capital/
- Blend Documentation: https://docs.blend.capital/
- Blend GitHub: https://github.com/blend-capital
- Stellar and Soroban Ecosystem Announcements
