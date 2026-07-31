# [Research] Research & Upload a Stellar Wave Project to the Hub #24

## Summary

Researched and documented **SafeTrust** — a decentralized P2P escrow platform for the hospitality and tourism sector built on Stellar via the TrustlessWork API — and prepared its profile for submission to Stellar Wave Hub.

SafeTrust is an active Stellar Wave Program participant at the **4x Points tier** (highest multiplier on Drips), funded through both Drips Wave and GrantFox grants. Its on-chain integration holds booking deposits in non-custodial Stellar Soroban escrow contracts (via Trustless Work), releases funds automatically on checkout confirmation, and resolves disputes through transparent on-chain arbitration.

## Changes

### `research/safetrust-stellar-wave-submission.md` (new)

Independent research document covering:

- **Project overview** — what SafeTrust does, the industry problem it solves (deposit security, intermediary fees, dispute transparency, cross-border payments), and why it is a strong Stellar Wave candidate
- **Technical architecture** — the five-repo architecture: `frontend-SafeTrust` (Next.js 15), `backend-SafeTrust` (Hasura GraphQL + PostgreSQL + webhook), `dApp-SafeTrust` (Turborepo/pnpm monorepo), `landing-SafeTrust` (Astro), and the new `safetrust-ZK` (Noir zero-knowledge privacy layer)
- **Verifiable on-chain IDs** — platform Stellar address and testnet USDC address configuration, Trustless Work escrow contracts, and the verified on-chain escrow lifecycle (`POST /deployer/single-release` → sign XDR → `POST /helper/send-transaction` → broadcast to Stellar)
- **Stellar integration** — non-custodial escrow, USDC stablecoin funding, Freighter/Albedo/LOBSTR wallet auth, trustline management, testnet/mainnet support
- **Community & ecosystem** — verified repo stats (48 stars, 379 forks across five repos as of July 31, 2026), tech stack, testing infra, and funding badges
- **Submission details** — full field mapping for the Hub submission (`category: payments`, tags, GitHub repos, research images), confirming via `GET /api/projects` that SafeTrust is not yet present on the Hub

### `CONTRIBUTORS.md`

Updated the existing contributor entry for **Chidubem Kingsley** to include SafeTrust: `Researcher — MERCATO, SafeTrust` (per the template, listing all contributed projects; removed the duplicate card).

## Validation

- [x] Project is a verified Stellar Wave Program participant (4x Points tier on Drips; Drips Wave + GrantFox badges)
- [x] Description is original and thorough (200+ words; independent research beyond marketing material)
- [x] On-chain accounts / contracts documented and verifiable (Trustless Work escrow infrastructure, platform + USDC address env configuration, verified escrow lifecycle flow)
- [x] Category (`payments`) and tags accurate
- [x] Repo stats, repositories, and organization verified against live GitHub data on July 31, 2026
- [x] Confirmed SafeTrust not yet present on Stellar Wave Hub before submission

## Notes

- Submission to the Hub (form / `POST /api/projects`) is documented in the research file with the exact payload fields; this PR ships the research + contributor artifacts.
