# KindFi — Stellar Wave research submission

## Project selected

- **Project:** KindFi
- **Wave source:** [kindfi-org/kindfi](https://github.com/kindfi-org/kindfi) on [Stellar Wave / Drips](https://www.drips.network/wave/stellar/repos)
- **Website:** https://www.kindfi.org
- **Repository:** https://github.com/kindfi-org/kindfi

## Why this matches the task

KindFi is an approved Stellar Wave Program repository, focuses on real Stellar/Soroban usage, and was **not** listed on the production Hub explore API at submission time (existing entries included Neko Protocol, OFFER-HUB, PetChain, Tansu, Trustless Work Smart Escrow).

## Verifiable on-chain IDs (testnet)

From official repo files [`apps/contract/auth-deployment-info-testnet.txt`](https://raw.githubusercontent.com/kindfi-org/kindfi/develop/apps/contract/auth-deployment-info-testnet.txt) and [`DEPLOYMENT_UPDATE.md`](https://raw.githubusercontent.com/kindfi-org/kindfi/develop/apps/contract/DEPLOYMENT_UPDATE.md):

| Role | ID |
|------|-----|
| Source / deployment account | `GAC63U4ZEGRCIDFMUJM34EVIGOW4PSMJ6B66ELCWSF6ZVYSONKL6LIEA` |
| Auth controller (Soroban) | `CAXLM3X6QF6YUZWUVNV3CFE4SMDTEJEWH3KN7ZTGO4WMYIFOLJJV66FE` |
| Account factory | `CDEA3HFVIMUJ3MZPUST4CRZ5SVV3FMPB6PILU6MGSDQZKDLTVTQHRM4D` |
| Account contract template | `CBD4PVOPBSNKQ4LLNYLVKCY3PW6UXNDZ5GAQDXZDNFGVEKXPO3OVZLYA` |

Verification:

- Horizon (testnet): `https://horizon-testnet.stellar.org/accounts/GAC63U4ZEGRCIDFMUJM34EVIGOW4PSMJ6B66ELCWSF6ZVYSONKL6LIEA`
- Stellar Expert (testnet contract): `https://stellar.expert/explorer/testnet/contract/CAXLM3X6QF6YUZWUVNV3CFE4SMDTEJEWH3KN7ZTGO4WMYIFOLJJV66FE`

## Beginner-friendly description (Hub profile text)

KindFi addresses a problem many people feel when they donate or back a project online: money is collected in one place, but it is not always obvious that payouts only happen when real milestones are met. Ordinary crowdfunding sites ask you to trust their internal records. KindFi is an open-source crowdfunding platform built on Stellar that organizes campaigns around milestones, community participation, and clearer rules for how funds move over time.

If you are new to crypto, think of a blockchain as a shared digital ledger many computers keep in sync, so agreements and balances can be checked in public instead of hidden on one company’s server. Stellar is a network designed for moving value quickly and cheaply, which matters when you want crowdfunding to feel practical rather than expensive. KindFi also uses Soroban, Stellar’s smart-contract platform—small programs with fixed rules—for areas such as wallet-style authentication, NFT-like credentials, academy progress, and reputation, so important logic can live on-chain where independent observers can verify it.

The project is for donors who want more transparency, teams running social-impact campaigns, and developers who want to extend milestone escrows and integrations (for example with escrow tooling in the broader Stellar ecosystem). KindFi’s participation in the Stellar Wave Program on Drips places it alongside other maintained open-source Stellar projects. Published testnet deployment notes include a verifiable Stellar account and Soroban contract identifiers, so anyone can confirm in a block explorer that those contracts exist and match what the team documents—exactly the kind of public traceability this Hub profile is meant to reflect.

## Submission notes

- **Category (Hub):** `social` — community crowdfunding and engagement.
- **Tags:** domain tags plus `beginner-friendly` and `stellar-wave`.
- **Network:** `testnet` for the IDs above (matches deployment docs).

## Submission performed

Live API submission completed on March 30, 2026.

- **Hub endpoint:** `https://usestellarwavehub.vercel.app/api/projects`
- **Result:** created project with `id: 74`, `slug: kindfi-1774852224603`, `status: submitted`
