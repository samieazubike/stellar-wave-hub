Project Name: Soroswap
Category: DeFi / DEX
Description: Soroswap.Finance is a cornerstone of the Soroban DeFi ecosystem, serving as a decentralized, non-custodial automated market maker (AMM) and liquidity aggregator built natively on Stellar’s smart contract platform. Developed by PaltaLabs, the protocol addresses the critical need for permissionless liquidity and efficient token swaps within the emerging Soroban landscape. Technically, it follows the proven constant product invariant formula (x * y = k), popularized by Uniswap V2, but optimized for the high-performance WebAssembly runtime of Soroban. This ensures that trades are executed deterministically and transparently, with a fixed 0.30% fee that directly rewards liquidity providers, thereby fostering a self-sustaining economic loop.

Beyond its core AMM functionality, Soroswap distinguishes itself through its advanced aggregation layer. This component intelligently routes trades across multiple liquidity dampening sources—including its own pools and the classic Stellar decentralized exchange—to minimize slippage and secure the best possible prices for users. By leveraging the modular nature of Soroban smart contracts, Soroswap provides a robust suite of developer tools and APIs, enabling other projects to integrate decentralized trading into their own applications. As a participant in the Stellar Wave/Drips Program, Soroswap continues to evolve through community-driven sprints, focusing on enhancing its router efficiency, expanding supported asset pairs, and maintaining a security-first approach through rigorous audits. Its role as a primary liquidity hub makes it an indispensable infrastructure piece for the broader Stellar ecosystem's growth.

Stellar Account ID / Contract ID: CA4HEQTL2WPEUYKYKCDOHCDNIV4QHNJ7EL4J4NQ6VADP7SYHVRYZ7AW2
Tags: stellar-wave, soroban, defi, dex, amm, liquidity, open-source
On-chain Activity Summary: Constant liquidity provision and swap transactions across 100+ pairs. The Factory contract manages pair deployment via Soroban's create_contract host function, records pair-to-token mappings, and emits events for every new pool created.
Technical Architecture Summary: Built on Soroban using Rust/WASM. Uses a Factory/Pair/Router architecture. The Factory is the authoritative registry for all pools, while the Router handles multi-hop pathfinding and interaction with the Stellar Classic DEX via the aggregator.
Why it matters in Stellar ecosystem: It is the first major native AMM on Soroban, providing the essential liquidity layer required for all other DeFi applications (lending protocols, stablecoins, and yield optimizers) to function efficiently on the new smart contract network.

SCREENSHOT REQUIREMENTS (DESCRIBE WHAT TO CAPTURE):
- On-chain transaction: A successful 'swap' or 'add_liquidity' transaction hash view on Stellar.expert involving the Soroswap Router.
- Contract verification: The 'Source Code' and 'Contract Info' tabs for the Factory Contract ID (CA4HEQTL2WPEUYKYKCDOHCDNIV4QHNJ7EL4J4NQ6VADP7SYHVRYZ7AW2) on Stellar.expert.
- Architecture or product UI: The primary Soroswap.finance swap interface showing a token pair selection and price impact calculation.
- Tokenomics (if available): The 'Liquidity Provider' documentation page highlighting the 0.30% fee distribution and liquidity mining incentives if active.
