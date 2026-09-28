# Research: Boundless

## Project Name

Boundless

## Category

Social (crowdfunding / grants / hackathon and bounty funding for Web3 builders)

## Tags

soroban, crowdfunding, grants, hackathons, bounties, milestone-escrow, trustless-work, reputation, multisig, timelocked-upgrades, dao-tooling

## Links

- GitHub org: https://github.com/boundlessfi
- Smart contracts: https://github.com/boundlessfi/boundless-contract
- v1 web app (crowdfunding/grants frontend): https://github.com/boundlessfi/boundless
- Builders showcase (the repo registered in the Stellar Wave Program, 4x points multiplier):
  https://github.com/boundlessfi/builders
- v2 web app (in active development): https://github.com/boundlessfi/boundless-platform
- AI grading microservice: https://github.com/boundlessfi/ai-grading-service
- Stellar Wave Program listing: https://www.drips.network/wave/stellar/repos (boundlessfi/builders, 10 stars, 4x points)
- Stellar Community Fund project page (SCF #40, Build track, $110K awarded): https://communityfund.stellar.org/project/boundless-xqk
- Telegram: https://t.me/boundlessfi

## Verified Stellar/Soroban identifiers

**Mainnet (public network):**

- `boundless-events` contract — event records, escrow, and payouts for all four funding pillars:
  `CCFVEGOQJEM47LRAJU2LHEK4KTL5VYN7AOGZ2HH2GNHAMXTILNMMJGQZ`
- `boundless-profile` contract — on-chain reputation and per-token earnings:
  `CD3KH4OE7HDHHHUYFX3U4L7NLIILMXAY6HM5FEH2UH6UBOKX4HDNE3PC`

**Testnet:**

- `boundless-events`: `CBEODVJGUYCIYTVXD7KI5UG3BJ2UE4T7AGI2TGY3T4Q5GQRFGTRYVTZP`
- `boundless-profile`: `CCA3OAIBOZBUPHPRI5GI6N5PDTE7RTNLKAEID4JTC2YZIHIZNDX5Q6T3`

Verify on stellar.expert:
- https://stellar.expert/explorer/public/contract/CCFVEGOQJEM47LRAJU2LHEK4KTL5VYN7AOGZ2HH2GNHAMXTILNMMJGQZ
- https://stellar.expert/explorer/public/contract/CD3KH4OE7HDHHHUYFX3U4L7NLIILMXAY6HM5FEH2UH6UBOKX4HDNE3PC

These addresses come from the `Deployments` table in the `boundless-contract` README
(https://github.com/boundlessfi/boundless-contract/blob/master/README.md), which is
independently corroborated by merged PR #59 ("docs: rewrite README with deployed
addresses and versions," July 2026) and by later PR #82, which bumped `boundless-events`
from v1.1.0 to v1.2.0 as part of a mainnet upgrade — confirming the contracts are under
active, live maintenance rather than a one-off testnet demo.

## Original description

Boundless is a Web3 funding and collaboration platform built on Stellar that consolidates
four separate funding mechanisms — crowdfunding campaigns, grant programs, hackathons, and
bounties — behind a single on-chain "event" primitive. Instead of building four disconnected
products, the team ships one Soroban contract (`boundless-events`) that treats a crowdfunding
round, a grant pool, a hackathon, and a bounty as variations of the same underlying object:
an event with defined terms, an escrowed pool of funds, a set of submissions or milestones,
and a payout rule. A companion contract (`boundless-profile`) tracks each participant's
on-chain reputation and per-token earnings across all of that activity, so a builder's track
record persists and compounds no matter which of the four pillars they engage with.

The core problem Boundless is solving is trust asymmetry in community funding: backers and
grantors have historically had to trust that a platform or a project team will actually
release funds when milestones are met, with no independent, verifiable enforcement. Boundless
answers this by custodying funds in escrow inside the smart contract at event creation (or
through later top-ups), taking any protocol fee at deposit time, and only releasing money
through `select_winners` or per-milestone claim calls that are gated by the contract's own
rules rather than an operator's discretion. For deeper due-diligence or grant-style
verification, the project layers in the third-party Trustless Work protocol, whose API talks
directly to Stellar contracts to manage escrowed funds and automate proof-of-work checks
before a milestone can be marked complete.

Operationally, Boundless is unusually transparent about its own security posture for a
project at this stage: it has published a STRIDE threat model to the Stellar Development
Foundation's Soroban Security Audit Bank, gates contract admin actions behind a 2-of-3
multisig, and requires upgrades to go through a timelocked three-step process
(`propose_upgrade` → wait roughly one day on mainnet → `apply_upgrade` → `migrate`) rather
than an instant swap, giving the community a window to notice and react to a pending change
before it takes effect.

## Problem it solves

Community-funded projects (crowdfunding campaigns, grant programs, hackathon prizes, and
paid bounties) typically depend on a centralized platform, or on manual trust between the
funder and the builder, to decide when money actually moves. That creates two recurring
failure modes: funds can be released before real progress is verified, and funds can be
withheld or mismanaged with no independently checkable record. Boundless replaces that
manual trust step with on-chain escrow and milestone-gated release logic, so the rules for
"when does the builder get paid" are enforced by a smart contract rather than by whichever
party currently controls the money.

## How it uses Stellar

- Every campaign, grant round, hackathon, or bounty is created as an on-chain event inside
  the `boundless-events` Soroban contract, deployed on Stellar mainnet.
- Funds are held in escrow by the contract itself (with a whitelist of supported tokens)
  from the moment an event is created or topped up; fees are deducted at deposit time.
- Payouts happen through explicit contract calls (`select_winners` for competitive pillars,
  per-milestone claims for grants/crowdfunding) rather than off-chain transfers, so the
  release logic is auditable on-chain.
- The `boundless-profile` contract is called cross-contract by `boundless-events` to
  bootstrap a participant's profile on first touch, bump their reputation on wins or
  completed milestones, and register their per-token earnings on payout — building a
  persistent, on-chain reputation layer for builders across the whole platform.
- The Trustless Work protocol is integrated as an additional escrow/verification layer that
  interacts directly with the Stellar contracts for grant-style, proof-of-work-gated
  disbursement.
- Contract admin operations (pausing, fee-account rotation, upgrades) are multisig-gated and
  upgrades are timelocked on-chain, rather than being an off-chain administrative decision.
It's live in production today, running an active $300,000 USDC hackathon, a crowdfunding
campaign at 72% funded, and an approved ecosystem grant releasing in tranches — verifiable
directly on https://www.boundlessfi.xyz.

## Technical approach

- **Two-contract Soroban workspace.** `boundless-events` (event/escrow/payout logic for all
  four pillars via pillar-specific validation modules — `hackathon.rs`, `bounty.rs`,
  `grant.rs`, `crowdfunding.rs` — dispatched through one canonical `create_event` entry
  point) and `boundless-profile` (reputation and earnings), each independently versioned and
  deployed, with `boundless-events` calling into `boundless-profile` cross-contract.
- **Idempotent, paged operations.** Every state-mutating call carries an idempotency key
  (`idempotency.rs` in both contracts) to make retries safe, and cancellation is processed in
  batches (`process_cancel_batch`) rather than in one unbounded loop, to stay within Soroban's
  per-transaction resource limits.
- **Defensive arithmetic.** The team actively hardens the contracts against silent overflow:
  a merged PR replaced `saturating_add` (which clamps silently) with `checked_add` plus typed
  errors for both the profile contract's earnings counter and the events contract's ID
  counter, and another fixed missing `extend_persistent_ttl` calls across roughly 30
  persistent-storage write sites so state can't be prematurely archived by Soroban's TTL
  sweep.
- **Governance-gated admin surface.** Admin actions are behind a 2-of-3 multisig; upgrades
  are a three-step timelocked flow (`propose_upgrade` → timelock wait → `apply_upgrade` →
  `migrate`), with a pending proposal inspectable via `get_pending_upgrade()` and
  cancellable via `cancel_pending_upgrade()`.
- **Full-stack surface beyond the contracts.** A Next.js/React frontend (v1 in `boundless`,
  a v2 rewrite on Next.js 16 in `boundless-platform`) talks to a NestJS/Prisma/PostgreSQL
  backend (`boundless-nestjs`) through an OpenAPI-generated, typed REST client; auth uses
  better-auth; wallet support goes through the Stellar SDK and Freighter, with the v1 app
  additionally offering an in-app, backend-managed wallet with trustline sync for users who
  don't want to install a browser extension wallet.
- **AI-assisted hackathon grading.** A separate `ai-grading-service` microservice uses an
  Anthropic Claude model to grade hackathon submissions: it clones and analyzes the
  submitted GitHub repo (lines of code, language mix, complexity via Radon), extracts
  content from any uploaded PDFs/DOCX/Markdown, independently checks that the submitter's
  Stellar wallet and any claimed Soroban contract actually exist and have real on-chain
  activity, and then scores the submission across five weighted criteria (innovation,
  technical execution, Stellar integration, UX/design, completeness) before returning a
  structured accept/borderline/reject recommendation.
- **CI and audit trail.** GitHub Actions run rustfmt, build, and test on every contract PR;
  test fixture "snapshots" under `contracts/*/test_snapshots/` are treated as an audit trail
  that must be regenerated and committed deliberately whenever behavior changes.

## Team / community

Boundless is maintained under the `boundlessfi` GitHub organization. Per its Stellar
Community Fund project page, the core team size is 2. The project has received one SCF
award to date — SCF #40 ("Boundless on Stellar"), a $110,000 Build-track award — after an
earlier submission, SCF #36, failed prescreening at a requested $118,000. Despite the small
core team, the project draws a comparatively large outside contributor base through the
Stellar Wave Program (`boundlessfi/builders` carries a 4x points multiplier, one of the
higher multipliers among Wave repos) and through GrantFox's open-source bounty program,
which is visible in the `boundless-contract` repo's merged PRs from external contributors
(e.g. `chigozzdevv`, `Shadow-MMN`, `jjb9707`) fixing specific, bounty-labeled issues. The
project maintains a public Telegram channel at t.me/boundlessfi and links its work
transparently through GitHub issues that track open security-hardening items against its
own published threat model.

## Sources

1. https://github.com/boundlessfi/boundless-contract/blob/master/README.md — primary source
   for both contracts' purpose, architecture, and the mainnet/testnet deployment table with
   contract addresses and versions.
2. https://github.com/boundlessfi/boundless-contract/pull/59 — merged PR that introduced the
   deployments table; independently corroborates the exact mainnet addresses above.
3. https://github.com/boundlessfi/boundless-contract/pull/82 — merged PR bumping
   `boundless-events` to v1.2.0 on mainnet, confirming the deployment is actively maintained,
   not abandoned.
4. https://github.com/boundlessfi/boundless-contract/pull/101 — merged PR hardening
   arithmetic (checked_add vs saturating_add) in both contracts.
5. https://github.com/boundlessfi/boundless-contract/issues/143 — tracking issue referencing
   the STRIDE threat model submitted to the SDF Soroban Security Audit Bank and the mainnet
   1.7.0 migration.
6. https://github.com/boundlessfi/boundless/blob/main/README.md — v1 web app: tech stack,
   feature list, Trustless Work integration, in-app wallet details.
7. https://github.com/boundlessfi/boundless-platform — v2 web app README: current stack
   (Next.js 16, TanStack Query, better-auth, typed OpenAPI client).
8. https://github.com/boundlessfi/ai-grading-service — README describing the Claude-based
   hackathon grading microservice and its on-chain-activity verification step.
9. https://communityfund.stellar.org/project/boundless-xqk and
   https://communityfund.stellar.org/dashboard/submissions/recfC78Xt0enJyMa3 — Stellar
   Community Fund project and submission pages: team size, award history, official
   description of the milestone-based funding model.
10. https://www.drips.network/wave/stellar/repos — Stellar Wave Program repo listing,
    confirming `boundlessfi/builders` is an approved, 4x-points Wave repo.
11. https://stellar.expert/explorer/public/contract/CCFVEGOQJEM47LRAJU2LHEK4KTL5VYN7AOGZ2HH2GNHAMXTILNMMJGQZ
    and .../CD3KH4OE7HDHHHUYFX3U4L7NLIILMXAY6HM5FEH2UH6UBOKX4HDNE3PC — on-chain explorer
    links for direct verification of both mainnet contracts (open these in-browser to
    confirm live status before submitting).

## Screenshots

All captured directly from the primary sources above, on 2026-09-24.

![Mainnet contract on stellar.expert — CCFVEGOQ...JGQZ, WASM contract, ~1,730 USDC in escrow, live transaction activity](research/boundless-stellar-expert-contract.png)
*stellar.expert contract page for `boundless-events` on mainnet — confirms the contract is
live on-chain, currently holding escrowed USDC, with a recent transaction. Verifies source #11.*

![boundless-contract README Deployments table showing all four mainnet/testnet contract addresses and versions](research/boundless-deployments-table.png)
*The "Deployments" table in the `boundless-contract` README — shows both verified mainnet
contract addresses in context, matching the IDs listed above. Verifies source #1.*

![GitHub merged pull request list for boundlessfi/boundless-contract, 38 closed PRs from multiple contributors](research/boundless-github-pr-history.png)
*`boundless-contract` merged PR history — 38 closed PRs including external, bounty-labeled
contributions (e.g. `chigozzdevv`, `Shadow-MMN`), showing active, ongoing maintenance rather
than a one-off deployment. Verifies source #3/#4/#5.*

![Boundless project page on the Stellar Community Fund site, showing SCF #36 and SCF #40 tags, official logo, and description](research/boundless-scf-project-page.png)
*Official Boundless project page on the Stellar Community Fund site — confirms the SCF #36
and SCF #40 award history and official project description. Verifies source #9.*
