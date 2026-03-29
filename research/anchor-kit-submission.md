# Anchor-Kit — Stellar Wave Research Submission

## Project Selected

- **Project:** Anchor-Kit
- **Wave source:** `0xNgoo/anchor-kit` — Stellar Wave Program repository
- **Domain:** Stellar Anchor Infrastructure / Developer Tooling / Payments
- **Repository:** https://github.com/0xNgoo/anchor-kit
- **Category:** Tools

## Why This Project

Anchor-Kit addresses one of the most significant barriers to Stellar ecosystem growth — the complexity of building SEP-compliant anchor services. While Stellar's SEP (Stellar Ecosystem Proposal) standards define how fiat-to-crypto bridges should work, implementing them correctly requires deep protocol knowledge, careful security implementation, and significant boilerplate. Anchor-Kit eliminates all of that with a developer-friendly, type-safe SDK that makes building Stellar anchors as simple as configuring a JavaScript object. This is foundational infrastructure that enables any fintech, payment provider, or bank to connect to the Stellar network.

## What The Project Does

Anchor-Kit is a developer-friendly, type-safe TypeScript SDK for building Stellar Anchor services. It abstracts the complexity of Stellar Ecosystem Proposals — specifically SEP-6 (Deposit and Withdrawal API), SEP-24 (Hosted Deposit and Withdrawal), and SEP-31 (Cross-Border Payments) — allowing developers to focus on business logic while ensuring protocol compliance and security.

The SDK provides a complete anchor implementation out of the box:

1. **SEP-24 Interactive Flows** — Hosted deposit and withdrawal flows with minimal configuration. Developers mount a single Express router and get fully compliant interactive deposit/withdrawal endpoints instantly.

2. **SEP-10 Authentication** — Built-in Stellar Web Authentication handling. The SDK manages challenge generation, signature verification, and JWT token issuance without requiring developers to understand the underlying cryptography.

3. **Escrow and Settlement** — Background job processing for transaction monitoring, automatic settlement triggering, and configurable retry logic for failed settlements.

4. **Multi-Database Support** — SQLite for development and testing, PostgreSQL for production. The database adapter pattern allows switching between backends without changing application code.

5. **Webhook Integration** — Built-in webhook signature verification and event processing, enabling real-time notifications to partner systems.

## Technical Architecture

Anchor-Kit uses a modular, layered architecture:

**Core Layer (`src/core/`):**
Configuration management via `AnchorConfig` with deep validation — validates Stellar keys, URLs, network passphrases, database URLs, and rate limit parameters. Immutable frozen configuration snapshots prevent runtime mutation bugs. Typed error hierarchy (`SdkError`, `ValidationError`, `HorizonSubmitError`, `EscrowNotFoundError`) enables precise error handling in consumer code.

**Runtime Layer (`src/runtime/`):**
- `SqlDatabaseAdapter` — SQL persistence for transactions, escrow records, and audit logs
- `InMemoryQueue` — Background job processing with configurable concurrency
- `TransactionWatcher` — Stellar Horizon polling for transaction confirmation
- `DefaultWebhookProcessor` — Webhook signature verification and event dispatch
- `ExpressRouter` — Drop-in Express middleware mounting all SEP endpoints

**Validation Layer (`src/utils/validation.ts`):**
Runtime schema validation for all configuration objects including `ServerConfigSchema`, providing integrators with ergonomic partial config validation before passing to `createAnchor()`.

**SEP Integration:**
The SDK integrates directly with Stellar's Horizon API for account queries, transaction submission, and status monitoring. SEP-10 challenge/response authentication uses `@stellar/stellar-sdk` for XDR transaction construction and signature verification.

## Stellar Integration Details

Anchor-Kit uses Stellar specifically for:

- **SEP-10 Web Authentication** — Challenge transactions signed by the user's Stellar keypair, verified server-side
- **SEP-24 Interactive Deposit/Withdrawal** — JWT-authenticated interactive flows linked to Stellar transactions
- **Horizon API Integration** — Real-time transaction monitoring via polling with configurable intervals
- **Network Support** — Testnet, mainnet, and futurenet with automatic passphrase resolution
- **Transaction Submission** — Signed XDR transaction submission with error code parsing and retry logic

## Independent Research Assessment

Anchor-Kit fills a genuine gap in the Stellar developer ecosystem. Building SEP-compliant anchors from scratch typically requires 2-3 months of development time and deep Stellar protocol expertise. Anchor-Kit reduces this to hours. The library's strict TypeScript types, comprehensive validation, and modular architecture indicate production-ready engineering standards.

The SDK ships with 85+ unit tests covering configuration validation, error handling, database adapters, queue processing, and webhook verification. The `ServerConfigSchema` export enables integrators to validate partial configurations programmatically — a small but ergonomic improvement that reduces misconfiguration errors in production deployments.

## Verified Repository Artifacts

- **Repository:** https://github.com/0xNgoo/anchor-kit
- **Package:** `anchor-kit` v0.0.4-beta
- **Key exports verified:** `createAnchor`, `AnchorInstance`, `ValidationError`, `ServerConfigSchema`, `validateServerConfig`
- **Stellar SDK dependency:** `@stellar/stellar-sdk ^14.6.0`
- **SEPs implemented:** SEP-6, SEP-24, SEP-31, SEP-10

## Submission Confirmed

Live submission completed successfully on March 29, 2026.

- **Hub URL:** https://usestellarwavehub.vercel.app
- **Status:** SUBMITTED (pending admin approval)
- **Account:** spiffamani
- **Submitted:** 29/03/2026