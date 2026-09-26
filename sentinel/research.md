# Sentinel — Stellar Wave Hub research

Research date: 24 September 2026. Researcher: [V1ctor-o](https://github.com/V1ctor-o). Related issue: [#308](https://github.com/samieazubike/stellar-wave-hub/issues/308).

## Eligibility and duplicate check

- The [Drips Stellar Wave approved repo directory](https://www.drips.network/wave/stellar/repos) lists [furkanyesildag/sentinel](https://github.com/furkanyesildag/sentinel) as an approved project (2x Points). This is the required program evidence.
- Before researching it, I searched the Hub's [Explore](https://usestellarwavehub.vercel.app/explore) page for **Sentinel**; it displayed “No projects found.” I also checked the [public pending queue](https://usestellarwavehub.vercel.app/queue); no Sentinel entry appeared among its 17 pending submissions. This is a point-in-time check, not a claim about unpublished drafts.

## Proposed Hub fields

- **Name:** Sentinel — DeFi Risk Copilot for Stellar
- **Category:** DeFi
- **Network:** Testnet
- **Tags:** `blend`, `liquidation-risk`, `soroban`, `risk-monitoring`
- **Repository:** https://github.com/furkanyesildag/sentinel
- **Live demo:** https://son-fawn.vercel.app/
- **Verified Soroban contract ID:** `CCBOH4QO4UQ5MR4EJV2VOWOGP3S5J2T5ZPXQHNXSJJKDTVYO7UKQMGTK` (Guardian, **Stellar Testnet**)
- **One-line summary:** Testnet risk monitoring and opt-in reserve protection for Blend borrowers on Stellar.

## Original project description (302 words)

Sentinel is a testnet risk interface for people who borrow against collateral in Blend lending pools on Stellar. Its practical question is how a borrower learns that a position is approaching liquidation before a lender's liquidation mechanism acts. The browser app reads a connected wallet's XLM balance and Blend position, lets the user set an on-chain warning threshold, and displays risk assessments and contract events. A no-wallet demo uses a live sample testnet account, making the interface inspectable without granting wallet access.

The code is split between a React/Vite dashboard, a shared TypeScript package for Stellar RPC and contract interactions, and three Rust Soroban contracts. The alert registry stores each user's chosen threshold. The risk monitor calls that registry and classifies a supplied health factor as safe, warning, or breached, emitting events. The guardian lets a user authorize a policy and deposit an XLM reserve through the native XLM asset contract. A permissionless call can release that reserve only to the beneficiary fixed by the user's policy. The testnet explorer independently shows a policy call, reserve funding, and a protect invocation returning 20,000,000 stroops, or 2 XLM.

There are important limits to this demonstration. The guardian's protect function accepts the health factor as a call argument; the contract does not itself verify a Blend position or oracle value. Anyone can therefore trigger a release with a low argument, although the recipient cannot be redirected. This version returns the reserve to the user rather than repaying Blend debt automatically. The README labels the AI explanation, automatic keeper, and messaging alerts as future work, and the sample account shown in the demo had no open Blend position when checked. The project should be evaluated as an active testnet prototype with a verifiable contract lifecycle, not as a proven automated liquidation defense or mainnet service.

## Technical and on-chain verification

The [deployment manifest](https://github.com/furkanyesildag/sentinel/blob/main/contracts/deployments.json) identifies the Guardian contract, its native XLM asset contract and transaction hashes. I opened the [Guardian's StellarExpert testnet page](https://stellar.expert/explorer/testnet/contract/CCBOH4QO4UQ5MR4EJV2VOWOGP3S5J2T5ZPXQHNXSJJKDTVYO7UKQMGTK) independently on 24 September 2026. It showed a WASM contract created on **29 June 2026**, and history for `set_policy`, `fund_reserve`, and `protect`. The [protect transaction](https://stellar.expert/explorer/testnet/tx/ceb5b5e2a151207c8a690371bde61edbb6fc6678978114ace628532f2ef0bbf1) is linked from that on-chain history. The `protect` invocation returned 20,000,000 stroops (2 XLM). This demonstrates one historical testnet exercise, not ongoing use or a successful Blend debt repayment.

I inspected [Guardian source](https://github.com/furkanyesildag/sentinel/blob/main/contracts/guardian/src/lib.rs): `set_policy`, `fund_reserve`, and `withdraw_reserve` require the user's authorization; `protect(user, current_hf_bps)` is permissionless, compares the caller supplied number to the stored threshold, and transfers the reserve to the policy beneficiary. Because the health factor is not authenticated in this function, it can be triggered early; this limits the meaning of “protection.” [Risk monitor source](https://github.com/furkanyesildag/sentinel/blob/main/contracts/risk_monitor/src/lib.rs) cross-calls the alert registry and publishes events, but also receives its current health factor as an input. The [project README](https://github.com/furkanyesildag/sentinel#readme) labels oracle-backed automation, direct Blend repayment, LLM explanations, and outbound alerts as later steps. Neither the repo nor the explorer establishes a deployed mainnet version.

## Team and community

The public repo is maintained under [furkanyesildag](https://github.com/furkanyesildag); its README invites use of the [live demo](https://son-fawn.vercel.app/) and documents wallet options, tests, and a contribution path through GitHub. The stated 50-user onboarding goal is marked in progress. I found no verified team roster or independent adoption figures, so these should not be asserted in the Hub entry.

## Supporting screenshots and links

- [Live product dashboard screenshot](https://github.com/furkanyesildag/sentinel/blob/main/docs/screenshots/06-mobile-dashboard.png) — project-maintained capture, illustrates the interface; not proof of adoption.
- [Network activity panel screenshot](https://github.com/furkanyesildag/sentinel/blob/main/docs/screenshots/12-analytics.png) — project-maintained capture, inspect current chain data before quoting counts.
- [Guardian on-chain history](https://stellar.expert/explorer/testnet/contract/CCBOH4QO4UQ5MR4EJV2VOWOGP3S5J2T5ZPXQHNXSJJKDTVYO7UKQMGTK) — independent evidence of deployment and calls. A current screenshot of this view and the live no-wallet demo were prepared for the Hub submission.

## Sources

1. [Drips approved repo directory](https://www.drips.network/wave/stellar/repos) — program membership.
2. [Repository README and architecture](https://github.com/furkanyesildag/sentinel#architecture) — proposed flow, deployment caveats, community.
3. [Guardian source](https://github.com/furkanyesildag/sentinel/blob/main/contracts/guardian/src/lib.rs) and [risk monitor source](https://github.com/furkanyesildag/sentinel/blob/main/contracts/risk_monitor/src/lib.rs) — implementation and limitations.
4. [Deployment manifest](https://github.com/furkanyesildag/sentinel/blob/main/contracts/deployments.json) — claimed identifiers and transactions.
5. [StellarExpert testnet Guardian record](https://stellar.expert/explorer/testnet/contract/CCBOH4QO4UQ5MR4EJV2VOWOGP3S5J2T5ZPXQHNXSJJKDTVYO7UKQMGTK) — independent contract and transaction confirmation.
6. [Live demo](https://son-fawn.vercel.app/) — observed no-wallet sample account and product interface.
