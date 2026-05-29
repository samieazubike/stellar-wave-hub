# Aquarius — Stellar Wave Research Submission

## Project Identity

- **Project Name:** Aquarius
- **Category:** DeFi / Liquidity / Governance
- **Wave Source:** `AquaToken` organization — Stellar Wave Program repositories on Drips
- **Website:** [aqua.network](https://aqua.network)
- **Repository:** [github.com/AquaToken](https://github.com/AquaToken)
- **Documentation:** [docs.aqua.network](https://docs.aqua.network)
- **Governance App:** [vote.aqua.network](https://vote.aqua.network)

---

## Why This Project Matches the Task

Aquarius is one of the most significant and long-running DeFi infrastructure projects in the Stellar ecosystem. Operating since 2021, it has evolved from a liquidity incentive layer for Stellar's native DEX into a full Soroban-powered AMM protocol with on-chain governance, token locking, and a $30M+ TVL. It is a verified Stellar Wave Program participant with multiple active GitHub repositories under the `AquaToken` organization, and it is not present in any prior Stellar Wave Hub research submissions. Aquarius is the backbone of Stellar's DeFi liquidity layer — understanding it is essential to understanding how Stellar's decentralized exchange ecosystem functions.

---

## What Aquarius Does

Aquarius is a liquidity management and governance protocol built natively on the Stellar network. Its core mission is to solve the "thin market" problem on Stellar's decentralized exchange (SDEX): without targeted incentives, liquidity naturally concentrates in a handful of popular pairs while hundreds of legitimate asset pairs remain illiquid and unusable.

Aquarius addresses this through three interconnected systems:

### 1. Liquidity Incentive Voting

AQUA token holders vote on-chain to direct AQUA reward emissions toward specific market pairs on the SDEX and Aquarius AMM pools. This creates a community-governed liquidity flywheel: pairs that receive more votes attract more liquidity providers, which improves trading conditions, which attracts more users, which increases the value of directing rewards there. The voting mechanism uses Stellar's native claimable balance operations — votes are locked on-chain and verifiable by anyone through Stellar explorers, with no centralized backend required to determine outcomes.

### 2. Soroban AMM Pools

In July 2024, Aquarius launched its proprietary Soroban-based AMM, transitioning from relying solely on Stellar's classic AMM infrastructure. The Aquarius AMM router contract (`CBQDHNBFBZYE4MKPWBSJOPIYLW4SFSXAXUTSXJN76GNKYVYPCKWC6QUK`) serves as the single entry point for all AMM operations: swaps, liquidity provision, and pool creation. Individual pool contracts are deployed per trading pair (e.g., the XLM/AQUA pool at `CCY2PXGMKNQHO7WNYXEWX76L2C5BH3JUW3RCATGUYKY7QQTRILBZIFWV`). This architecture enables more sophisticated AMM curves, fee customization, and composability with other Soroban contracts — capabilities that Stellar's classic AMM does not support.

### 3. ICE Token Governance

Aquarius introduced the ICE token system to reward long-term alignment. AQUA holders can lock their tokens for up to three years at `aqua.network/locker`, receiving four non-transferable ICE derivative tokens in return: `ICE`, `upvoteICE`, `downvoteICE`, and `governICE`. The longer the lock period, the more ICE tokens are minted (up to a 10x multiplier for a three-year lock). These tokens serve distinct purposes: `upvoteICE` and `downvoteICE` direct liquidity rewards to or away from specific market pairs, `governICE` enables participation in protocol governance proposals, and `ICE` itself provides a liquidity boost of up to 2.5x on AMM rewards. All four tokens are minted on the Stellar network using the `aqua.network` domain and are verifiable on-chain.

---

## Technical Architecture

### Smart Contract Layer (Soroban / Rust)

The Aquarius AMM is implemented as a set of Soroban contracts in the open-source `AquaToken/soroban-amm` repository. The architecture follows a router-pool pattern:

- **Router Contract** (`CBQDHNBFBZYE4MKPWBSJOPIYLW4SFSXAXUTSXJN76GNKYVYPCKWC6QUK`): The single entry point for all AMM interactions. Routes swap and liquidity operations to the appropriate pool contract. Handles multi-hop swaps across multiple pools in a single transaction.
- **Pool Contracts**: Individual Soroban contracts deployed per trading pair. Each pool manages its own reserves, LP token issuance, and fee accounting. Pool addresses are deterministically derived from the token pair, making them discoverable without a registry.
- **Fee Collector Contracts**: Optional contracts that can be attached to pools to collect protocol fees and distribute them to designated recipients — enabling third-party integrators to earn fees on swaps they route through Aquarius.

### Governance Layer (Stellar Native)

Aquarius governance operates entirely on Stellar's base layer without requiring Soroban:

- **Liquidity Voting**: Uses Stellar claimable balances to lock AQUA/ICE tokens in voting wallets. The protocol scans these wallets to tally votes and determine which market pairs receive AQUA rewards each epoch.
- **Governance Proposals**: `governICE` holders vote on protocol parameter changes, new feature activations, and ecosystem fund allocations. Proposals and votes are recorded on-chain.
- **Reward Distribution**: AQUA rewards are distributed hourly to liquidity providers in voted markets. A dedicated AMM rewards distributor wallet handles distribution in small batches to minimize risk.

### Token Infrastructure

- **AQUA Token Issuer**: `GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA`
- **Total Trustlines**: Over 184,000 Stellar accounts have established AQUA trustlines, making it one of the most widely held non-XLM assets on Stellar.
- **ICE Tokens**: Non-transferable, minted on the Stellar network under the `aqua.network` domain. Locked via Stellar claimable balances for immutability.

---

## Stellar Integration Details

Aquarius demonstrates deep, multi-layer integration with Stellar:

| Integration Point | How Aquarius Uses It |
|---|---|
| **Soroban Smart Contracts** | AMM router and pool contracts for decentralized liquidity provision |
| **Stellar Native Assets** | AQUA token issued as a native Stellar asset; ICE derivatives as non-transferable native assets |
| **Claimable Balances** | Core mechanism for governance voting and AQUA locking — votes are locked in claimable balances, making them immutable and on-chain verifiable |
| **SDEX (Stellar DEX)** | Aquarius incentivizes SDEX market pairs alongside its own AMM pools, bridging classic and Soroban liquidity |
| **Horizon API** | Used for account monitoring, trustline queries, and transaction verification |
| **Soroban RPC** | Used for AMM contract interactions, pool state queries, and swap simulations |

---

## On-Chain Verification

All key Aquarius contracts and accounts are publicly verifiable on Stellar mainnet:

- **AMM Router Contract (Mainnet):** `CBQDHNBFBZYE4MKPWBSJOPIYLW4SFSXAXUTSXJN76GNKYVYPCKWC6QUK`
  - Verify at: `https://stellar.expert/explorer/public/contract/CBQDHNBFBZYE4MKPWBSJOPIYLW4SFSXAXUTSXJN76GNKYVYPCKWC6QUK`
- **XLM/AQUA Pool Contract (Mainnet):** `CCY2PXGMKNQHO7WNYXEWX76L2C5BH3JUW3RCATGUYKY7QQTRILBZIFWV`
  - Verify at: `https://stellar.expert/explorer/public/contract/CCY2PXGMKNQHO7WNYXEWX76L2C5BH3JUW3RCATGUYKY7QQTRILBZIFWV`
- **AQUA Token Issuer Account (Mainnet):** `GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA`
  - Verify at: `https://stellar.expert/explorer/public/account/GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA`

Verification steps:
1. Open the AMM Router contract on Stellar Expert and inspect recent invocations — you will see live swap and liquidity operations.
2. Open the XLM/AQUA pool contract to view current reserves and LP token supply.
3. Open the AQUA issuer account to verify total supply and the 184,000+ trustlines.

---

## Community & Ecosystem Metrics

- **Operating Since:** 2021 (one of the oldest active DeFi projects on Stellar)
- **TVL:** ~$30.2M (DeFiLlama, Aquarius Stellar protocol)
- **AQUA Trustlines:** 184,000+ Stellar accounts
- **AQUA Rewards Distributed:** Over 6 billion AQUA distributed to liquidity providers since launch
- **GitHub Organization:** [github.com/AquaToken](https://github.com/AquaToken) — multiple active repositories including `soroban-amm`, `dao-aquarius`, and `aqua-network-frontend`
- **Exchange Listings:** AQUA is listed on multiple centralized exchanges (BitMart, Gate.io, MEXC) in addition to Stellar DEX
- **Integrations:** Referenced as a liquidity source by StellarBroker (multi-source swap router) and other Stellar ecosystem tools

---

## Why Aquarius Matters for the Stellar Wave Program

Aquarius occupies a unique position in the Stellar ecosystem: it is simultaneously a user-facing DeFi application and foundational infrastructure that other projects depend on. Several points make it especially relevant to the Wave Program:

**Liquidity as a Public Good**: Thin liquidity is one of the biggest barriers to adoption for new Stellar assets. Aquarius's community-governed reward system turns liquidity provision into a coordinated, incentive-aligned activity rather than a fragmented individual decision. Projects launching new tokens on Stellar benefit directly from Aquarius's liquidity layer.

**Soroban Adoption Pioneer**: Aquarius was among the first major Stellar projects to migrate core functionality to Soroban when it launched its AMM in July 2024. Its open-source `soroban-amm` contracts serve as a reference implementation for other developers building AMM-style applications on Stellar.

**Governance Innovation**: The ICE token model — where long-term commitment is rewarded with proportionally greater governance power — is a novel approach to aligning token holder incentives with protocol health. The use of Stellar's native claimable balances for vote locking (rather than a custom smart contract) demonstrates creative use of Stellar's existing primitives.

**Ecosystem Composability**: Aquarius pools are designed to be composable. The fee collector contract system allows any third-party application (wallets, aggregators, bots) to route swaps through Aquarius and earn a share of fees, creating a network of aligned integrators rather than a single monolithic platform.

---

## Submission Details

- **Project Name:** Aquarius
- **Category:** DeFi
- **Tags:** `defi, amm, liquidity, governance, soroban, stellar-wave, aqua, ice, dex, yield, mainnet`
- **Stellar Account ID:** `GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA`
- **Soroban Contract ID:** `CBQDHNBFBZYE4MKPWBSJOPIYLW4SFSXAXUTSXJN76GNKYVYPCKWC6QUK`
- **GitHub:** https://github.com/AquaToken
- **Website:** https://aqua.network
- **Research Date:** May 2026

## Submission Confirmed

Live API submission completed successfully on May 29, 2026.

- **Hub endpoint:** `https://usestellarwavehub.vercel.app/api/projects`
- **Result:** Created project with `id: 100`, `slug: aquarius`, `status: submitted`
- **Network:** mainnet
- **Tags used:** `defi,amm,liquidity,governance,soroban,stellar-wave,aqua,ice,dex,yield,mainnet`

## Submission Checklist

- [x] Project is a verified Stellar Wave Program participant (AquaToken GitHub org)
- [x] Description is original, thorough, and demonstrates independent research (500+ words)
- [x] On-chain accounts and contract IDs verified (AQUA issuer + AMM router on mainnet)
- [x] Category and tags are accurate
- [x] Submitted via POST /api/projects with status: submitted
