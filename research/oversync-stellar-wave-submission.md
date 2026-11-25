# OverSync - Stellar Wave Research Submission

## Project Selected

- **Project:** OverSync
- **Wave source:** [`karagozemin/OverSync`](https://www.drips.network/wave/stellar/repos), approved in the Stellar Wave Program repository catalog
- **Category:** Infrastructure
- **Repository:** https://github.com/karagozemin/OverSync
- **Live application:** https://oversync.vercel.app
- **Network:** Stellar Testnet

## Eligibility And Duplicate Check

OverSync is listed in the Drips catalog of repositories approved for the Stellar
Wave Program. A Hub search for `OverSync` returned zero public matches when this
research was prepared, so it was not already listed in the Hub.

## What OverSync Does

OverSync is a non-custodial bridge for moving native assets between Ethereum and
Stellar. Its central problem is the trust placed in many cross-chain bridges:
an off-chain validator set or attester can approve a destination release even
when the source-side lock is not real. OverSync uses symmetric hash-time-lock
contracts instead. Both sides lock funds against the same cryptographic hash,
and the swap settles when the beneficiary reveals the secret. If the secret is
not revealed before the deadline, the relevant contract exposes a permissionless
refund path.

The live v2 design has a Solidity HTLC on Ethereum Sepolia and a Soroban HTLC on
Stellar Testnet. The Stellar side also has a resolver registry that manages
resolver participation and staking. A resolver can provide liquidity and
complete the other side of a swap, but it does not receive a privileged route
to move user funds. The coordinator is an off-chain matching and metadata
service; the repository states that it does not hold keys capable of signing
HTLC transactions. The frontend is explicitly testnet-only while the v2
contracts go through the project's audit and governance gates.

The swap sequence is designed around different timelocks. The user locks ETH
under a SHA-256 hash, the resolver locks XLM under the same hash with a shorter
deadline, the user claims XLM by revealing the preimage, and the resolver uses
that public preimage to claim ETH. The asymmetry gives the user a recovery
window if the swap does not complete. The Soroban implementation contains the
HTLC lifecycle, refund logic, resolver-registry integration, and contract tests;
the repository also includes a TypeScript coordinator, resolver runner,
frontend, and event polling service.

OverSync should be represented as Testnet infrastructure, not as a production
mainnet bridge. Its own documentation says the v2 deployment is unaudited and
that mainnet is gated on additional testing, governance, and an independent
audit. That limitation is part of an accurate project profile because the
protocol handles locked assets even though this particular deployment is for
testnet evaluation.

## On-Chain Verification

The repository's testnet deployment manifest identifies these Stellar contracts:

- **Soroban HTLC:** `CDIKSJKVMXKGBRD3BBEBMF7Q4GQJ52ECU6R6G5HEKXKXVGGWK2CTA6JK`
- **Soroban Resolver Registry:** `CBSR7Z4MHLPMLFFM5K3PK3YLZAVCOMJ4KPVRWO4VPL3FF64MSTIZ4WGF`

The Soroban HTLC is the primary identifier for the Hub profile. It resolves in
the [Stellar Expert Testnet explorer](https://stellar.expert/explorer/testnet/contract/CDIKSJKVMXKGBRD3BBEBMF7Q4GQJ52ECU6R6G5HEKXKXVGGWK2CTA6JK).
The repository records deployment transactions for both contracts:

- [HTLC deployment](https://horizon-testnet.stellar.org/transactions/f7583c2cca3ca542a4754677e98f1ce9c4e1fa93ebe534ed094110b0e58201d7)
- [Resolver Registry deployment](https://horizon-testnet.stellar.org/transactions/1532a403acc488b651692b6d26fd393535014176b6905909e8d133cf475875d7)

Horizon reports both transactions as successful and each contains an
`invoke_host_function` operation.

## Suggested Hub Submission

- **Name:** OverSync
- **Category:** Infrastructure
- **Network:** Testnet
- **Tags:** `cross-chain, bridge, soroban, htlc, non-custodial, ethereum, stellar-wave`
- **Website:** https://oversync.vercel.app
- **GitHub label:** `Core repository`
- **GitHub repository:** https://github.com/karagozemin/OverSync
- **Soroban Contract ID:** `CDIKSJKVMXKGBRD3BBEBMF7Q4GQJ52ECU6R6G5HEKXKXVGGWK2CTA6JK`
- **Research images:** the repository logo plus a screenshot of the testnet-only
  bridge interface or the public contract explorer.

## Hub Submission Confirmation

- **Hub project ID:** `123`
- **Status:** `submitted` (awaiting Hub administrator review)
- **Submitted network:** `Testnet`
- **Uploaded research image:** https://dlwcywvybsedgmcggmjn.supabase.co/storage/v1/object/public/research-images/72/1788159603769-n8d4ry.png

## Sources

1. [Drips Stellar Wave repository catalog](https://www.drips.network/wave/stellar/repos)
2. [OverSync repository and README](https://github.com/karagozemin/OverSync)
3. [OverSync Soroban HTLC contract explorer](https://stellar.expert/explorer/testnet/contract/CDIKSJKVMXKGBRD3BBEBMF7Q4GQJ52ECU6R6G5HEKXKXVGGWK2CTA6JK)
4. [HTLC deployment transaction on Horizon](https://horizon-testnet.stellar.org/transactions/f7583c2cca3ca542a4754677e98f1ce9c4e1fa93ebe534ed094110b0e58201d7)
5. [Resolver Registry deployment transaction on Horizon](https://horizon-testnet.stellar.org/transactions/1532a403acc488b651692b6d26fd393535014176b6905909e8d133cf475875d7)
