# SoroSusu — Stellar Wave Research Submission

## Project Identity

- **Project Name:** SoroSusu
- **Category:** DeFi
- **Wave Source:** `SoroSusu-Protocol/sorosusu-contracts` is a Stellar Wave / Drips Wave participant — the repository description states it is a "trustless, automated savings circle protocol on the Stellar network. Built with Soroban SDK for the Drips Wave."
- **Repository (smart contracts):** https://github.com/SoroSusu-Protocol/sorosusu-contracts
- **Organization:** https://github.com/SoroSusu-Protocol
- **Logo / Profile Image:** https://github.com/SoroSusu-Protocol.png

## Submission Fields

- **Name:** SoroSusu
- **Category:** defi
- **Stellar network:** mainnet
- **Soroban contract ID:** `CAH65U2KXQ34G7AT7QMWP6WUFYWAV6RPJRSDOB4KID6TP3OORS3BQHCX`
- **Tags:** `defi, soroban, rosca, savings-circle, susu, smart-contracts, usdc, collateral, quadratic-voting, stellar-wave`
- **GitHub repositories:**
  - Smart contracts: https://github.com/SoroSusu-Protocol/sorosusu-contracts
- **Research images (to attach during web submission):**
  - Contract architecture / module map
  - Stellar Expert mainnet contract page for `CAH65U2KXQ34G7AT7QMWP6WUFYWAV6RPJRSDOB4KID6TP3OORS3BQHCX`
  - Drips Wave source listing

## Description

SoroSusu is a Soroban-native protocol that brings the centuries-old "susu" / ROSCA (Rotating Savings and Credit Association) model on-chain on Stellar. In a susu, a fixed group of members each contributes a set amount every round, and one member receives the entire pooled "pot" per round until everyone has been paid once. These circles are widespread across West Africa, the Caribbean, and South Asia, but they traditionally depend on a trusted human organizer who can mismanage or abscond with funds. SoroSusu replaces that organizer with a Soroban smart contract that enforces contributions, rotations, and payouts automatically, so participants get the social-savings discipline of a susu without the counterparty risk.

The contract is more than a simple rotation loop. Its public interface (`create_circle`, `join_circle`, `deposit`, `finalize_round`, `claim_pot`) implements the core lifecycle, while a set of risk and governance features harden it against the failure modes that break real-world savings circles. High-value circles require staked collateral (`stake_collateral`, `slash_collateral`, `release_collateral`) with a 20% default ratio (`DEFAULT_COLLATERAL_BPS = 2000`) so that a member who defaults after receiving an early payout can be penalized rather than walking away. An insurance pool, funded by a per-contribution charge, lets `trigger_insurance_coverage` cover an absent member's round so the rotation does not stall, and a "buddy system" (`pair_with_member`) provides mutual payment backstops. Defaulters can be flagged (`mark_member_defaulted`) and removed via `eject_member`, which also burns their membership NFT.

Governance is handled democratically and is deliberately resistant to whale capture. Members can `request_leniency` to extend a contribution deadline, and the group votes (`vote_on_leniency`, `finalize_leniency_vote`) with a 51% simple-majority threshold over a 24-hour window. For larger structural decisions in circles with ten or more members, SoroSusu switches to quadratic voting (`create_proposal`, `quadratic_vote`, `execute_proposal`), where vote cost scales with the square of vote weight and voting power is derived from a square-root function (`update_voting_power`) — a design choice that mitigates wealth concentration and ties influence to demonstrated participation through a `SocialCapital` trust metric. Abuse is further limited by a 300-second rate limit between circle creations (`RATE_LIMIT_SECONDS = 300`).

On the Stellar side, SoroSusu is written in Rust against `soroban-sdk` 22.0.0 and compiled to WASM (`cdylib`). It settles in real value — both native XLM and USDC — and composes with two external contracts through typed clients: a `SusuNftClient` that mints and burns NFTs representing live circle membership, and a `LendingPoolClient` (set via `set_lending_pool`) that can supply and withdraw idle pot funds, hinting at yield generation on capital waiting between rounds. State is organized through a `DataKey` enum covering circles, members, deposits, proposals, votes, leniency requests, collateral vaults, and defaulted-member sets, giving the contract a clear and auditable storage model. The protocol is deployed and live on Stellar mainnet, making it a verifiable, production-stage DeFi entry rather than a concept — and a culturally meaningful one, since it digitizes an informal-finance primitive that millions of people already trust offline.

## On-chain Verification

- **Network:** Stellar mainnet (public)
- **Soroban contract ID:** `CAH65U2KXQ34G7AT7QMWP6WUFYWAV6RPJRSDOB4KID6TP3OORS3BQHCX`
- **Format check:** Matches the Hub's required Soroban contract pattern `^C[A-Z2-7]{55}$` — 56 characters, valid StrKey base32 alphabet (no `0/1/8/9`).
- **Recommended verification endpoint:** `https://api.stellar.expert/explorer/public/contract/CAH65U2KXQ34G7AT7QMWP6WUFYWAV6RPJRSDOB4KID6TP3OORS3BQHCX`
- **Explorer (browser):** `https://stellar.expert/explorer/public/contract/CAH65U2KXQ34G7AT7QMWP6WUFYWAV6RPJRSDOB4KID6TP3OORS3BQHCX`

> Note: This contract ID is published by the project as its mainnet deployment in `sorosusu-contracts/README.md`. The identifier was validated against the Hub's StrKey regex. A live Stellar Expert lookup could not be executed from the research sandbox because outbound access to `api.stellar.expert` is blocked by the environment's egress policy; the verification endpoints above should be opened to confirm the contract resolves before/at submission time.

## Research Sources

- SoroSusu contracts repository `README.md` (project overview, ROSCA mechanics, deployed contract ID, supported assets)
- SoroSusu `src/lib.rs` (public functions, `DataKey` storage model, external `SusuNftClient` / `LendingPoolClient` interfaces, constants)
- SoroSusu `Cargo.toml` (`soroban-sdk` 22.0.0, crate types, edition)
- Drips "Stellar Wave" program listing (Wave participation / source)

## Submission Checklist

- [x] Verified as a Stellar Wave–visible project (Drips Wave; repo states "Built with Soroban SDK for the Drips Wave")
- [x] Confirmed the project is not already in the Hub's submitted/approved project list
- [x] Wrote an original 200+ word technical research description
- [x] Recorded a deployed mainnet Soroban contract ID and validated its StrKey format
- [ ] Live Stellar Expert resolution (blocked by sandbox egress policy — verify via the endpoints above at submission time)
- [x] Selected category (`defi`) and accurate tags
- [ ] Attach research screenshots in the web submission form (architecture, on-chain contract page, Wave source)
- [ ] Submit via https://usestellarwavehub.vercel.app/submit (requires an authenticated Hub account)
