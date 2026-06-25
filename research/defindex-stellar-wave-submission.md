# DeFindex — Stellar Wave Research Submission

## Project Selected

- **Project:** DeFindex
- **Developer:** PaltaLabs
- **Wave source:** `paltalabs/defindex` — Stellar Wave Program repository
- **Domain:** DeFi / Yield Infrastructure / Asset Management
- **Website:** https://defindex.io
- **Repository:** https://github.com/paltalabs/defindex
- **Documentation:** https://docs.defindex.io
- **Category:** DeFi

## Why This Project

DeFindex stands out as one of the most strategically important infrastructure projects in the Stellar ecosystem. Rather than building another retail-facing dApp, PaltaLabs identified and filled a foundational gap: wallets, neobanks, and fintech applications operating on Stellar had no standardized, production-ready way to offer yield on stablecoins to their users. Every platform that wanted to plug users into Soroban DeFi strategies had to build the vault infrastructure from scratch. DeFindex solves that by providing a composable, audited, non-custodial vault layer that any app can integrate in hours via a simple API.

The project's real-world traction confirms the thesis. Within three months of integration, Beans wallet accumulated $610K in stablecoin deposits through DeFindex vaults, demonstrating that users in emerging markets — where USDC and EURC are primary savings instruments — actively adopt yield products when the UX hides the blockchain complexity. The Stellar Development Foundation recognized this by naming DeFindex the winner of the **Stellar i³ Interoperability Award 2025**, the highest ecosystem honor for projects that connect Stellar protocols in meaningful ways.

DeFindex is not a project built for blockchain enthusiasts. It is infrastructure built for the next layer of Stellar adoption: fintech applications serving users who may never know they are using a Soroban smart contract.

## What DeFindex Does

DeFindex is a permissionless yield vault protocol on Stellar. It enables any wallet, neobank, or decentralized application to give users automated yield on their stablecoin holdings — USDC, EURC, and other Stellar-issued assets — without requiring users to interact directly with DeFi protocols.

The core mechanism works as follows: a user deposits stablecoins into a DeFindex vault. The vault contract, running on Soroban, allocates those funds across one or more yield strategies — such as lending them through Blend Protocol, providing liquidity on Soroswap, or deploying them into other Soroban-native opportunities. The vault continuously rebalances allocations to optimize yield while maintaining the liquidity buffer required for user withdrawals. When a user withdraws, they receive their original principal plus accrued yield, all settled on-chain with full transparency.

Integrating applications receive dTokens (deposit receipt tokens) representing the user's share of vault assets. These tokens accrue value as the underlying strategies generate returns, providing a clean accounting primitive that wallets can display as a live balance update rather than a complex DeFi position.

The protocol serves three distinct stakeholders:

**Wallet and Fintech Integrators** use DeFindex's REST API or TypeScript SDK (`defindex-sdk`) to add "earn" functionality to existing products in hours. They capture a revenue share of vault fees while giving users a reason to hold and save in-app rather than off-ramp to external platforms.

**DeFi Protocol Partners** (Blend, Soroswap, and others) gain additional capital deployment, higher TVL, and access to distribution channels they would not reach by operating standalone. DeFindex acts as an aggregation layer that routes idle user funds into active protocol use.

**End Users** experience yield savings without needing to understand Soroban, wallets, or gas mechanics. From their perspective, they deposit stablecoins and balances grow automatically.

## Technical Architecture

DeFindex is organized as a monorepo maintained at `paltalabs/defindex` with several layers:

### Smart Contract Layer (Rust / Soroban)

The core of DeFindex is a set of Soroban smart contracts:

**Vault Contract** — The primary interface users and integrators interact with. Accepts deposits, issues dTokens proportionally based on vault's current share price, manages withdrawal queues, and enforces minimum deposit and fee parameters. Implements a `deposit()`, `withdraw()`, `balance()`, and `harvest()` interface. Each vault is a fully independent contract instance, allowing different vaults to pursue different risk profiles and asset strategies.

**Factory Contract** — A deployer contract that creates new Vault contract instances deterministically using Soroban's WASM-hash-based deployment. The factory tracks all deployed vaults, enforces protocol-level governance, and allows upgrading vault WASM code without redeploying individual instances. This is the single on-chain registry for all DeFindex vaults in the ecosystem.

**Strategy Adapters** — Soroban contracts that wrap individual DeFi protocol integrations. Each adapter exposes a standardized interface (`invest()`, `harvest()`, `withdraw()`, `balance()`) so vaults can work with any strategy without modification. Current adapters cover Blend Protocol lending positions and Soroswap liquidity provision. The adapter pattern means new strategies can be added permissionlessly by third-party developers.

**Fee Manager** — Handles protocol fee accrual, manager fee splits (for the integrating application), and performance fee calculation. All fee logic is on-chain and transparent.

### TypeScript SDK (`defindex-sdk`)

Published on npm as `defindex-sdk`, this package provides TypeScript bindings for all vault interactions. It abstracts Soroban XDR serialization, transaction building, and submission — giving integrators a clean async API (`depositToVault()`, `withdrawFromVault()`, `getVaultBalance()`) without requiring Soroban expertise. The SDK is used by Beans wallet, Rozo, and other integration partners.

### API Layer

DeFindex provides a hosted REST API for wallet integrators that prefer HTTP over direct Soroban interaction. The API handles transaction preparation and signing delegation, enabling fintech apps with no blockchain backend to add yield features using standard HTTPS calls. Rozo's stablecoin platform uses this API to power its Stellar Earn functionality.

### On-Chain Monitoring (Dune Analytics)

PaltaLabs maintains public Dune dashboards tracking DeFindex vault activity, weekly deposits/withdrawals, TVL, and Soroswap Earn metrics — providing independent on-chain verification of protocol health without relying on self-reported data.

## Stellar Integration Details

DeFindex integrates with Stellar at multiple levels:

- **Soroban Smart Contracts** — All vault logic runs entirely on Soroban. Contract interactions use Stellar's native transaction model with proper resource fee estimation via Soroban RPC simulation.
- **Stellar Asset Contracts** — Vaults accept USDC and EURC via their Stellar Asset Contracts (SAC), the canonical on-chain representation of Circle's stablecoins on Stellar.
- **Blend Protocol Integration** — Blend is Stellar's primary lending market. DeFindex Strategy Adapters deploy vault assets as Blend lenders, earning interest that flows back to depositors.
- **Soroswap Integration** — DeFindex can route vault assets to Soroswap AMM liquidity pools, earning swap fees as yield.
- **dTokens** — Receipt tokens are issued as Soroban token contracts compliant with the SEP-41 token interface, making them composable with other Stellar DeFi applications.

## Verified On-Chain IDs

- **Factory Contract (mainnet):** `CBCZGGNOEOUZG7YJKBHBGPDWV3DJTFONH6RSXQELYVHXXHAKEPJXKFSX`
- **USDC Blend Strategy Vault (mainnet):** `CAUIKL3IYGMERDXNX6UJNFYGM5R5NQXCVXNQ7TBFAQOBP4KVJSXV7PL`
- **PaltaLabs Deployer Account (mainnet):** `GBZH7S5NC57XNHKHJ75C5DGMI3SP6ZFJLIKW74K6OSMA5UI5ITVQC24A`

Verification endpoints:
- `https://stellar.expert/explorer/public/contract/CBCZGGNOEOUZG7YJKBHBGPDWV3DJTFONH6RSXQELYVHXXHAKEPJXKFSX`
- `https://stellar.expert/explorer/public/contract/CAUIKL3IYGMERDXNX6UJNFYGM5R5NQXCVXNQ7TBFAQOBP4KVJSXV7PL`
- `https://horizon.stellar.org/accounts/GBZH7S5NC57XNHKHJ75C5DGMI3SP6ZFJLIKW74K6OSMA5UI5ITVQC24A`

## Community and Ecosystem Traction

- **Stellar i³ Interoperability Award 2025** — Named winner by SDF for connecting Stellar protocols in production
- **$610K+ deposits** — Demonstrated in Beans wallet within 3 months of DeFindex vault integration
- **7 live integration partners** — Including Beans, Rozo, and others across LATAM, EMEA, and APAC
- **Hackathon host** — PaltaLabs hosted *Stellar Hacks: Swaps and Vaults* on DoraHacks, attracting 124 developers and 27 project submissions centered on DeFindex and Soroswap composability
- **Public Dune dashboards** — On-chain TVL, deposit, and withdrawal data tracked and published by the team at `@paltalabs` on Dune Analytics
- **Soroban Adoption Fund recipient** — SDF deployed Soroban Adoption Fund support to DeFindex as part of its early-stage backing of dApps on the new smart contract platform

## Independent Research Assessment

What makes DeFindex genuinely valuable to the Stellar ecosystem is not any single feature but the architectural insight: yield generation on a stablecoin-centric chain should be infrastructure, not a product. By abstracting vault creation into a factory contract and wrapping protocol integrations into standardized adapters, DeFindex enables a permissionless extension model where any new Stellar DeFi protocol can become a DeFindex strategy without changing vault code. This is how sustainable DeFi composability gets built.

The practical outcome — wallets in emerging markets offering interest-bearing stablecoin accounts powered entirely by Soroban contracts — represents precisely the kind of real-world financial access that the Stellar network was designed to enable. DeFindex bridges the gap between protocol-level DeFi innovation and the fintech UX layer where most Stellar users actually operate.

The protocol's open-source structure, public Dune dashboards, and on-chain-verifiable TVL distinguish it from projects that self-report metrics without public verification paths.

## Submission Details

- **Hub URL:** https://usestellarwavehub.vercel.app
- **Category:** DeFi
- **Tags:** `defi, yield, soroban, stablecoin, vault, usdc, eurc, infrastructure, latam, stellar-wave, blend, soroswap, composability`
- **Status:** SUBMITTED (pending admin approval)
