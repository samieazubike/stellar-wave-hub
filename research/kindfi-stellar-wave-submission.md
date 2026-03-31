# KindFi — Stellar Wave Research Submission

## Project Selected

- **Project:** KindFi
- **Wave source:** `kindfi-org/kindfi` listed in Stellar Wave repositories on Drips
- **Domain:** Social Impact / Crowdfunding / DeFi
- **Website:** https://kindfi.org
- **Repository:** https://github.com/kindfi-org/kindfi
- **Documentation:** https://kindfis-organization.gitbook.io/development

## Why This Matches the Task

KindFi is an active Stellar Wave Program participant (3x Points tier on Drips) with 102 forks and a live production platform. It is a full-stack, open-source Web3 crowdfunding platform that uses Stellar Soroban smart contracts as its core trust layer — not as an afterthought. The project is supported by the Stellar Development Foundation and targets real-world social impact in Latin America. It was not previously submitted to the Hub at the time of this submission.

## Verifiable On-Chain IDs

- **Auth Controller Contract (testnet):** `CAXLM3X6QF6YUZWUVNV3CFE4SMDTEJEWH3KN7ZTGO4WMYIFOLJJV66FE`
- **Account Contract (testnet):** `CBD4PVOPBSNKQ4LLNYLVKCY3PW6UXNDZ5GAQDXZDNFGVEKXPO3OVZLYA`
- **Account Factory Contract (testnet):** `CDEA3HFVIMUJ3MZPUST4CRZ5SVV3FMPB6PILU6MGSDQZKDLTVTQHRM4D`
- **Deployer/Source Account:** `GAC63U4ZEGRCIDFMUJM34EVIGOW4PSMJ6B66ELCWSF6ZVYSONKL6LIEA`

Verification endpoints:
- `https://horizon-testnet.stellar.org/accounts/GAC63U4ZEGRCIDFMUJM34EVIGOW4PSMJ6B66ELCWSF6ZVYSONKL6LIEA`
- `https://api.stellar.expert/explorer/testnet/contract/CAXLM3X6QF6YUZWUVNV3CFE4SMDTEJEWH3KN7ZTGO4WMYIFOLJJV66FE`
- `https://api.stellar.expert/explorer/testnet/contract/CBD4PVOPBSNKQ4LLNYLVKCY3PW6UXNDZ5GAQDXZDNFGVEKXPO3OVZLYA`
- `https://api.stellar.expert/explorer/testnet/contract/CDEA3HFVIMUJ3MZPUST4CRZ5SVV3FMPB6PILU6MGSDQZKDLTVTQHRM4D`

Deployment date confirmed in `auth-deployment-info-testnet.txt`: **Wed Jan 14 15:29:28 CST 2026**

## What KindFi Does

KindFi is a Web3 crowdfunding platform that connects donors with verified social and environmental causes, primarily across Latin America. The core value proposition is **protocol-enforced accountability**: donations are held in Soroban smart contract escrows and released only when a project meets verified milestones. This removes the trust gap inherent in traditional charity platforms where funds can be misused after transfer.

The live platform at kindfi.org already hosts active campaigns across categories including clean water access, healthcare, education, mental health, and arts. Each campaign has a defined funding goal, minimum donation, and milestone structure visible on-chain.

## Technical Architecture (Detailed)

KindFi is a monorepo with five layers:

### 1. Smart Contract Layer (Rust / Soroban)

Five distinct contract systems are deployed:

**Auth System (3 contracts):**
- `Account Factory` — Deploys new Account contracts deterministically using WASM hash; only authorized entities can trigger deployments
- `Auth Controller` — Manages multi-signature authentication, dynamic signer sets, and authorization thresholds; verifies Ed25519 signatures
- `Account Contract` — Per-user contract; verifies Secp256r1 (WebAuthn-compatible) signatures; supports multi-device auth, recovery addresses, and device management

This architecture enables **decentralized, passwordless identity** on Stellar — users authenticate via hardware keys or biometrics rather than passwords.

**NFT System (2 contracts):**
- `KindFi NFT ("Kinders")` — Standard NFT using OpenZeppelin's `NonFungibleToken` standard; role-based access (minter, burner, metadata_manager); issued as contributor recognition
- `Academy Graduation NFT` — **Soulbound (non-transferable)** NFTs issued only after verified completion of all academy modules; cross-contract verification with ProgressTracker and BadgeTracker; on-chain metadata includes timestamp, version, and earned badges

**Academy System (3 contracts):**
- `Progress Tracker` — Tracks user progress through educational modules on-chain
- `Badge Tracker` — Manages badge assignments and completions
- `Academy Verifier` — Validates certification status for graduation NFT minting

**Reputation System (1 contract):**
- `Reputation Contract` — Tracks user scores, tiers, and streaks; admin-controlled tier thresholds; cross-contract integration with NFT contract to automatically update Kinders NFT metadata when a user levels up

**Escrow (via Trustless Work):**
KindFi integrates with Trustless Work's permissionless escrow infrastructure for milestone-based fund release. This is a deliberate architectural choice: rather than building a custom escrow, KindFi leverages a battle-tested Soroban escrow primitive, reducing attack surface.

### 2. Indexer Layer

A SubQuery indexer streams on-chain Soroban events into a Supabase PostgreSQL database. This enables real-time UI updates (campaign progress, donation counts, milestone completions) without polling the chain directly.

### 3. Application Layer

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **AI Service:** Face detection/analysis for identity verification
- **Package structure:** Shared `packages/lib` (hooks, utilities, services) and `packages/drizzle` (ORM schema)

### 4. Trust Model

The architecture creates a layered trust model:
1. Funds are locked in Soroban escrow — neither the platform nor the campaign creator can unilaterally withdraw
2. Milestone verification is required before each fund release tranche
3. All transactions are recorded on Stellar's immutable ledger
4. Contributor identity is managed via on-chain Account contracts, not a centralized auth server

## Stellar Integration

KindFi uses Stellar in three distinct ways:
1. **Escrow infrastructure** — Soroban contracts hold and release campaign funds based on milestone verification
2. **Identity** — WebAuthn-compatible Account contracts replace traditional auth; each user has an on-chain identity
3. **Reputation & credentials** — NFTs and reputation scores are on-chain, portable, and verifiable by any third party

The project uses `@stellar/stellar-sdk` and the Stellar CLI for contract deployment, and integrates with Horizon for account/transaction data.

## Community & Ecosystem

- **Forks:** 102 (high contributor engagement for a Wave project)
- **Stars:** 18
- **Commits:** 431+
- **Telegram community:** https://t.me/+CWeVHOZb5no1NmQx (active contributor channel)
- **Stellar Wave tier:** 3x Points (highest tier on Drips)
- **SDF support:** Explicitly listed as "Supported by Stellar Development Foundation" on kindfi.org
- **OpenZeppelin integration:** Uses OpenZeppelin Stellar Contracts for NFT standards and access control

## Submission Performed

Live API submission completed on March 28, 2026.

- **Hub endpoint:** `https://usestellarwavehub.vercel.app/api/projects`
- **Result:** Created project with `id: 66`, `slug: kindfi`, `status: submitted`
- **Category:** `social`
- **Tags:** `crowdfunding, soroban, escrow, nft, social-impact, stellar-wave, defi, identity, latam, open-source`
