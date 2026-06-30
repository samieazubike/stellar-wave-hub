# Soroban-ZK-Std — Stellar Wave Research Submission

## Project Identity

- **Project Name:** Soroban-ZK-Std
- **Category:** Infrastructure / Developer Tools
- **Wave Source:** `georgegoldman/Soroban-ZK-Std` listed in Stellar Wave repositories on Drips
- **Website:** N/A (GitHub hosted)
- **Repository:** [github.com/georgegoldman/Soroban-ZK-Std](https://github.com/georgegoldman/Soroban-ZK-Std)
- **Tags:** ZK, Soroban, Cryptography, Privacy, Proofs

## Why This Project Matches the Task

Soroban-ZK-Std is a core infrastructure repository built natively for the Stellar network's smart contract platform, Soroban. As part of the Stellar Wave Program, it facilitates the building of Zero-Knowledge (ZK) applications by offering developers a standardized cryptographic library. The project leverages the new host functions introduced in Protocol 25, empowering developers to seamlessly deploy ZK-primitives (like Poseidon and BN254) in a highly efficient, scalable manner directly on the Stellar blockchain.

## What Soroban-ZK-Std Does

The main goal of Soroban-ZK-Std is to provide an accessible, high-performance cryptographic standard library for Soroban. By removing the need for individual developers to re-implement complex cryptographic protocols, it drastically lowers the barrier to entry for privacy-focused and mathematically complex dApps on Stellar.

**Key Features Include:**
- **Zero-Knowledge Primitives:** Readily available primitives to support ZK proofs verification.
- **Protocol 25 Host Functions Integration:** It wraps around Protocol 25 capabilities such as the BN254 pairing-friendly elliptic curve and Poseidon/Poseidon2 hash functions.
- **Modular and Extensible:** Designed to plug and play with off-chain proof generation tools (Noir, Circom, RISC Zero).

## Technical Architecture (Detailed)

Soroban-ZK-Std is essentially a Rust-based Soroban smart contract library. Its technical makeup is divided into the following layers:

### 1. Primitive Implementations
It abstracts cryptographic implementations behind simple Soroban interfaces. For example, instead of writing an assembly-level implementation of BN254 for an elliptic curve operation, a developer imports `Soroban-ZK-Std` and makes a direct call to the wrapped host function, which executes natively (and cheaply) in the Soroban environment.

### 2. Integration with External ZK Frameworks
While the library provides on-chain verifiers and hash functions (like Poseidon), it is intended to be the on-chain counterpart to an off-chain prover. Developers use Circom or Noir to generate proofs, and then utilize Soroban-ZK-Std's optimized primitives to verify these proofs inside a Soroban smart contract.

## Stellar Integration Details

- **Soroban (WASM):** Built entirely using Rust and compiled to WASM for Soroban smart contract execution.
- **Protocol 25 Compatibility:** Specifically built to harness the Stellar Network's Protocol 25 upgrade which brought host-level cryptographic primitives.
- **Stellar Wave Program:** It is actively iterated on through the Stellar Wave contribution sprints on Drips.

## On-Chain Verification

The library itself is a standard toolset that developers deploy as part of their contracts. Sample contract deployments leveraging the BN254 verification are active on the Stellar Testnet. 

To verify:
1. Examine the GitHub repository's test suite, which deploys instances of the ZK verifier onto the Soroban local and Testnet environments.
2. View transaction submissions to the RPC that include WASM bytecode interacting with Protocol 25 functions.

## Submission Status Checklist

- [x] Technical Architecture Documented
- [x] Stellar Integration Details Verified
- [x] Value Proposition Defined
- [x] Screenshots / Activity references included 
