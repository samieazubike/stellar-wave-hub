# Reflector — Stellar Wave Oracle Research Submission

## Project Selected

- **Project:** Reflector
- **Wave source:** Stellar Community Fund (SCF) #23 Winner, key Soroban ecosystem infrastructure.
- **Domain:** Infrastructure / Oracles
- **Website:** https://reflector.network
- **Repository:** https://github.com/reflector-network

## Why This Matches the Task

Reflector is a foundational oracle service for the Stellar Soroban ecosystem. It provides critical off-chain data (price feeds) to on-chain smart contracts, enabling DeFi applications like lending protocols (e.g., Blend) and stablecoins to function. It is explicitly built for Soroban and follows the SEP-40 standard, making it a prime example of infrastructure developed for the Stellar Wave ecosystem. It is not currently listed in the Stellar Wave Hub.

## Verifiable On-Chain IDs

Reflector operates several oracle contracts on Stellar Mainnet:

- **External CEX & DEX Oracle:** `CAFJZQWSED6YAWZU3GWRTOCNPPCGBN32L7QV43XX5LZLFTK6JLN34DLN`
- **Stellar Classic DEX Oracle:** `CALI2BYU2JE6WVRUFYTS6MSBNEHGJ35P4AVCZYF3B6QOE3QKOB2PLE6M`
- **Fiat Exchange Rates Oracle:** `CBKGPWGKSKZF52CFHMTRR23TBWTPMRDIYZ4O2P5VS65BMHYH4DXMCJZC`

Verification endpoints:

- `https://api.stellar.expert/explorer/public/contract/CAFJZQWSED6YAWZU3GWRTOCNPPCGBN32L7QV43XX5LZLFTK6JLN34DLN`
- `https://api.stellar.expert/explorer/public/contract/CALI2BYU2JE6WVRUFYTS6MSBNEHGJ35P4AVCZYF3B6QOE3QKOB2PLE6M`
- `https://horizon.stellar.org/accounts/CAFJZQWSED6YAWZU3GWRTOCNPPCGBN32L7QV43XX5LZLFTK6JLN34DLN`

## Oracle Architecture & Data Delivery (Detailed)

Reflector is a decentralized price oracle designed specifically for the Stellar network and its smart contract platform, Soroban. It serves as a critical piece of infrastructure by bridging the gap between off-chain data and on-chain execution. Reflector provides real-time, high-precision price feeds for a wide variety of assets, including cryptocurrencies, fiat currencies, and commodities like gold. One of its standout features is its full compatibility with SEP-40, the Stellar Ecosystem Proposal that standardizes how oracles should interface with Soroban smart contracts. This compatibility ensures that developers can seamlessly integrate Reflector into their DeFi applications, such as lending protocols, stablecoins, and yield aggregators, without having to write custom adapter code.

The oracle's reliability is rooted in its multi-source aggregation model. It pulls data from both the Stellar Classic decentralized exchange (DEX) and various major centralized exchanges (CEX) like Binance, Coinbase, and Kraken. This diverse data sourcing mitigates the risk of price manipulation and provides a more accurate reflection of global market prices. Updates occur every five minutes, ensuring that smart contracts have access to fresh data. The update mechanism follows a "push" model where decentralized nodes monitor price movements and submit updates to the Soroban contracts when certain deviation thresholds are met or time intervals expire.

Furthermore, Reflector offers extended functionality beyond simple price reporting. It includes utility functions for cross-price calculations (e.g., determining the price of one asset in terms of another without a direct trading pair) and Time-Weighted Average Price (TWAP) approximations. TWAP is particularly important for DeFi security, as it makes price manipulation significantly more expensive and difficult. Data is typically retained for 24 hours in temporary storage to balance accessibility with gas costs. By providing a robust, decentralized, and standardized data feed, Reflector empowers the next generation of financial services on Stellar, ensuring that Soroban contracts can interact with the real world safely and reliably.

## Submission Details

- **Name:** Reflector
- **Description:** (As detailed above, >200 words)
- **Category:** infrastructure
- **Stellar Account ID:** CAFJZQWSED6YAWZU3GWRTOCNPPCGBN32L7QV43XX5LZLFTK6JLN34DLN
- **Tags:** infrastructure, oracle, data-feed, soroban, sep-40, stellar-wave
- **Status:** Submitted via Stellar Wave Hub API
