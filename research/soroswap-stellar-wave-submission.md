# Soroswap — Stellar Wave Research Submission

## Project Selected

- **Project:** Soroswap
- **Domain:** DeFi / Automated Market Maker (AMM)
- **Website:** https://soroswap.finance/
- **Repository:** https://github.com/soroswap
- **Documentation:** https://docs.soroswap.finance/

## Why This Matches the Task

Soroswap is a foundational piece of infrastructure for the Soroban ecosystem. As an automated market maker and decentralized exchange, it plays a vital role in providing liquidity and trading functionality to the Stellar network. It has not been previously submitted to the Stellar Wave Hub and satisfies all criteria for a well-documented, verifiable project within the Stellar DeFi landscape.

## Verifiable On-Chain IDs

- **SoroswapFactory Contract (Mainnet):** `CA4HEQTL2WPEUYKYKCDOHCDNIV4QHNJ7EL4J4NQ6VADP7SYHVRYZ7AW2`
- **SoroswapRouter Contract (Mainnet):** `CAG5LRYQ5JVEUI5TEID72EYOVX44TTUJT5BQR2J6J77FH65PCCFAJDDH`

Verification endpoint:
- Factory: `https://stellar.expert/explorer/public/contract/CA4HEQTL2WPEUYKYKCDOHCDNIV4QHNJ7EL4J4NQ6VADP7SYHVRYZ7AW2`
- Router: `https://stellar.expert/explorer/public/contract/CAG5LRYQ5JVEUI5TEID72EYOVX44TTUJT5BQR2J6J77FH65PCCFAJDDH`

## What Soroswap Does

Soroswap.Finance is a decentralized exchange (DEX) and automated market maker (AMM) built entirely on Soroban, Stellar’s native smart contracts platform. It allows users to swap Stellar-based assets, provide liquidity to earn yield from trading fees, and developers to integrate swap functionalities natively into their applications.

The problem it solves is the friction associated with decentralized trading and liquidity provision in the rapidly growing Soroban ecosystem. Before AMMs like Soroswap, traditional order book DEXs required active market making, which can be capital inefficient and difficult for average users to participate in. Soroswap standardizes the AMM experience on Stellar, mirroring the constant product market maker model popularized by Uniswap V2, but specifically tailored to the performance and fast finality of the Stellar network.

## Technical Architecture (Detailed)

Soroswap’s architecture consists of several core Soroban smart contracts interacting together:

### 1. Smart Contract Layer (Rust / Soroban)

- **Factory Contract:** This contract is responsible for deploying new Pair contracts. Whenever a new trading pair is created (e.g., XLM/USDC), the Factory deploys a unique contract for that specific pair. It also tracks all created pairs, serving as an on-chain registry for the protocol's liquidity pools.
- **Router Contract:** The Router acts as the primary interface for users interacting with the protocol. It handles the logic for safely adding or removing liquidity and swapping tokens. It automatically calculates optimal routing if a direct swap pair doesn't exist, moving funds across multiple pairs behind the scenes.
- **Pair Contracts:** These contracts hold the actual liquidity and manage the token balances using the $x \cdot y = k$ invariant equation. They also mint and burn LP (Liquidity Provider) tokens representing a user's share of the pool.

### 2. Frontend Layer
The application provides a sleek, user-friendly frontend enabling wallet connections via popular Stellar wallets like Freighter, allowing users to seamlessly interact with the smart contracts to swap tokens or provide liquidity.

## Stellar Integration

Soroswap uses Stellar natively by building entirely on Soroban. All trading operations, liquidity pools, and protocol logic exist on-chain via Soroban smart contracts. This allows Soroswap to benefit from Stellar's low transaction fees, fast finality, and robust security model.

## Community & Ecosystem

- **Developers:** Developed by PaltaLabs. Key contributors include esteblock, devmonsterblock, and coderipperxyz.
- **Ecosystem Role:** Soroswap serves as a crucial building block (money lego) for other DeFi protocols on Soroban, enabling them to permissionlessly access liquidity.
- **Support:** Has received support from the Stellar Development Foundation (SDF) and is actively integrated into the broader Stellar DeFi ecosystem.

## Submission Performed

- **Hub Endpoint:** `https://usestellarwavehub.vercel.app/api/projects`
- **Category:** `DeFi`
- **Tags:** `amm, dex, soroban, defi, liquidity, trading, stellar, paltaLabs, smart-contracts`
- **Screenshots:** Screenshots of the UI and Stellar Expert contract verification were included in the web form submission.
