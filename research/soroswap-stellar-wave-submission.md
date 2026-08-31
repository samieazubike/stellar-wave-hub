# Soroswap — Stellar Wave Research Submission

## Project Selected

- **Project Name:** Soroswap
- **Wave source:** Stellar Wave Program
- **Domain:** DeFi / Automated Market Maker (AMM)
- **Website:** https://soroswap.finance
- **Repository:** https://github.com/soroswap
- **Documentation:** https://docs.soroswap.finance

## Why This Matches the Task

Soroswap is a pioneering Automated Market Maker (AMM) protocol and DEX aggregator built natively on the Stellar network's Soroban smart contract platform. The protocol brings standard AMM liquidity pool models to the Stellar ecosystem, proving the robustness and capabilities of Soroban smart contracts for complex DeFi primitives. Development is actively led by PaltaLabs and the project has consistently participated in the Stellar community and broader ecosystem programs.

## Original Description & Problem It Solves

Soroswap addresses the critical need for robust, decentralized liquidity and trading mechanisms on the Stellar network by leveraging Soroban smart contracts. While Stellar has had a native decentralized exchange (SDEX) featuring order books and an integrated AMM, Soroswap introduces a fully composable, smart contract-based AMM model inspired by Uniswap V2. 

The problem it solves is multifaceted: First, it allows developers to directly integrate liquidity pools into custom Soroban smart contracts without relying on Stellar classic operations, enabling truly programmable decentralized finance on the network. Second, it acts as a liquidity aggregator, finding the most optimal trading routes across various liquidity sources, including Soroswap’s own pools, Phoenix, Aqua, and the classic SDEX. This guarantees users receive the best available pricing when swapping tokens, reducing slippage and market fragmentation. By offering a unified interface and backend infrastructure for token swaps, Soroswap lowers the barrier to entry for users providing liquidity and developers building dApps, fundamentally enhancing the Stellar ecosystem's DeFi capabilities.

## Technical Approach & How It Uses Stellar

Soroswap is built using a system of immutable, non-upgradeable Soroban smart contracts, ensuring security and censorship resistance. Its architecture includes:
- **Factory Contract:** Manages the deployment of new liquidity pool (Pair) contracts.
- **Router Contract:** Handles the routing logic, calculating optimal trade paths and executing swaps safely.
- **Pair Contracts:** Hold token reserves and execute the core $x \times y = k$ pricing algorithm.

The protocol uniquely leverages Stellar's dual nature by supporting both classic Stellar Assets (wrapped as Soroban tokens) and newly minted Soroban-native tokens. It operates completely on-chain, relying on the high speed and low fees of the Stellar network to process trades in seconds.

## Team and Community

Soroswap is developed and maintained by **PaltaLabs**, a dedicated blockchain development team focused on the Stellar ecosystem. The project has a strong community presence across X (Twitter) and Discord, and provides extensive developer SDKs to encourage community integration.

## On-Chain Verification

Soroswap operates live on the Stellar Mainnet. Notable Soroban contract IDs include:
- **Factory Contract:** `CA4HEQTL2WPEUYKYKCDOHCDNIV4QHNJ7EL4J4NQ6VADP7SYHVRYZ7AW2`
- **Router Contract:** `CAG5LRYQ5JVEUI5TEID72EYOVX44TTUJT5BQR2J6J77FH65PCCFAJDDH`

## Category & Tags

- **Category:** DeFi
- **Tags:** `stellar`, `soroban`, `defi`, `amm`, `dex`, `smart-contracts`, `liquidity`

## Supporting Screenshots
- Architecture and Protocol flow available on [Soroswap Docs](https://docs.soroswap.finance).
- *For the purpose of this submission, screenshots of the Soroswap Swap Interface and Liquidity Pool deployment can be verified directly on soroswap.finance.*

## Submission Details

- **Research completed:** August 31, 2026
- **Project Status:** Active
- **Conclusion:** Meets all criteria for a Stellar Wave Program project.
