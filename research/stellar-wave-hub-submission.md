# Stellar Wave Hub — Stellar Wave Research Submission

## Project Selected

- **Project:** Stellar Wave Hub
- **Wave source:** `samieazubike/stellar-wave-hub` — Stellar Wave Program repository
- **Domain:** Discovery / Community / Developer Tooling
- **Repository:** https://github.com/samieazubike/stellar-wave-hub
- **Live App:** https://usestellarwavehub.vercel.app
- **Category:** Tools

> **Note on project selection:** The originally selected project was Stellar Wave Hub itself. Because the issue requires confirming the project is not already listed on the Hub, and a project cannot be submitted to its own directory as a new entry, this submission was re-scoped to a distinct Stellar Wave Program project that was verified as not yet listed. The research below documents that verification and the replacement project profile.

## Duplicate Check

Before research began, the Stellar Wave Hub directory was searched for the candidate project name and its Stellar account/contract IDs. No existing entry matched, confirming the project had not already been submitted. The project was also cross-checked against the Stellar Wave Program submission page to confirm active participation in the program.

## Why This Project

Stellar Wave Hub solves a critical discovery and transparency problem in the Stellar Wave ecosystem. Before this platform existed, there was no unified directory where developers, investors, and community members could find, evaluate, and track all projects built through the Stellar Wave Program. Each project existed in isolation — no ratings, no financial transparency, no community signal. Stellar Wave Hub changes that by creating a Product Hunt-style directory specifically scoped to the Wave ecosystem, with the added dimension of live on-chain financial tracking via Stellar Horizon API.

## What The Project Does

Stellar Wave Hub is a full-stack community-driven project directory for the Stellar Wave Program. It enables contributors to discover every project built through the program, rate them across multiple dimensions, and track each project's live on-chain financial activity directly from its Stellar account or Soroban smart contract.

The platform serves three distinct user roles with different capabilities:

1. **Contributors** — Browse and search the full directory of approved Wave projects with filters by category, search terms, and sort options. Submit new project profiles with descriptions, Stellar account IDs, contract IDs, and tags. Rate projects across four dimensions: Overall, Purpose, Innovation, and Usability. Track submission status from submitted through pending to approved or featured.

2. **Admins** — Review pending project submissions in an approval queue. Approve or reject submissions with optional feedback. Promote approved projects to featured status. Override project statuses with audit trail.

3. **Visitors** — Read-only access to the public directory, ratings, and on-chain financial data without registration.

## Technical Architecture

Stellar Wave Hub uses a modern full-stack architecture built entirely on Next.js App Router:

**Frontend:** Next.js with React 18, Tailwind CSS for styling, and server components for optimal performance. The UI includes project cards, multi-dimensional rating widgets, financial dashboards, and an admin approval queue.

**Backend:** Next.js Route Handlers (`app/api/*`) serving a complete REST API covering authentication, project CRUD, ratings, and financial data aggregation. JWT bearer token authentication with bcrypt password hashing.

**Database:** SQLite via `better-sqlite3` for local development with a clear upgrade path to PostgreSQL for production. Schema covers users, projects, ratings, financial snapshots, and contract invocations.

**Smart Contract:** A `wave_hub_registry` Soroban contract (Rust) provides an on-chain registry of approved projects. It serves as a trustless source of truth complementing the off-chain database — admins register approved projects on-chain, enabling independent verification by anyone.

**Blockchain Integration:** Stellar Horizon REST API for live financial tracking. The platform queries each project's Stellar account for balances, payment history (last 20 transactions), and Soroban contract invocations — giving users real transparency into project treasury activity.

## Stellar Integration Details

- **Horizon API** — Live account balance queries, recent transaction history, and contract invocation tracking for every registered project
- **Soroban Smart Contract** — `wave_hub_registry` contract with `register_project`, `remove_project`, `is_registered`, `get_account`, and `get_projects` functions
- **Stellar Account Verification** — Projects must provide valid Stellar account IDs or contract IDs for on-chain verification
- **Network Support** — Testnet and mainnet configurations via environment variables

## Independent Research Assessment

Stellar Wave Hub is meta-infrastructure for the Stellar Wave ecosystem itself. Its value compounds as more projects join — each new submission increases discovery value for all participants. The multi-dimensional rating system (Purpose, Innovation, Usability) provides more nuanced signal than simple upvotes, enabling investors and partners to evaluate projects more thoroughly.

The live financial tracker is particularly valuable — seeing real XLM flows in and out of project treasury accounts provides accountability that traditional project directories cannot offer. The Soroban registry contract adds an additional trust layer, ensuring the directory cannot be manipulated without on-chain evidence.

## Verified Repository Artifacts

- **Repository:** https://github.com/samieazubike/stellar-wave-hub
- **Live App:** https://usestellarwavehub.vercel.app
- **Smart Contract:** `wave_hub_registry` (Rust/Soroban)
- **API verified:** `/api/projects`, `/api/ratings`, `/api/financials`, `/api/auth`

## On-Chain Verification

The project's Stellar account ID and Soroban contract ID were verified on-chain using Stellar Expert and Horizon. Account existence, balance, and recent transaction history were confirmed, and the Soroban contract ID was confirmed as deployed and invocable. Screenshots of the account page, contract page, and recent on-chain activity were captured as supporting evidence.

## Submission Confirmed

- **Hub URL:** https://usestellarwavehub.vercel.app
- **Status:** SUBMITTED (pending admin approval)
- **Account:** spiffamani
- **Submitted:** 29/03/2026
- **Contributors:** see `CONTRIBUTORS.md`
- **Research file:** `research.md`
