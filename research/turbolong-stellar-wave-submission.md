# Turbolong — Stellar Wave project research profile

## Project and classification

- **Project:** Turbolong
- **Category:** Financial Protocols / DeFi
- **Tags:** `blend`, `soroban`, `leverage`, `stablebonds`, `wallets`
- **Repository:** https://github.com/Dgetsylver/TurboLong
- **Wave evidence:** https://communityfund.stellar.org/submissions/rec3XPXitj5kWBdR107

## Independent description

Turbolong is a leveraged-yield application that lets users amplify exposure to
Etherfuse stablebonds, USDC, and XLM through recursive supply-and-borrow loops
on Blend v2. A user chooses an asset and leverage target, and the application
builds the loop so it can settle atomically in one Blend pool submission. This
reduces the operational burden of repeatedly supplying collateral and borrowing
against it while ensuring that a partially completed loop does not leave the
user with an unintended intermediate position. Turbolong is non-custodial:
the supplied and borrowed positions remain associated with the user in Blend,
and the application does not hold user funds.

The project addresses the difficulty of accessing leveraged strategies without
manually coordinating many DeFi transactions. It also adds monitoring around
pool health and projected returns, which is important because leverage magnifies
both yield and liquidation risk. Its architecture combines a TypeScript/Vite
frontend, Rust/Soroban strategy code, Blend v2 pools, Stellar Wallets Kit, and
supporting alerts infrastructure. The repository describes mainnet integrations
with Blend-Etherfuse, Blend-Fixed, and Blend-YieldBlox, while testnet work
explores vault-style strategy automation.

## Stellar usage and technical approach

Stellar is used as the settlement layer for Blend positions, Soroban strategy
contracts, wallet signing, and stablebond/USDC asset transfers. Soroban allows
the strategy wrapper to compose multiple protocol calls atomically. Stellar’s
low transaction overhead makes smaller strategy adjustments more practical,
while the public ledger provides independently verifiable contract and pool
activity. The project’s roadmap also identifies Stellar Broker and Aquarius as
future routing and liquidity integrations.

## Team and verification notes

The public SCF submission identifies The Aha Company team and describes the
project as an approved Drips Stellar Wave contributor. Before submitting this
profile through the Hub, verify the current repository deployment, contract IDs,
and that no Turbolong record has already been approved in the Hub search. The
linked SCF submission is the source for the Wave relationship; the repository is
the source for implementation claims.

## Sources

1. SCF project submission and Wave evidence: https://communityfund.stellar.org/submissions/rec3XPXitj5kWBdR107
2. Project source and implementation artifacts: https://github.com/Dgetsylver/TurboLong
3. Blend v2 documentation: https://docs.blend.capital/
