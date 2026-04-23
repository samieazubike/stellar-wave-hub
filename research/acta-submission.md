# ACTA — Stellar Wave Research Submission

## Project Selected

- **Project:** ACTA
- **Wave source:** `ACTA-Team/contracts-acta` + `ACTA-Team/dApp-ACTA` + `ACTA-Team/sdk` — Stellar Wave Program repositories (4x Points on Drips)
- **Domain:** RegTech / Compliance / Identity / Verifiable Credentials
- **Website:** https://acta.build
- **dApp:** https://dapp.acta.build
- **Documentation:** https://docs.acta.build
- **Contract Repository:** https://github.com/ACTA-Team/contracts-acta
- **dApp Repository:** https://github.com/ACTA-Team/dApp-ACTA
- **SDK Repository:** https://github.com/ACTA-Team/sdk
- **NPM Package:** `@acta-team/acta-sdk` (v1.1.9)

## Why This Matches the Task

ACTA is a Stellar Wave Program participant at the 4x Points tier on Drips. It is a purpose-built compliance infrastructure project — the platform exists to issue, manage, and verify W3C Verifiable Credentials 2.0 on Stellar via Soroban smart contracts. Its primary use cases include KYC/AML compliance credentials, digital identity verification, professional licensing, and audit-trail generation for regulated industries. Unlike projects that treat compliance as a secondary feature, ACTA's entire architecture is designed around the regulatory need for tamper-proof, privacy-preserving credential management. The project was not previously submitted to Stellar Wave Hub.

## Verifiable On-Chain IDs

- **VC-Vault Contract (testnet):** `CCOTIN3C6THFBEBYG6CJBOYEUPMPH5BHATWMCXPT52M6T7YZURJAC64O`
- **Contract Deployer (testnet):** `GCVRCDEQYWRJVUGKMVXBRF45EX2SMZOLCT5IZN2KK6ILU7I3FZ64O36M`
- **API Public Key (testnet):** `GALATMPLP6DT7YVUSYCNJZI2VHQCUNJ4O7KRFZMBE5VKSTG7SU7IKQET`

Verification endpoints:
- `https://api.stellar.expert/explorer/testnet/contract/CCOTIN3C6THFBEBYG6CJBOYEUPMPH5BHATWMCXPT52M6T7YZURJAC64O`
- `https://horizon-testnet.stellar.org/accounts/GCVRCDEQYWRJVUGKMVXBRF45EX2SMZOLCT5IZN2KK6ILU7I3FZ64O36M`
- `https://horizon-testnet.stellar.org/accounts/GALATMPLP6DT7YVUSYCNJZI2VHQCUNJ4O7KRFZMBE5VKSTG7SU7IKQET`

On-chain activity confirmed: 164 contract events, 421 storage entries (active vaults and credentials).

## What ACTA Does

ACTA is a verifiable credentials infrastructure for the Stellar blockchain that enables businesses and platforms to issue, store, verify, and revoke W3C Verifiable Credentials 2.0 entirely on-chain using Soroban smart contracts. The platform addresses a fundamental gap in blockchain-based compliance: the need for tamper-proof, privacy-preserving credential management that satisfies regulatory requirements without centralizing sensitive user data.

At its core, ACTA provides a "zero databases architecture" — encrypted credential payloads are anchored directly on the Stellar ledger and managed through a unified smart contract called vc-vault. There is no backend database storing credentials. Instead, each user controls a personal vault on-chain, and only they can decrypt the contents. Issuers (banks, fintech platforms, compliance providers) can issue credentials into a user's vault after being explicitly authorized by the vault owner, enforcing user consent at the protocol level.

The credential lifecycle is deterministic and publicly auditable. Every credential passes through well-defined states — Active, Revoked, or Expired — with each transition recorded as a Soroban contract event. Verifiers (regulators, partner platforms, auditors) can check a credential's status by querying the contract directly, receiving a cryptographic proof of the current state without needing to contact the issuer or access the holder's private data.

For regulatory compliance specifically, ACTA enables platforms to issue KYC/AML credentials that prove a user has passed identity verification without re-exposing their personal documents. A fintech app can issue a "KYC Passed" credential after onboarding a user, and any downstream service in the Stellar ecosystem can verify that credential on-chain in one call — eliminating redundant KYC checks while maintaining compliance with Anti-Money Laundering regulations.

The platform also supports zero-knowledge proofs via Noir circuits for selective disclosure. Users can prove specific attributes (age over 18, residency in a particular jurisdiction, accreditation status) without revealing any other personal information. This directly supports GDPR data minimization principles and enables compliance with privacy regulations across jurisdictions.

## Technical Architecture

ACTA is structured as four layers:

### 1. Smart Contract Layer (Rust / Soroban)

A single unified contract (`vc-vault-contract` v0.21.0, soroban-sdk 23.4.0) that combines:

- **Vault management**: `create_vault`, `revoke_vault`, `set_vault_admin` — each user gets an on-chain vault controlled by their Stellar keypair
- **Issuer authorization**: `authorize_issuer`, `deny_issuer` — vault owners explicitly grant or revoke credential issuance permissions per issuer address
- **Credential operations**: `push` (store encrypted VC data), `list_vc_ids`, `get_vc` — manage credential payloads in the vault
- **Issuance registry**: `issue`, `verify_vc`, `revoke` — global status registry tracking Active/Revoked/Expired state for every credential
- **Admin functions**: `initialize`, `set_contract_admin`, fee configuration, `upgrade`, `version`

The contract underwent a comprehensive security audit in February 2026 (documented in `docs/audit-acta-v1.md`), identifying 24 findings of which 23 were fixed. Coverage-guided fuzzing with six fuzz targets was implemented for ongoing security assurance.

### 2. SDK Layer (TypeScript / React)

Published as `@acta-team/acta-sdk` on npm (v1.1.9). Provides React hooks (`useVault`, `useCredential`, `useVaultRead`) for frontend integration. Handles Stellar transaction building, XDR signing via Freighter or WalletConnect, and API communication. Developers can integrate credential flows in minutes without writing contract calls manually.

### 3. API Layer

RESTful API at `https://acta.build/api/{network}/` providing:
- `/config` — returns RPC URL, network passphrase, and active contract ID
- Credential issuance and verification endpoints
- Public API key provisioning (`/public/api-keys`)
- Health monitoring (`/health`)

### 4. dApp Layer

A Next.js 16 application at `https://dapp.acta.build` providing a no-code interface for credential issuance, vault management, issuer authorization, and credential sharing via QR codes and links.

## Compliance Frameworks and Features

### KYC/AML Compliance
- Issue verifiable "KYC Passed" or "AML Cleared" credentials after identity verification
- Downstream services verify on-chain without accessing raw PII
- Eliminates redundant KYC across platforms in the Stellar ecosystem

### W3C Verifiable Credentials 2.0
- Full implementation of the W3C VC Data Model 2.0 standard
- Interoperable credential format recognized by global regulatory bodies
- Deterministic lifecycle states (Active / Revoked / Expired) with on-chain audit trail

### Selective Disclosure and Privacy
- Zero-knowledge proof support via Noir circuits (age verification, expiry validation, status checks)
- Users share only required attributes, not full credentials
- Supports GDPR data minimization and privacy-by-design principles

### Audit Trail and Reporting
- Every credential issuance, verification, revocation, and transfer emits on-chain events
- 164+ contract events and 421 storage entries demonstrate active production usage
- Publicly queryable state enables regulatory audits without centralized log access

### Role and Membership Attestation
- Verify roles, positions, and memberships without exposing raw PII
- Supports professional licensing, certifications, and access control tokens

## Stellar Integration

ACTA uses Stellar in three distinct ways:

1. **Soroban smart contracts** — The vc-vault contract manages the entire credential lifecycle on-chain, including vault creation, issuer authorization, credential storage, and status verification
2. **Stellar accounts for identity** — Users authenticate via Stellar wallets (Freighter, WalletConnect) using their keypair as their decentralized identity anchor. DIDs follow the format `did:pkh:stellar:{network}:{address}`
3. **On-chain data anchoring** — Encrypted credential payloads and status records are stored as Soroban persistent storage entries, providing immutable, publicly verifiable audit trails

The project uses `@stellar/stellar-sdk`, Stellar CLI for contract deployment, and integrates with Horizon for account and transaction data.

## Community and Ecosystem

- **GitHub organization:** 12 public repositories under `ACTA-Team`
- **Stellar Wave tier:** 4x Points (highest tier on Drips)
- **NPM SDK:** `@acta-team/acta-sdk` — 5 versions published, 21 weekly downloads
- **Security:** Completed security audit (February 2026) with 24 findings identified and 23 fixed
- **Fuzzing:** 6 coverage-guided fuzz targets for ongoing contract security
- **Social:** Twitter/X at `@ActaXyz`, Discord community, LinkedIn
- **Location:** Costa Rica
- **License:** Apache 2.0 (contracts), MIT (SDK)

## Submission Performed

Live API submission completed on April 23, 2026.

- **Hub endpoint:** `https://usestellarwavehub.vercel.app/api/projects`
- **Result:** Created project with `id: 81`, `slug: acta`, `status: submitted`
- **Category:** `identity`
- **Tags:** `compliance, regtech, aml, kyc, verifiable-credentials, identity, soroban, stellar-wave, w3c, privacy`
- **Account:** bandanadivya
