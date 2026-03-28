# Soroban-ZK-Std — Stellar Wave Research Submission

## Project Selected

- **Project:** Soroban-ZK-Std
- **Wave source:** `georgegoldman/Soroban-ZK-Std` — Stellar Wave Program repository
- **Domain:** ZK Cryptography / Infrastructure / Developer Tooling
- **Repository:** https://github.com/georgegoldman/Soroban-ZK-Std
- **Category:** Infrastructure

## Why This Project

Soroban-ZK-Std is one of the most technically ambitious projects in the Stellar Wave
ecosystem. While Stellar Protocol 25 ("X-Ray") introduced native host functions for
BN254 pairing checks and Poseidon hashing, no developer-friendly SDK existed to
actually use them. Soroban-ZK-Std fills that gap — making Stellar the premier home
for Zero Knowledge proof systems. This is foundational infrastructure that unlocks
private stablecoins, shielded RWA transfers, ZK-voting, and trustless governance
directly on Stellar.

## What The Project Does

Soroban-ZK-Std is a high-performance, modular, no_std cryptographic standard library
optimized specifically for the Soroban Virtual Machine on Stellar. It provides the
mathematical primitives required to build and verify Zero Knowledge proofs on-chain,
including Groth16 proof verification — the most widely used ZK proof system in
production blockchain applications today.

The library is structured into three distinct layers:

1. **zk-core** — Pure mathematics. Elliptic curve logic for the BN254 curve,
   field arithmetic over both the base field (Fp) and scalar field (Fr), constant-time
   modular operations, 512-bit schoolbook multiplication, Fermat-based inversion,
   and scalar multiplication via the double-and-add algorithm. All operations are
   constant-time to prevent side-channel attacks — a hard requirement for any
   production cryptographic library.

2. **zk-soroban** — Stellar integration. Traits that extend the Soroban environment,
   host-function mappings for the native `bn254_multi_pairing_check` and
   `poseidon2_permutation` host functions introduced in Protocol 25, and XDR
   conversion utilities.

3. **verifier-sample** — Integration testing. A sample Soroban contract used to verify
   WASM binary size and gas costs against the 64KB WASM limit and 400M instruction
   budget enforced by the Soroban VM.

## Technical Approach and Stellar Integration

The project directly leverages two Protocol 25 (CAP-0075) host functions:

- **`bn254_multi_pairing_check`** — Native BN254 pairing verification, used in Groth16
  proof verification for linear combinations of G1 points.
- **`poseidon2_permutation`** — Native Poseidon2 hash function, 47% faster than
  software-only alternatives, used in ZK circuit commitment schemes.

By calling these as host functions rather than implementing them in WASM, the library
achieves dramatic gas savings — keeping complex ZK verifiers well within the 400M
instruction budget. The use of `ethnum` for assembly-optimized 256-bit arithmetic
reduces WASM binary size by approximately 22KB, saving roughly 30% of the total
64KB contract space budget.

The scalar multiplication implementation (G1 double-and-add over 254 bits) runs at
approximately 17M instructions — leaving ample headroom for full Groth16 verification
pipelines. The library is strictly `no_std`, uses no panics, and returns `Result<T, ZkError>`
throughout, making it safe for use in production Soroban contracts.

## Use Cases Enabled

- **Shielded RWA Transfers** — Private tokenized assets with selective regulatory disclosure
- **Configurable Privacy** — Institutional payments with ZK-proven compliance
- **ZK-Voting** — Anonymous on-chain governance for Stellar-native DAOs
- **Commitment Schemes** — Cryptographic commitments for trustless protocols
- **Groth16 Proof Verification** — The standard ZK-SNARK system used by Zcash, Tornado Cash, and most ZK-rollups

## Verified On-Chain / Repository Artifacts

- **Repository:** https://github.com/georgegoldman/Soroban-ZK-Std
- **Crate:** `zk-core` at `crates/zk-core/` — pure BN254 field and curve arithmetic
- **Crate:** `zk-soroban` at `crates/zk-soroban/` — Soroban host function bindings
- **Sample contract:** `contracts/verifier-sample/` — WASM size and gas validation
- **Workspace:** Rust workspace with `wasm32-unknown-unknown` target, `opt-level="z"`, LTO enabled

Verification:
- https://github.com/georgegoldman/Soroban-ZK-Std/blob/main/crates/zk-core/src/lib.rs
- https://github.com/georgegoldman/Soroban-ZK-Std/blob/main/Cargo.toml

## Performance Benchmarks (March 2026)

| Operation | Instruction Cost |
|-----------|-----------------|
| Field add (Fp) | ~50 instructions |
| Field mul (Fp) | ~500 instructions |
| Field invert (Fp) | ~50,000 instructions |
| G1 point double | ~28,000 instructions |
| G1 point add | ~38,000 instructions |
| G1 scalar mul (254-bit) | ~17,000,000 instructions |
| Soroban budget | 400,000,000 instructions |

## Independent Research Assessment

Soroban-ZK-Std represents a genuine infrastructure gap being filled in the Stellar
ecosystem. The ZK tooling space on EVM chains (circom, snarkjs, arkworks) is mature,
but Stellar had no equivalent before this project. The library's strict adherence to
`no_std`, constant-time operations, and the 64KB WASM constraint demonstrates deep
understanding of the Soroban execution environment.

The project is actively developed with clear contribution standards, a CI pipeline,
and bounty-based issue tracking — indicating a healthy open-source trajectory. As
Groth16 verification (#29 in the issue tracker) and Multi-Scalar Multiplication (#23)
are completed, the library will be production-ready for ZK application developers
building on Stellar.

## Submission Details

- **Hub endpoint:** https://usestellarwavehub.vercel.app/api/projects
- **Category:** Infrastructure
- **Tags:** `zk, groth16, bn254, soroban, cryptography, no_std, stellar-wave, privacy, infrastructure`
