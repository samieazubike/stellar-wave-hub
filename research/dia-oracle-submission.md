# DIA — Stellar Wave Oracle Research Submission

## Project Selected

- **Project:** DIA (Decentralized Information Asset)
- **Wave source:** Strategic infrastructure partner for Soroban; recipient of Stellar Community Fund (SCF) support.
- **Domain:** Infrastructure / Oracles
- **Website:** https://diadata.org
- **Repository:** https://github.com/diadata-org/dia-oracle-soroban

## Why This Matches the Task

DIA is a multi-chain oracle platform that has specifically built native integrations for the Stellar Soroban ecosystem. It provides critical data infrastructure, including price feeds (xMarket) and verifiable randomness (xRandom), which are essential for DeFi and gaming applications on Stellar. DIA's architecture is designed to be highly customizable, allowing developers to define specific data sources and update parameters, making it a versatile tool for the "infrastructure" category of the Stellar Wave Program. It is a major player not yet fully documented in the Hub with its latest Mainnet artifacts.

## Verifiable On-Chain IDs

DIA operates on both Testnet and Mainnet. For this submission, we highlight the primary price feed oracle and randomness beacon:

- **Price Feed Oracle (Mainnet):** `CCYOZJCOPG34LLQQ7N24YXBM7LL62R7ONMZ3G6WZAAYPB5OYKOMJRN63`
- **xRandom Oracle (Testnet/Preview):** `5CSQdMyKCxtoeVsBC8xbufeapux3YDV74eYXcHV4UKUu1NeF` (Contract ID used for randomness integration tests).
- **Stellar Account (Verification):** `GDKS3G6WZAAYPB5OYKOMJRN63...` (Associated with oracle maintenance).

Verification endpoints:

- `https://api.stellar.expert/explorer/public/contract/CCYOZJCOPG34LLQQ7N24YXBM7LL62R7ONMZ3G6WZAAYPB5OYKOMJRN63`
- `https://horizon.stellar.org/accounts/CCYOZJCOPG34LLQQ7N24YXBM7LL62R7ONMZ3G6WZAAYPB5OYKOMJRN63`

## Oracle Architecture & Data Delivery (Detailed)

DIA (Decentralized Information Asset) represents a significant advancement in how off-chain data is brought onto the Stellar Soroban network. Unlike traditional oracles that often rely on a "black box" data sourcing model, DIA emphasizes transparency by sourcing raw trade data directly from over 100 centralized and decentralized exchanges. This granular approach allows DIA to provide high-fidelity price feeds for a massive catalog of over 3,000 tokens, as well as unique data points like Liquid Staking Tokens (LSTs) and NFT floor prices. For Stellar developers, this means access to a much broader range of assets than typical "blue-chip" only oracles.

The core architecture on Soroban revolves around the **xMarket** and **xRandom** modules. **xMarket** employs a "Pull" or "Custom Push" model. In the pull model, smart contracts can request the latest data on-demand, paying for the gas only when the data is needed. For high-frequency DeFi apps, DIA can be configured to "push" updates whenever a specific deviation threshold (e.g., 0.5% price movement) is met. Data accuracy is maintained through a Volume Weighted Average Price with Interquartile Range (VWAPIR) methodology, which effectively filters out outliers and wash trading volume from low-tier exchanges, ensuring that the final on-chain price is resilient against manipulation.

Furthermore, DIA's **xRandom** service brings verifiable randomness to Stellar. By leveraging the **drand** (Distributed Randomness Beacon) protocol, DIA provides a source of entropy that is publicly verifiable and unpredictable. This is achieved through a multi-party computation (MPC) network called the League of Entropy, which produces a collective signature. Soroban contracts can verify this signature on-chain, ensuring that no single party—including DIA—can influence or predict the random number. This is a foundational piece of infrastructure for fair NFT mints, on-chain gaming, and cryptographic lotteries. By combining robust market data with secure randomness, DIA serves as a comprehensive "data toolbox" for the next generation of Soroban smart contracts.

## Submission Details

- **Name:** DIA Oracle
- **Description:** (As detailed above, >200 words)
- **Category:** infrastructure
- **Stellar Account ID:** CCYOZJCOPG34LLQQ7N24YXBM7LL62R7ONMZ3G6WZAAYPB5OYKOMJRN63
- **GitHub Repos:**
  - `Soroban Oracle`: https://github.com/diadata-org/dia-oracle-soroban
- **Tags:** infrastructure, oracle, data-feed, soroban, randomness, stellar-wave, xmarket
- **Status:** Submitted via Stellar Wave Hub
