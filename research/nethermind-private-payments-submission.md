# Nethermind Private Payments — Stellar Wave Research Submission

## Project Selected

- **Project:** Nethermind Private Payments
- **Wave source:** `NethermindEth/stellar-private-payments` — Stellar Wave Program repository
- **Domain:** Privacy / Security / Confidential Payments
- **Repository:** https://github.com/NethermindEth/stellar-private-payments
- **Docs:** https://nethermindeth.github.io/stellar-private-payments/
- **Category:** security

## Why This Project

Nethermind Private Payments is the most technically rigorous privacy implementation in the Stellar Wave ecosystem. Built by Nethermind's dedicated Privacy Engineering team — the same group behind privacy research on Ethereum — this project brings production-grade zero-knowledge cryptography to Stellar Soroban. No other Wave project implements a full ZK-SNARK circuit pipeline (Circom → Groth16 → Soroban verifier) with an on-chain compliance layer. It directly addresses the fundamental privacy gap in public blockchains: all transaction amounts and parties are visible by default on Stellar's ledger.

## Privacy Mechanism: Zero-Knowledge Proofs (Groth16 / Circom)

The system uses a **UTXO-based commitment scheme** secured by **Groth16 zero-knowledge proofs**:

1. **Deposit** — User deposits tokens into the Pool Soroban contract. A cryptographic commitment (a "note") is computed as `Poseidon2(amount, pubkey, blinding_factor)` and inserted into an on-chain Merkle tree. The deposit amount is visible at this step, but the note is opaque.

2. **Transfer** — User spends existing notes and creates new ones under a recipient's public key. The ZK circuit proves: ownership of input UTXOs (knowledge of private key), correct nullifier computation, valid Merkle inclusion proofs for inputs, correct output commitment computation, and balance conservation (`sum(inputs) = sum(outputs) + public_amount`). Nothing about amounts or parties is revealed on-chain.

3. **Withdraw** — User proves ownership of notes and withdraws tokens. Input notes are spent (nullifiers recorded), no output notes created.

All proofs are generated **client-side in the browser via WebAssembly** — private keys and note data never leave the user's device.

## Cryptographic Primitives

- **Groth16** — Succinct non-interactive ZK proof system; constant-size proofs (~200 bytes) regardless of circuit complexity
- **Circom** — Circuit description language used to define the transaction constraints
- **Poseidon2** — ZK-friendly hash function (credit: Horizen Labs implementation) used for commitments, nullifiers, and Merkle tree nodes; far more efficient inside ZK circuits than SHA-256
- **Sparse Merkle Trees** — Used by the ASP system for membership and non-membership proofs

## Threat Model

| Threat | Mitigation |
|---|---|
| On-chain transaction graph analysis | Amounts and parties hidden behind commitments; only nullifiers and new commitments appear on-chain |
| Double-spending | Nullifiers tracked in Pool contract; reuse of a nullifier reverts the transaction |
| Front-running | Commitments are opaque; observers cannot determine value or recipient before inclusion |
| Regulatory non-compliance | ASP membership/non-membership proofs enforce approved-set controls without revealing individual data |
| Key exfiltration | Proof generation is fully client-side (WASM); private keys never transmitted |
| Unauthorized pool access | Soroban contract enforces on-chain verification of Groth16 proofs before any state change |

## Association Set Provider (ASP) — Compliance Without Privacy Loss

A novel design element: the ASP system lets pool operators enforce AML/compliance controls without breaking user privacy.

- **Membership tree** — Sparse Merkle tree of approved public keys. Users prove their key is in the approved set without revealing which key.
- **Non-membership tree** — Sparse Merkle tree of blocked keys. Users prove their key is NOT in the blocked set.
- Both proofs are verified inside the main ZK circuit, so compliance checks happen at the cryptographic level, not the application level.
- ASP admin controls insertion into the membership tree; the admin account is `GBXQBIZWREYHXIEVLXHOMYNWOIMG7DA3NNBSMZ4V5HWPP5MWZOWGRWAY`.

## Smart Contract Architecture (4 Soroban Contracts)

All deployed on Stellar **testnet**, deployment ledger `2175274`:

| Contract | Address | Role |
|---|---|---|
| Pool | `CBWHCJNQCJ44UNZHCWH7743GRY5QR3JFLVPV5WNX3RDF5GTGKO6N4ZXJ` | Main state: Merkle tree, nullifier set, deposit/withdraw/transfer logic |
| Groth16 Verifier | `CDZEATBSNMC6R6TY4TJBHKLKV4U25XRZI7P446EX4KVG2MDJHSLLWJPB` | On-chain ZK proof verification |
| ASP Membership | `CCNUXSKXA56HSTFD7ZVZ5O4FWDPOJYPOVWFHBAWGOFUXCMQXPSWAKRVM` | Approved public key Merkle tree |
| ASP Non-Membership | `CBARN3PFXPZKGVCYK3DQB2O3X5RG4ODXHVBVUEZRV2ZZZ7ENLUMGIOXV` | Blocked key sparse Merkle tree |

**Deployer/Admin account:** `GBXQBIZWREYHXIEVLXHOMYNWOIMG7DA3NNBSMZ4V5HWPP5MWZOWGRWAY`

Verification:
- `https://horizon-testnet.stellar.org/accounts/GBXQBIZWREYHXIEVLXHOMYNWOIMG7DA3NNBSMZ4V5HWPP5MWZOWGRWAY`
- `https://api.stellar.expert/explorer/testnet/contract/CBWHCJNQCJ44UNZHCWH7743GRY5QR3JFLVPV5WNX3RDF5GTGKO6N4ZXJ`
- `https://api.stellar.expert/explorer/testnet/contract/CDZEATBSNMC6R6TY4TJBHKLKV4U25XRZI7P446EX4KVG2MDJHSLLWJPB`

## What Data Is Protected

- **Payment amounts** — Hidden inside ZK commitments; never appear in plaintext on-chain after deposit
- **Sender identity** — Spending a note requires only a ZK proof of key ownership; the public key is not revealed
- **Receiver identity** — Output commitments are opaque; only the recipient (who knows the blinding factor) can identify their note
- **Transaction linkability** — Nullifiers are unlinkable to the original deposit commitment without the private key

## Stellar Integration

- **Soroban contracts** — All state (Merkle roots, nullifier sets, ASP trees) lives on-chain in Soroban storage
- **Stellar SDK** — Used for account management, contract invocation, and transaction submission
- **Stellar CLI** — Used for contract deployment (`deployments/scripts/deploy.sh`)
- **Browser WASM** — Circom-compiled circuits run in-browser for client-side proof generation; no server-side proving infrastructure needed

## Known Limitations (PoC)

- No trusted setup ceremony for the Groth16 CRS (proof of concept only)
- Single circuit configuration (2 inputs, 2 outputs)
- Stellar RPC event retention window (~7 days) limits note history replay
- Not audited — not for production use with real assets

## Submission Confirmed

- **Hub endpoint:** `https://usestellarwavehub.vercel.app/api/projects`
- **Result:** Created project with `id: 83`, `slug: nethermind-private-payments`, `status: submitted`
- **Category:** `security`
- **Tags:** `privacy, security, zero-knowledge, zk-proofs, soroban, groth16, confidential-payments, stellar-wave, utxo, circom`
- **Submitted:** 24/04/2026
