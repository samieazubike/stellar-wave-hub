# Sub Rosa - Stellar Wave Research Submission

## Project Selected

- **Project:** Sub Rosa
- **Wave source:** [`karagozemin/Sub-Rosa`](https://www.drips.network/wave/stellar/repos), approved in the Stellar Wave Program repository catalog
- **Category:** Infrastructure
- **Repository:** https://github.com/karagozemin/Sub-Rosa
- **Live application:** https://www.sub-rosa.online/
- **Mainnet Soroban contract:** `CDQOFNCJE5Z4ZZL76DU5652FOUKJVEIZWHFGCZVWH63UYBGPSZIPC325`
- **Testnet Soroban contract:** `CCOVGOQQZJKZ2R55GRWBLTJTGBAMSHXZVN3ICPG3WRVMLMM6RHISC5OV`

## Eligibility And Duplicate Check

Sub Rosa is eligible because its repository is listed in the Drips Stellar Wave
repository catalog. A Hub search for `Sub Rosa` returned no projects when this
research was prepared, so the project was not among the public Hub listings.

## What Sub Rosa Does

Sub Rosa is a Soroban-based sealed-market protocol for decisions that need a
shared, verifiable reveal boundary. It is intended to be embedded in another
application rather than replace the application's marketplace, identity,
discovery, or payment experience. Participants submit encrypted bids or
proposals before a configured Drand round. Once that threshold is reached, the
protocol allows the lifecycle to move through opening, reveal, clearing, and a
public receipt. The repository describes a permissionless keeper that can
advance this lifecycle, so the outcome is not dependent on the organizer
manually releasing submissions.

The contract exposes two deliberately different modes. `Auction` holds the lot
and fixed bidder escrow, verifies reveals, refunds unsuccessful bidders, and
settles the winning exchange atomically. `ReceiptOnly` instead produces a
canonical receipt for confidential proposals and leaves provider selection and
any business payment outside the contract. This distinction is important: the
project does not claim that every private proposal is an on-chain trade.

Its public stack includes the Soroban sealed-round contract, generated
TypeScript bindings, a TypeScript SDK, a `tlock` package for time-locked
payloads, and a hosted pilot interface. The project documents completed
testnet auction rounds as well as a Core v2 mainnet deployment. The repository
also states an important production boundary: the mainnet deployment is capped
and has not yet received an independent funds-handling audit. That limitation
should remain visible to any integrator considering higher-value use.

## On-Chain Verification

- **Mainnet contract:** [Stellar Expert contract view](https://stellar.expert/explorer/public/contract/CDQOFNCJE5Z4ZZL76DU5652FOUKJVEIZWHFGCZVWH63UYBGPSZIPC325)
- **Mainnet deployment transaction:** [`349fe1094c544a88a8ad862a26047f4acd537d77a1aef4d14805ad6827768094`](https://horizon.stellar.org/transactions/349fe1094c544a88a8ad862a26047f4acd537d77a1aef4d14805ad6827768094)
- **Verification result:** Horizon reports the deployment transaction as
  successful, with one `invoke_host_function` operation in ledger `63844676`
  at `2026-08-07T17:53:20Z`.
- **Testnet contract:** [Stellar Expert contract view](https://stellar.expert/explorer/testnet/contract/CCOVGOQQZJKZ2R55GRWBLTJTGBAMSHXZVN3ICPG3WRVMLMM6RHISC5OV)

The mainnet contract is the identifier intended for the Hub submission. The
testnet contract is supporting evidence for the project's documented testnet
pilots and completed lifecycle proofs.

## Suggested Hub Submission

- **Name:** Sub Rosa
- **Category:** Infrastructure
- **Network:** Mainnet
- **Tags:** `soroban, sealed-auctions, privacy, drand, sdk, infrastructure, stellar-wave`
- **Website:** https://www.sub-rosa.online/
- **GitHub repository:** https://github.com/karagozemin/Sub-Rosa
- **Logo:** https://raw.githubusercontent.com/karagozemin/Sub-Rosa/main/assets/sub-rosa-readme.png
- **Research images:** Sub Rosa hosted-app view and the documented testnet
  lifecycle receipt.

## Submission Confirmed

- **Hub project ID:** `121`
- **Hub slug:** `sub-rosa`
- **Submission status:** `submitted` (awaiting administrator review)
- **Submitted:** `2026-08-31T05:59:48.588Z`
- **Submission evidence:** the Hub record contains the mainnet contract ID and
  two supporting research images.

## Sources

1. [Drips Stellar Wave repository catalog](https://www.drips.network/wave/stellar/repos)
2. [Sub Rosa repository and technical README](https://github.com/karagozemin/Sub-Rosa)
3. [Stellar Horizon deployment transaction](https://horizon.stellar.org/transactions/349fe1094c544a88a8ad862a26047f4acd537d77a1aef4d14805ad6827768094)
4. [Mainnet contract explorer](https://stellar.expert/explorer/public/contract/CDQOFNCJE5Z4ZZL76DU5652FOUKJVEIZWHFGCZVWH63UYBGPSZIPC325)
5. [Testnet contract explorer](https://stellar.expert/explorer/testnet/contract/CCOVGOQQZJKZ2R55GRWBLTJTGBAMSHXZVN3ICPG3WRVMLMM6RHISC5OV)
