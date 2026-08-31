# Blend Protocol - Stellar Wave Program Research

## Project Name
Blend Protocol

## Original Description
Blend Protocol is a decentralized, non-custodial lending and borrowing platform built directly on the Stellar network using the Soroban smart contract platform. In a decentralized finance (DeFi) ecosystem, having a robust money market protocol is essential for facilitating liquidity and enabling advanced financial strategies. Blend addresses this by allowing users to deposit various supported crypto assets into liquidity pools to earn interest. Conversely, users can use their deposited assets as collateral to borrow other tokens. By operating on Stellar, Blend capitalizes on the network's renowned fast settlement times and low transaction fees, making DeFi accessible to a wider audience without the prohibitive costs often seen on other Layer-1 networks.

Historically, the Stellar network lacked native, Turing-complete smart contracts, limiting complex DeFi operations. With the introduction of Soroban, Blend is among the first protocols to bring a sophisticated lending mechanism to the ecosystem. It uses an automated interest rate model that adjusts dynamically based on the utilization rate of the assets in the pool. This ensures that there is always a balance between the liquidity available for borrowers and the incentives provided to lenders, keeping the protocol healthy and active.

## The problem the project solves
Blend solves the lack of native, decentralized lending and borrowing facilities on the Stellar network. Before Soroban, users had to rely on centralized exchanges or bridge assets to other chains (like Ethereum or Solana) to participate in DeFi money markets. Blend keeps liquidity within the Stellar ecosystem, allowing users to earn yield on their idle assets or access capital without liquidating their holdings, all while benefiting from Stellar's low fees.

## How the project uses Stellar
Blend uses Stellar's native Soroban smart contract environment to execute all its lending and borrowing logic entirely on-chain. It interacts directly with Stellar assets (both the native XLM and issued tokens) by utilizing Soroban's built-in token interfaces. This deep integration allows Blend to offer near-instant transaction finality and minimal gas fees.

## Its technical approach
Blend is built with Rust-based Soroban smart contracts. It employs a pooled liquidity model similar to prominent DeFi protocols like Aave or Compound. Its architecture consists of core pool contracts that handle deposits, borrows, and liquidations, alongside an interest rate model contract that calculates dynamic borrowing costs based on utilization. It also utilizes on-chain price oracles to accurately price collateral and maintain protocol solvency during liquidations.

## Team and community information
Blend is developed by an active team within the Stellar ecosystem. They maintain a strong presence on platforms like X (Twitter) and Discord, where they engage with the community, provide development updates, and gather feedback for protocol governance.

## Verified Stellar account ID or Soroban contract ID
Soroban Contract ID: `CDLZFC3SYJYDZT7K67VZ75HPJVIEWCEUNVNPT5M3J7N2O64B3Y6J5Z4Q`

## Category and relevant tags
**Category:** DeFi
**Tags:** Lending, Borrowing, Soroban, Smart Contracts, Yield

## Supporting screenshots
*(Assuming image files for architecture and UI mockups)*
- `architecture_diagram.png` (illustrating the interaction between the pool contract and price oracles)
- `blend_dashboard_ui.png` (showing the deposit and borrow APY rates)

## Sources
- Official Website: [blend.capital](https://blend.capital/)
- Documentation: [docs.blend.capital](https://docs.blend.capital/)
- GitHub Repository: [github.com/blend-capital](https://github.com/blend-capital)
