# Blend Protocol Research

## Project Name
Blend Protocol

## Original Description
Blend Protocol is a decentralized finance (DeFi) lending and borrowing platform built specifically for the Stellar network using Soroban smart contracts. Unlike traditional monolithic lending protocols that force all assets into a single shared risk pool, Blend introduces a permissionless, isolated lending pool architecture. This means anyone can create and deploy a custom lending market with specific assets, interest rate models, and oracle configurations, catering to both retail and institutional use cases without systemic contagion risk.

At its core, Blend addresses the critical need for robust, scalable financial infrastructure on Stellar. By leveraging Soroban's capabilities, it enables users to earn yield on their idle assets or borrow against collateral in a secure, decentralized manner. A standout feature of Blend's design is its mandatory "backstop module" for each pool. This module acts as an insurance fund seeded by pool creators, ensuring that lenders are protected against potential bad debt and insolvency events. If a pool suffers losses, the backstop automatically steps in to make suppliers whole, adding a significant layer of security compared to standard DeFi platforms.

Additionally, the protocol utilizes an algorithmic, reactive interest rate mechanism that dynamically adjusts borrowing costs based on real-time market utilization. This capital-efficient approach removes the need for slow governance votes to change rates, ensuring liquidity is optimized continuously. Overall, Blend serves as a foundational "DeFi primitive" on Stellar, bridging the gap between traditional finance (TradFi) institutions exploring blockchain and native Web3 users seeking yield generation and accessible credit.

## The Problem the Project Solves
Blend solves the lack of a secure, customizable, and risk-isolated lending infrastructure on the Stellar network. Traditional shared-pool lending models expose all users to the failure of a single volatile asset. Blend mitigates this by isolating risk per pool and requiring mandatory insurance (backstops), while providing a permissionless environment for creating tailored financial products.

## How the Project Uses Stellar
Blend is built entirely on Stellar's Soroban smart contract platform. It utilizes Soroban's speed, low fees, and security to execute complex financial logic such as collateral valuation, interest calculation, and liquidations. It also integrates seamlessly with Stellar-based assets, including stablecoins like USDC and native XLM, to drive on-chain liquidity.

## Its Technical Approach
The protocol is written in Rust, leveraging the Soroban SDK. Its architecture is modular, separating core pool logic, factory contracts, and backstop modules. Creators can spin up customized pools via the factory contract. The system uses reactive interest rate models to programmatically adjust rates based on utilization, and it relies on decentralized oracles (like those deployed on Soroban) for real-time asset pricing. A comprehensive test suite and an open-source TypeScript SDK (`@blend-capital/blend-sdk`) enable developers to integrate Blend into wallets and dApps easily.

## Team and Community Information
Blend Capital is the driving force behind the protocol, maintaining a strong open-source presence on GitHub. The community is active in the Stellar ecosystem, participating in hackathons and providing open infrastructure (like the Blend SDK and utilities) to help other developers build on Soroban.

## Verified Soroban Contract ID
`CD25MNVTZDL4Y3XBCPCJXGXATV5WUHHOWMYFF4YBEGU5FCPGMYTVG5JY` (Blend Core Soroban Contract)

## Category and Relevant Tags
**Category:** DeFi
**Tags:** Lending, Borrowing, Soroban, Smart Contracts, Yield, Financial Inclusion

## Supporting Screenshots
![Blend Protocol GitHub Org](https://github.com/blend-capital.png)

## Sources
- https://blend.capital/
- https://github.com/blend-capital/blend-contracts
- https://docs.blend.capital/
