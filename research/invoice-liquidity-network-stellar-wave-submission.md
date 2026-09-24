# Invoice Liquidity Network — Stellar Wave research

Research date: 2026-09-24

## Hub submission fields

- **Name:** Invoice Liquidity Network (ILN)
- **Category:** DeFi
- **Tags:** `stellar, soroban, invoice-factoring, receivables, liquidity, defi, testnet, stellar-wave`
- **Network:** testnet
- **Stellar contract ID:** `CD3TE3IAHM737P236XZL2OYU275ZKD6MN7YH7PYYAXYIGEH55OPEWYJC`
- **Website:** https://invoice-liquidity-network.vercel.app/
- **GitHub repositories:** [organization workspace](https://github.com/Invoice-Liquidity-Network/Invoice-Liquidity-Network), [Soroban contracts](https://github.com/Invoice-Liquidity-Network/ILN-Smart-Contract), [frontend](https://github.com/Invoice-Liquidity-Network/ILN-Frontend)
- **Wave listing:** https://www.drips.network/wave/orgs/d0ae6032-c81b-44d2-8107-4d03766b2588
- **Logo:** Leave blank unless an official reusable image URL is confirmed.

## Description for the Hub

Invoice Liquidity Network (ILN) is an open-source invoice factoring project built around Stellar testnet and Soroban. It addresses a cash-flow problem for freelancers and small businesses: completed work can leave them waiting for a customer to pay an invoice. ILN's proposed flow lets an invoice owner submit a receivable and lets a liquidity provider fund it at a discount. The invoice owner receives funds earlier; the provider takes on collection risk in exchange for the discount if the payer settles. This is a financing mechanism, so the discount and default risk matter as much as the speed of payment.

The project separates the user interface, contract logic, and supporting services. Its Next.js frontend presents invoice submission, funding, governance, and analytics views. The Rust/Soroban repository contains the invoice lifecycle contract plus governance, distribution, insurance, and reputation components. The organization's architecture documentation describes a TypeScript SDK and CLI that construct and sign transactions, a service that indexes contract events for easier queries, and a notification service. Stellar is used for the contract execution and transaction record; the indexer and interface provide more convenient off-chain views. This division matters because an invoice's authoritative state should come from the contract, while dashboards can lag or depend on separate services.

ILN is listed in the Drips Stellar Wave program with its organization workspace, frontend, and contract repositories. Its frontend names a testnet invoice contract, and an independent Stellar Expert lookup confirms that this exact contract was created on testnet. The explorer currently shows a deployment record and only limited contract activity. That verifies an on-chain footprint, but it does not establish active invoice volume or a production mainnet launch. The organization's documentation says mainnet deployment is pending an audit. The public site is therefore best understood as a testnet product and a view of the intended workflow, with real-world adoption still to be demonstrated.

## Evidence and verification

1. **Wave eligibility:** [Drips organization page](https://www.drips.network/wave/orgs/d0ae6032-c81b-44d2-8107-4d03766b2588) lists all three ILN repositories under Stellar Wave. See `iln-wave-source.png`.
2. **Product and architecture:** [public testnet site](https://invoice-liquidity-network.vercel.app/) and [architecture documentation](https://github.com/Invoice-Liquidity-Network/Invoice-Liquidity-Network/blob/dev/docs/architecture.md) show the user flow and component responsibilities. See `iln-product.png` and `iln-architecture.png`. The site's headline counters are not used as proof of on-chain activity.
3. **Contract attribution:** [frontend README](https://github.com/Invoice-Liquidity-Network/ILN-Frontend) identifies `CD3TE3IAHM737P236XZL2OYU275ZKD6MN7YH7PYYAXYIGEH55OPEWYJC` as its testnet invoice-factoring contract; the [contract repository](https://github.com/Invoice-Liquidity-Network/ILN-Smart-Contract) also uses it in indexer configuration.
4. **Independent on-chain check:** [Stellar Expert testnet contract](https://stellar.expert/explorer/testnet/contract/CD3TE3IAHM737P236XZL2OYU275ZKD6MN7YH7PYYAXYIGEH55OPEWYJC) displays the contract creation transaction and WASM hash; its [public API](https://api.stellar.expert/explorer/testnet/contract/CD3TE3IAHM737P236XZL2OYU275ZKD6MN7YH7PYYAXYIGEH55OPEWYJC) returned the same contract ID with one invocation and zero events at research time. See `iln-onchain-expert.png`. Stellar Expert labels the contract source code unverified, so this confirms deployment and the project's stated use of the ID, not a byte-for-byte match to GitHub source.
5. **Duplicate check:** Queried the Hub's public `/api/projects?limit=50` and `/api/projects/queue` endpoints on 2026-09-24. ILN was absent from 36 approved/featured projects and 16 queued submissions at that time. Recheck immediately before submission because the queue can change.

## Research images

| File | Captured source |
| --- | --- |
| `iln-wave-source.png` | Drips Stellar Wave organization listing |
| `iln-product.png` | ILN public testnet product page |
| `iln-architecture.png` | ILN GitHub architecture document |
| `iln-onchain-expert.png` | Stellar Expert testnet contract page |
