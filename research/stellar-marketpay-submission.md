# Stellar MarketPay - Stellar Wave Research Submission

## Project Selected

- **Project:** Stellar MarketPay
- **Wave source:** [`Emmy123222/Stellar-MarketPay-`](https://www.drips.network/wave/stellar/repos), approved in the Stellar Wave Program repository catalog
- **Category:** Payments
- **Repository:** https://github.com/Emmy123222/Stellar-MarketPay-
- **Network:** Stellar Testnet

## Eligibility And Duplicate Check

Stellar MarketPay is listed in the Drips catalog of repositories approved for
the Stellar Wave Program. A Hub search for `MarketPay` returned zero projects
when this research was prepared, so the project was not already listed on
Stellar Wave Hub.

## What Stellar MarketPay Does

Stellar MarketPay is a decentralized freelance marketplace that uses Stellar as
the payment and escrow layer between clients and freelancers. The project
addresses a familiar marketplace problem: workers and clients usually need to
trust a centralized platform to hold funds, decide when work is complete, and
resolve payment timing. That model can create high platform fees, slow payouts,
and opaque dispute handling. MarketPay moves the core payment state into a
Soroban escrow contract so job funding, work start, release, refund, timeout,
milestone, and dispute actions can be verified from the ledger instead of only
from an application database.

The implementation is more than a single UI mock. The repository contains a
Next.js frontend, an Express backend, PostgreSQL migrations, operational docs,
security policy, ADRs, and a Rust Soroban contract. The contract exposes a
marketplace-oriented escrow API: clients create escrows, freelancers start work,
clients release or refund funds, disputes can be raised and resolved, admins can
configure arbitrators and global contract state, and milestone releases support
partial payout workflows. The backend complements the contract with services for
jobs, applications, profile data, encrypted messaging, transaction indexing,
notifications, and metrics. The frontend includes job posting, dashboard,
wallet connection, payments, dispute, transaction history, and accessibility
components.

MarketPay's Stellar integration is explicit. Its deployment guide records a
testnet Soroban contract, a testnet admin/treasury account, the testnet XLM
Stellar Asset Contract, initialization status, and smoke-test transactions. The
same guide instructs operators to configure backend and frontend environments
with the Soroban contract ID, Horizon testnet endpoint, and Soroban RPC
endpoint. Horizon verifies the documented initialization transaction as a
successful `invoke_host_function` operation sourced from the listed
admin/treasury account. Because the current verified deployment is on testnet,
the Hub profile should represent MarketPay as a testnet-stage payments
application rather than a production mainnet marketplace.

## On-Chain Verification

The repository's deployment guide identifies these Stellar testnet values:

- **MarketPay escrow contract:** `CBFJNX67NYYRZPLH4YYT77ZUULRJ5NI2LPEYRRLFHBTEACZOZUUYLOGG`
- **Admin / treasury account:** `GAUC7VCPFCQQBMHMOH3NPRUSOT2RBXLJNV433JMAXUPFYKU2MCO7CHL4`
- **XLM SAC testnet contract:** `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`

The MarketPay contract is the primary identifier for the Hub profile. The
repository links the initialization transaction:

- [Initialization transaction](https://horizon-testnet.stellar.org/transactions/51b84452dc148912ec2fecf317c5ac9b3a274c69c98734e6836c1023cad30f08)

Horizon reports the transaction as successful, created on 2026-07-29 in ledger
3863812, with one `invoke_host_function` operation that calls `initialize`.

## Suggested Hub Submission

- **Name:** Stellar MarketPay
- **Category:** Payments
- **Network:** Testnet
- **Tags:** `payments, marketplace, freelance, escrow, soroban, stellar, xlm, disputes, milestones, stellar-wave`
- **Website:** use repository URL if no production website is available
- **GitHub label:** Core repository
- **GitHub repository:** https://github.com/Emmy123222/Stellar-MarketPay-
- **Soroban Contract ID:** `CBFJNX67NYYRZPLH4YYT77ZUULRJ5NI2LPEYRRLFHBTEACZOZUUYLOGG`
- **Stellar Account ID:** `GAUC7VCPFCQQBMHMOH3NPRUSOT2RBXLJNV433JMAXUPFYKU2MCO7CHL4`
- **Research images:** Drips Wave listing, contract deployment docs, and the
  Horizon/Stellar Expert transaction or contract view.

## Hub Submission Confirmation

- **Hub project ID:** `125`
- **Status:** `submitted` (awaiting Hub administrator review)
- **Submitted network:** Testnet
- **Uploaded research images:**
  - https://dlwcywvybsedgmcggmjn.supabase.co/storage/v1/object/public/research-images/126/1788208005089-9q2fvx.png
  - https://dlwcywvybsedgmcggmjn.supabase.co/storage/v1/object/public/research-images/126/1788208005771-wjjct7.png
  - https://dlwcywvybsedgmcggmjn.supabase.co/storage/v1/object/public/research-images/126/1788208006393-vsy20l.png

## Sources

1. [Drips Stellar Wave repository catalog](https://www.drips.network/wave/stellar/repos)
2. [Stellar MarketPay repository and README](https://github.com/Emmy123222/Stellar-MarketPay-)
3. [MarketPay contract deployment guide](https://github.com/Emmy123222/Stellar-MarketPay-/blob/main/docs/contract-deployment.md)
4. [MarketPay Soroban contract README](https://github.com/Emmy123222/Stellar-MarketPay-/blob/main/contracts/marketpay-contract/README.md)
5. [MarketPay initialization transaction on Horizon](https://horizon-testnet.stellar.org/transactions/51b84452dc148912ec2fecf317c5ac9b3a274c69c98734e6836c1023cad30f08)
