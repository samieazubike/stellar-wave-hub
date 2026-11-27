# Research: DeFindex

## Project Name

DeFindex

## Category

DeFi

## Tags

soroban, defi, yield-aggregation, vaults, strategies, blend, stellar, sdk, infrastructure, rwa

## Links

- **Official Website:** https://www.defindex.io
- **Documentation:** https://docs.defindex.io
- **GitHub Repository:** https://github.com/paltalabs/defindex
- **Builder / Organization:** https://paltalabs.io (PaltaLabs)
- **X (Twitter):** https://x.com/defindex_
- **Discord:** https://discord.gg/3RgnFX4meG
- **Stellar Wave Program:** https://www.drips.network/wave/stellar (DeFindex adapters & Soroban contract bindings are part of active Stellar Wave contribution cycles)

## Verified Stellar / Soroban Identifiers

All contract IDs below are sourced directly from the official DeFindex mainnet deployment manifest (`public/mainnet.contracts.json` in `paltalabs/defindex`) and can be inspected on Stellar.Expert:

| Contract | Mainnet Soroban Contract ID | Explorer Link |
| --- | --- | --- |
| **DeFindex Factory** | `CDKFHFJIET3A73A2YN4KV7NSV32S6YGQMUFH3DNJXLBWL4SKEGVRNFKI` | [Stellar.Expert](https://stellar.expert/explorer/public/contract/CDKFHFJIET3A73A2YN4KV7NSV32S6YGQMUFH3DNJXLBWL4SKEGVRNFKI) |
| **USDC Blend Auto-Compound Fixed Strategy** | `CDB2WMKQQNVZMEBY7Q7GZ5C7E7IAFSNMZ7GGVD6WKTCEWK7XOIAVZSAP` | [Stellar.Expert](https://stellar.expert/explorer/public/contract/CDB2WMKQQNVZMEBY7Q7GZ5C7E7IAFSNMZ7GGVD6WKTCEWK7XOIAVZSAP) |
| **EURC Blend Auto-Compound Fixed Strategy** | `CC5CE6MWISDXT3MLNQ7R3FVILFVFEIH3COWGH45GJKL6BD2ZHF7F7JVI` | [Stellar.Expert](https://stellar.expert/explorer/public/contract/CC5CE6MWISDXT3MLNQ7R3FVILFVFEIH3COWGH45GJKL6BD2ZHF7F7JVI) |
| **XLM Blend Auto-Compound Fixed Strategy** | `CDPWNUW7UMCSVO36VAJSQHQECISPJLCVPDASKHRC5SEROAAZDUQ5DG2Z` | [Stellar.Expert](https://stellar.expert/explorer/public/contract/CDPWNUW7UMCSVO36VAJSQHQECISPJLCVPDASKHRC5SEROAAZDUQ5DG2Z) |
| **USDC Blend Auto-Compound Etherfuse Strategy** | `CCBTSHPUVNKCT5V675AAVYNANHXBU26PTZK2QLS7ZLFNYRJZT5HW3VL6` | [Stellar.Expert](https://stellar.expert/explorer/public/contract/CCBTSHPUVNKCT5V675AAVYNANHXBU26PTZK2QLS7ZLFNYRJZT5HW3VL6) |
| **CETES Blend Auto-Compound Etherfuse Strategy** | `CAZ3LLLKPWEOVK6K4G5NCQ2VXWABLFIPKKNMN5GLKMZKEN7JSKTEMIKN` | [Stellar.Expert](https://stellar.expert/explorer/public/contract/CAZ3LLLKPWEOVK6K4G5NCQ2VXWABLFIPKKNMN5GLKMZKEN7JSKTEMIKN) |
| **USTRY Blend Auto-Compound Etherfuse Strategy** | `CA3SO5RRKOONAPWVR5XY6CMOYZGN4M4QKVIGX5DFRIIJUJW2SFSELBXL` | [Stellar.Expert](https://stellar.expert/explorer/public/contract/CA3SO5RRKOONAPWVR5XY6CMOYZGN4M4QKVIGX5DFRIIJUJW2SFSELBXL) |
| **Tesouro Blend Auto-Compound Etherfuse Strategy** | `CDSCVJHJWUZQMR64FVK3XMND5NKSN7Z23KPRCHKFHVGOEJBWPVH5B5XA` | [Stellar.Expert](https://stellar.expert/explorer/public/contract/CDSCVJHJWUZQMR64FVK3XMND5NKSN7Z23KPRCHKFHVGOEJBWPVH5B5XA) |

## Original Description

DeFindex is a decentralized yield-aggregation and automated capital-management infrastructure built natively on Stellar's Soroban smart contract platform by PaltaLabs. Rather than functioning solely as a retail-facing DeFi dashboard, DeFindex is engineered as composable vault infrastructure that enables wallets, fintech applications, neobanks, and DAOs to embed interest-bearing digital asset balances—such as USDC, EURC, XLM, and tokenized real-world assets (RWAs) like CETES, USTRY, and Tesouro—directly into their products without designing, auditing, or maintaining bespoke DeFi integrations in-house.

At its core, DeFindex separates user-facing accounting (**Vaults**) from protocol-specific execution (**Strategies**). When a user or integrator deposits funds into a DeFindex vault, the contract mints proportional internal share tokens (`dfTokens`). Instead of distributing yield via periodic token emissions or rebasing, accrued returns from underlying lending markets and auto-compounding pools increase the total asset value held by the vault, causing the redemption rate of each `dfToken` to appreciate organically over time.

Each vault is initialized with a fixed, auditable set of approved strategy contracts and maintains an intentional idle liquidity buffer to support instant, low-cost withdrawals with no lock-up periods. Underlying strategies—such as Blend Protocol lending pools and Etherfuse RWA auto-compounders—are isolated behind a uniform Soroban trait (`DeFindexStrategyTrait`), allowing vault managers to rebalance allocations and harvest rewards safely while keeping risk boundaries explicit.

## The Problem It Solves

Integrating on-chain yield into consumer wallets, regional neobanks, and payment applications on Stellar traditionally requires teams to build custom smart contract adapters for every lending market, liquidity pool, or RWA protocol, continuously monitor exchange rates, handle reward harvesting and compounding, and pay for repeated security audits. This operational and security burden slows down adoption of DeFi yields in everyday financial products. DeFindex solves this by packaging multi-strategy yield routing, share accounting, and automated compounding into audited, standardized Soroban vaults accessible through a unified SDK and API layer.

## How It Uses Stellar

- **Soroban Smart Contracts (Rust):** The factory, vault contracts, and strategy adapters are implemented in Rust and deployed on Stellar Mainnet using Soroban's ledger storage model (instance, persistent, and temporary storage) with explicit TTL rent management.
- **Stellar Asset Contract (SAC) Compatibility:** Vaults natively support Stellar-issued assets including USDC, EURC, XLM, and Etherfuse tokenized sovereign debt assets (CETES, USTRY, Tesouro) via Soroban's SAC interface.
- **Native Ecosystem Composability:** Mainnet strategies directly compose with Stellar-native DeFi protocols such as Blend Protocol for lending and auto-compounding, leveraging Stellar's ~5-second finality and sub-cent transaction fees to make frequent harvesting and rebalancing economically viable.

## Technical Approach

- **Factory-Vault-Strategy Separation:** The `defindex_factory` contract deploys standardized vaults with immutable strategy allowlists configured at initialization, preventing unauthorized runtime injection of untrusted yield sources.
- **Standardized Strategy Interface (`DeFindexStrategyTrait`):** Every strategy contract implements six canonical methods—`__constructor`, `asset`, `deposit`, `withdraw`, `harvest`, and `balance`—and is required to report balances denominated strictly in the underlying asset rather than protocol-specific receipt tokens (such as bTokens or LP shares), ensuring accurate `dfToken` share pricing.
- **Idle Liquidity Buffer & Zero Lock-ups:** Vaults retain a configurable portion of idle capital to serve immediate withdrawals without forcing expensive strategy unwinds on every redemption.
- **SDK & Typed Contract Bindings:** Partner applications integrate via the DeFindex SDK/API, which handles Soroban RPC simulation, transaction payload construction, and typed contract bindings to prevent ABI drift.
- **Security & Auditing:** Core smart contracts undergo independent third-party security audits (including reviews by OtterSec) prior to mainnet deployment.

## Team & Community

- **Builder:** PaltaLabs (also the core team behind Soroswap on Stellar/Soroban)
- **Founder:** Esteban Iglesias
- **Core Contributors:** Francisco and the PaltaLabs engineering team
- **Community Channels:** X (`@defindex_`), Discord (`discord.gg/3RgnFX4meG`), and open-source collaboration on GitHub (`github.com/paltalabs/defindex`).

## Hub Duplicate Check

Before researching and preparing this submission, Stellar Wave Hub (`https://usestellarwavehub.vercel.app`) was searched across all 36 listed projects (3 pages on `/explore` and `/queue`). **DeFindex** is not currently listed on Stellar Wave Hub.

## Sources

1. DeFindex GitHub Repository & Mainnet Deployment Manifest (`public/mainnet.contracts.json`): https://github.com/paltalabs/defindex
2. DeFindex Official Website & Documentation: https://www.defindex.io / https://docs.defindex.io
3. PaltaLabs: https://paltalabs.io
4. Stellar Wave Program (Drips Network): https://www.drips.network/wave/stellar
5. Stellar.Expert Mainnet Contract Explorer: https://stellar.expert/explorer/public/contract/CDKFHFJIET3A73A2YN4KV7NSV32S6YGQMUFH3DNJXLBWL4SKEGVRNFKI
