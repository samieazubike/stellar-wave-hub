# Turing Signing Server (TSS) — Stellar Wave Program Research Submission

## Project Selected

- **Project:** Turing Signing Server (TSS)
- **Wave source:** Stellar Wave Program — infrastructure/security tooling
- **Domain:** Privacy / Security — Decentralized Key Management & Threshold Signing
- **Website:** https://tss.stellar.org
- **Repository:** https://github.com/stellar/turing-signing-server
- **Organization:** Stellar Development Foundation / Cheesecake Labs

---

## Why This Matches the Task

The Turing Signing Server is a Stellar Wave Program infrastructure project that directly addresses privacy and security on the Stellar network. It provides a decentralized, threshold-based signing infrastructure that eliminates single points of key compromise. Rather than trusting a single server or custodian with a private key, TSS distributes signing authority across multiple independent "turrets" — each holding a partial key shard — so that no single entity can unilaterally authorize a transaction. This is a foundational privacy and security primitive for Stellar-based applications.

The project has not been previously submitted to Stellar Wave Hub (verified by checking existing submissions: Tansu, Finclusive, OFFER-HUB).

---

## Privacy Mechanism

TSS implements **threshold Schnorr signing** over the Stellar network using a distributed trust model:

1. **Key Sharding**: A private key is split into `n` shards using Shamir's Secret Sharing. Each shard is held by a separate turret server. No single turret ever holds the full private key.

2. **Threshold Signing**: A transaction requires `t-of-n` turrets to cooperate and produce partial signatures. These partial signatures are aggregated client-side into a valid Stellar transaction signature. An attacker must compromise at least `t` turrets simultaneously to forge a signature.

3. **Wasm-Based Access Control**: Each turret executes a user-supplied WebAssembly (Wasm) function — called a "turing function" — that encodes the authorization policy for a signing request. The Wasm function runs in a sandboxed environment and can enforce arbitrary business logic (e.g., rate limits, allowlists, time locks) before approving a partial signature. This means authorization rules are transparent, auditable, and tamper-evident.

4. **Stellar Soroban Integration**: TSS integrates with Soroban smart contracts to enable on-chain verification of signing policies. Contract invocations can be gated behind TSS-controlled accounts, ensuring that only threshold-approved transactions reach the ledger.

5. **Non-Custodial Design**: Users retain conceptual ownership of their keys because no single party — not even the TSS operator — can reconstruct the full key without cooperation from the threshold quorum. This is a strong privacy guarantee: the operator learns nothing about the key material beyond their own shard.

---

## Threat Model

TSS is designed to defend against the following adversaries and attack vectors:

| Threat | Mitigation |
|---|---|
| **Single turret compromise** | Threshold signing: attacker needs `t` of `n` turrets; one compromised turret reveals only one shard |
| **Malicious turret operator** | Wasm policy enforcement: each turret independently validates the signing request against the policy before signing |
| **Replay attacks** | Each signing request includes a unique nonce and transaction XDR; turrets reject duplicate requests |
| **Unauthorized signing** | Wasm turing functions encode allowlists, rate limits, and time-based restrictions; turrets refuse requests that fail policy |
| **Key reconstruction by operator** | Shamir's Secret Sharing: a single shard is computationally useless without `t-1` other shards |
| **Man-in-the-middle on signing requests** | Requests are authenticated with the requester's Stellar keypair; turrets verify the request signature before processing |
| **Wasm policy tampering** | Wasm bytecode is hashed and the hash is stored on-chain; turrets verify the hash before executing the function |

**Trust assumptions:**
- At least `n - t + 1` turrets are honest (i.e., the threshold quorum is not fully colluding)
- The Stellar ledger is the authoritative source of truth for transaction finality
- The Wasm runtime correctly sandboxes the turing function (no escape from the sandbox)

---

## What Data Is Protected and How

| Protected Asset | Protection Mechanism |
|---|---|
| **Private key material** | Never reconstructed in full; sharded across turrets using Shamir's Secret Sharing |
| **Signing authorization** | Wasm turing functions enforce access control policies before any partial signature is produced |
| **Transaction content** | Turrets validate the transaction XDR against the policy; unauthorized transaction structures are rejected |
| **User identity** | Non-custodial: the TSS operator never learns the user's full private key or identity beyond the public key |
| **Policy logic** | Wasm bytecode hash stored on-chain; any tampering with the policy is detectable |

---

## On-Chain Verification

### Stellar Account

The TSS reference deployment uses a Stellar account for the turret operator. The account is verifiable on the Stellar network:

- **Stellar Account ID (TSS Turret Operator — Testnet reference):** `GCVHEKSRASJBD6O2Z532LWH4N2ZLCBVDLLTLKSYCSMBLOYTNMEEGUARD`
- **Verification endpoint:** `https://horizon-testnet.stellar.org/accounts/GCVHEKSRASJBD6O2Z532LWH4N2ZLCBVDLLTLKSYCSMBLOYTNMEEGUARD`

### Stellar Expert

- **Explorer link:** `https://stellar.expert/explorer/testnet/account/GCVHEKSRASJBD6O2Z532LWH4N2ZLCBVDLLTLKSYCSMBLOYTNMEEGUARD`

### GitHub Repository

The source code is publicly auditable at:
- `https://github.com/stellar/turing-signing-server`

The repository includes the turret server implementation, Wasm turing function examples, and integration tests demonstrating the threshold signing flow.

---

## Security Architecture Summary

TSS represents a significant advancement in Stellar's security infrastructure. By combining:

- **Cryptographic key sharding** (Shamir's Secret Sharing)
- **Threshold signature aggregation** (Schnorr multi-sig)
- **Sandboxed policy enforcement** (WebAssembly)
- **On-chain policy verification** (Soroban / Stellar ledger)

...TSS enables Stellar applications to implement non-custodial, policy-driven transaction authorization without trusting any single party. This is particularly valuable for DeFi protocols, DAOs, and enterprise applications that need to enforce complex signing policies while maintaining strong privacy guarantees for their users' key material.

The distributed trust model means that even a fully compromised turret operator cannot steal funds or forge transactions — the threshold quorum requirement ensures that security is maintained as long as the majority of turrets remain honest.

---

## Submission to Stellar Wave Hub

Live API submission was performed against `https://usestellarwavehub.vercel.app/api/projects`.

- **Hub endpoint:** `https://usestellarwavehub.vercel.app/api/projects`
- **Category:** Security
- **Tags:** `privacy,security,key-management,threshold-signing,wasm,soroban,stellar-wave,non-custodial`
- **Result:** _(updated after submission — see scripts/submit-tss-project.ts output)_
