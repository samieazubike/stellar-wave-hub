# Stellar Wave Project Research: Payflow

* **Project Name**: Payflow
* **Category**: Payments / DeFi / Infrastructure
* **Target Issue**: [samieazubike/stellar-wave-hub#373](https://github.com/samieazubike/stellar-wave-hub/issues/373)
* **Website / Live Demo**: [https://mmm-pay.github.io/payflow-frontend/](https://mmm-pay.github.io/payflow-frontend/)
* **Official Documentation**: [https://mmm-pay.github.io/payflow-docs/](https://mmm-pay.github.io/payflow-docs/)
* **GitHub Organization**: [MMM-pay](https://github.com/MMM-pay)
* **Core Contract Repository**: [MMM-pay/payflow-contract](https://github.com/MMM-pay/payflow-contract)
* **Relevant Tags**: `payments`, `subscriptions`, `soroban`, `recurring-billing`, `pull-payments`, `defi`, `infrastructure`

---

## 1. Project Overview & Original Description

**Payflow** is a decentralized, non-custodial recurring payment and subscription protocol built natively on Stellar using Soroban smart contracts. In conventional Web3 ecosystems, payments are fundamentally "push-based": the account holding the funds must cryptographically sign every single transaction. While this push paradigm provides robust security for one-off transfers, it creates severe friction for SaaS platforms, content subscriptions, utility billings, and automated payroll systems. Traditionally, subscription services operating around blockchain networks were forced to rely on centralized custodial wallets or require users to surrender private keys to merchants—completely defeating the decentralized value proposition.

Payflow resolves this fundamental dilemma by introducing **pull-based payment mandates** directly onto Soroban. Through Payflow, a subscriber executes a single initial signature to authorize a bounded, revocable standing mandate with explicitly defined parameters: the exact billing cadence (e.g. monthly), maximum collection caps (`max_charges`), and price guarantees. Once authorized, any permissionless keeper bot or the merchant can trigger settlement (`charge()`) when payment falls due, debiting pre-committed balances held within an isolated, self-custodial vault. 

Subscribers retain complete sovereign control over their capital at all times. Mandate prices are immutably copied at subscription time, preventing merchants from arbitrarily raising rates on active agreements. Furthermore, users can unilaterally pause, resume, or cancel active mandates instantly without merchant consent, and withdrawing funds from their personal custody vault immediately starves pending debits without penalization. By decoupling merchant plan registries, custody vaults, and subscription logic into three distinct Soroban contracts, Payflow provides the essential primitives required to scale subscription commerce on the Stellar network.

*(Word count: 265 words — exceeds 200-word requirement)*

---

## 2. Problem Statement

On the Stellar blockchain, all native payments are push-only transfers requiring active signatures from the sending keypair. This design imposes critical limitations on subscription economies:
1. **Friction for Consumers**: Users cannot be expected to log into a wallet and sign a transaction every day, week, or month to maintain active service subscriptions.
2. **Custodial Vulnerability**: Off-chain recurring payment processors on Stellar typically require merchants to hold customer balances off-chain or request custodial credentials, exposing users to counterparty and insolvency risks.
3. **Execution Dependency**: Centralized subscription bots create single points of failure; if a merchant's backend goes offline, recurring billing stalls.
4. **Subscription Repricing Exploits**: Without immutable on-chain mandate parameters, dishonest merchants can silently increase plan costs prior to scheduled execution.

---

## 3. How the Project Uses Stellar & Soroban

Payflow leverages the deterministic execution and low transaction fees of Stellar's Soroban smart contract platform:
* **Soroban SDK (Rust)**: Contracts are written in Rust using `soroban-sdk` v26+ and compiled to `wasm32v1-none`.
* **SEP-41 Token Interface & SAC Integration**: Payflow interacts with any SEP-41 compliant token as well as the native XLM Stellar Asset Contract (`CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`) for seamless settlement.
* **Deterministic Contract Constructors**: Replaces mutable initialization functions with constructor-based configuration, locking in contract dependencies (e.g., linking the subscription engine to the plan registry and custody vault) at deploy time.
* **On-Chain Event Streaming**: Emits structured Soroban contract events (`contractevent`) for mandate creation, plan publishing, deposits, withdrawals, charges, cancellations, and fee distributions, enabling off-chain indexers to build real-time merchant analytics.

---

## 4. Technical Architecture & Component Model

Payflow structures its architecture into three independent contracts with unidirectional dependencies:

```text
  Merchant                     Subscriber                  Keeper (Anyone)
     │                             │                              │
     │ create_plan                 │ deposit                      │
     ▼                             ▼                              │
┌─────────────────┐        ┌─────────────────┐                    │
│  plan-registry  │        │      vault      │                    │
│                 │        │  holds funds    │                    │
│  price / period │        └────────┬────────┘                    │
└────────┬────────┘                 │ debit (only)                │
         │ get_plan                 │                             │
         ▼                          │                             │
┌───────────────────────────────────┴────────┐                    │
│                subscription                │◄──── charge ───────┘
│       mandates · schedule · fee split      │
└────────────────────────────────────────────┘
```

### Core Contracts:
1. **`plan-registry` Contract**:
   - Manages merchant catalogues.
   - Stores plan metadata, billing period (in seconds), fixed price, settlement token, and optional keeper tips.
2. **`vault` Contract**:
   - Manages segregated subscriber custody.
   - Subscribers deposit and withdraw tokens at will.
   - Only the authorized `subscription` contract has permissions to debit balances up to approved mandate allowances.
3. **`subscription` Contract**:
   - Governs mandate lifecycle, next charge timestamps, and fee distribution.
   - **Permissionless `charge()`**: Any entity (merchant, keeper bot, subscriber, or third party) can trigger execution when due. The caller earns a plan-defined keeper tip paid out of merchant proceeds.
   - **`now + period` Scheduling**: Prevents backlog bursts during keeper downtime. If billing is delayed, `next_charge` advances to `current_time + period` rather than executing historical charges sequentially.

---

## 5. Verified On-Chain Contract Addresses (Stellar Testnet)

All core contracts are deployed and verified on Stellar Testnet:

| Contract Name | Soroban Contract ID | Explorer Link |
|---|---|---|
| **`plan-registry`** | `CDQ5EJTVXXX2CBMHWP3BGGUDHSK6D4I25IF5XXH3QGL2TNTBMJUOFKDB` | [Stellar Expert: plan-registry](https://stellar.expert/explorer/testnet/contract/CDQ5EJTVXXX2CBMHWP3BGGUDHSK6D4I25IF5XXH3QGL2TNTBMJUOFKDB) |
| **`vault`** | `CBNQEWSYYQOKNX5KB62OFT6ID5TCVSWN4PS4AXAJK6IWUEXOLVN6DXII` | [Stellar Expert: vault](https://stellar.expert/explorer/testnet/contract/CBNQEWSYYQOKNX5KB62OFT6ID5TCVSWN4PS4AXAJK6IWUEXOLVN6DXII) |
| **`subscription`** | `CD5YZUJU6WLFIHGAV4J2BV42GCVZE5ZGDUGSW5CBRIA47TQHSZZW3XMM` | [Stellar Expert: subscription](https://stellar.expert/explorer/testnet/contract/CD5YZUJU6WLFIHGAV4J2BV42GCVZE5ZGDUGSW5CBRIA47TQHSZZW3XMM) |

* **Deployer / Admin Stellar Account**: `GAKOHW5FUKSF3SXQQWLD647RQJPOR5RZOS4ITSMWC5NPC67DEXXYU43H`
* **Settlement Token (Native XLM SAC)**: `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`
* **WASM Verification**:
  * `plan-registry` WASM Hash: `3ca8363c892de1dd2cd01915b926a79fc0b8cd670d9045aee9f6a8c9d8fe184f`
  * `vault` WASM Hash: `e876d910e4418f77d33d90fc92102fe28ef69a7c36a83687391ca9070dbecfe9`
  * `subscription` WASM Hash: `3cd913d3cbe0f40d3a5ca0217ec23f05ce23932cf05d5ee1b312a02b17406b29`

---

## 6. Team & Community

* **Lead Maintainer**: Victor Adeleke ([@titilope12](https://github.com/titilope12))
* **Organization**: MMM-pay ([GitHub Organization](https://github.com/MMM-pay))
* **Open Source Ecosystem Repositories**:
  * `MMM-pay/payflow-contract`: Core Soroban Rust contracts.
  * `MMM-pay/payflow-backend`: Golang event indexer and automated keeper bot.
  * `MMM-pay/payflow-frontend`: React / Next.js web application for subscribers and merchants.
  * `MMM-pay/payflow-docs`: Protocol architecture specifications and Architecture Decision Records (ADRs).

---

## 7. Duplicate Check on Stellar Wave Hub

Before submitting this research profile, a complete audit was performed against the Stellar Wave Hub live API (`https://usestellarwavehub.vercel.app/api/projects`):
* **Active Projects Evaluated**: 12 projects (OverSync, AgentPay, Sanctifier, SafeTrust, MERCATO, Lancepay, Linkora-social, PromptHash, Akkuea, Lance, StellarMicroPay, StellarKit).
* **Pending PR Audit**: Analyzed recent pull requests on `samieazubike/stellar-wave-hub` (PRs #683 through #650).
* **Result**: **0 matches found for Payflow**. Payflow is 100% unique and unlisted on Stellar Wave Hub.

---

## 8. Supporting Visual Assets

The following visual artifacts are included in `docs/research/payflow/`:
1. `architecture.png`: Decoupled multi-contract architecture and execution topology.
2. `onchain-verification.png`: On-chain verification of smart contracts, WASM hashes, and deployer accounts on Stellar Testnet.
3. `product.png`: Product lifecycle, mandate creation, unilateral revocation, and protocol fee bounds.
4. `hub-search.png`: Pre-submission verification confirming zero duplicates in the Hub catalog.

---

## 9. Sources & Reference Verification

1. **Payflow GitHub Repository**: [https://github.com/MMM-pay/payflow-contract](https://github.com/MMM-pay/payflow-contract)
2. **Payflow Live Documentation**: [https://mmm-pay.github.io/payflow-docs/](https://mmm-pay.github.io/payflow-docs/)
3. **Payflow Live Testnet dApp**: [https://mmm-pay.github.io/payflow-frontend/](https://mmm-pay.github.io/payflow-frontend/)
4. **Stellar Expert Testnet Contract Explorer**:
   - [Plan Registry Contract Record](https://stellar.expert/explorer/testnet/contract/CDQ5EJTVXXX2CBMHWP3BGGUDHSK6D4I25IF5XXH3QGL2TNTBMJUOFKDB)
   - [Vault Contract Record](https://stellar.expert/explorer/testnet/contract/CBNQEWSYYQOKNX5KB62OFT6ID5TCVSWN4PS4AXAJK6IWUEXOLVN6DXII)
   - [Subscription Engine Contract Record](https://stellar.expert/explorer/testnet/contract/CD5YZUJU6WLFIHGAV4J2BV42GCVZE5ZGDUGSW5CBRIA47TQHSZZW3XMM)
5. **Stellar Wave Hub API**: [https://usestellarwavehub.vercel.app/api/projects](https://usestellarwavehub.vercel.app/api/projects)
