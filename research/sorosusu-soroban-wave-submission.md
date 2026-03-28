# SoroSusu — Stellar Wave Soroban Research Submission

## Project Selected

- **Project:** SoroSusu
- **Wave source:** `SoroSusu-Protocol/sorosusu-contracts` listed in Stellar Wave repositories
- **Domain:** DeFi / Savings Protocol
- **Website:** N/A (open-source protocol)
- **Repository:** https://github.com/SoroSusu-Protocol/sorosusu-contracts

## Why This Matches the Task

SoroSusu is a decentralized savings circle protocol built on Stellar Soroban, explicitly part of the Drips Wave ecosystem. It implements a trustless Rotating Savings and Credit Association (ROSCA) with features like flexible shares, automated payouts, and immutable audit logs. The project is not a duplicate in the target Hub instance and includes a verifiable deployed Soroban contract on testnet.

## Verifiable On-Chain IDs

- **Soroban contract (testnet):** `CAH65U2KXQ34G7AT7QMWP6WUFYWAV6RPJRSDOB4KID6TP3OORS3BQHCX`
- **Stellar account (creator):** `GC5JB52CX65L2C5QXIIKQ56PGJCVY44IBTOPP3C4CJSBBOFVWJIR4GYE`

Verification endpoints used:

- `https://api.stellar.expert/explorer/testnet/contract/CAH65U2KXQ34G7AT7QMWP6WUFYWAV6RPJRSDOB4KID6TP3OORS3BQHCX`
- `https://horizon-testnet.stellar.org/accounts/GC5JB52CX65L2C5QXIIKQ56PGJCVY44IBTOPP3C4CJSBBOFVWJIR4GYE`

## Smart Contract Architecture (Detailed)

SoroSusu leverages Soroban contracts to create a decentralized savings circle where participants contribute fixed amounts in cycles, receiving payouts in rotation. The protocol supports flexible shares (1x or 2x contributions) to accommodate individuals, families, and small businesses, with automated payouts and double rewards for higher shares.

Key architectural components:

1. **Savings Circles:** Users create circles with fixed contribution amounts and member limits. Members join with 1 or 2 shares, depositing USDC/XLM securely.

2. **Payout Mechanism:** Automated payouts deduct a configurable protocol fee (e.g., 0.5%) transferred to a treasury address. The `compute_and_transfer_payout` function ensures fee deduction and distribution.

3. **Audit Log:** Immutable on-chain audit entries for sensitive actions like governance proposals, voting, and admin operations. Stored in append-only storage with query methods for actors, resources, and time ranges.

4. **Shares System:** Allows variable participation levels, making it versatile for communal finance. For example, in a 100 USDC circle with 3 members, a 2-share member contributes 200 USDC and receives 800 USDC payout.

This design promotes trustlessness and transparency, with all state and actions verifiable on-chain. For Stellar Wave, SoroSusu demonstrates practical DeFi use cases on Soroban, enabling accessible savings for underserved communities while maintaining decentralization.

## Submission Performed

Live API submission was completed successfully.

- **Hub endpoint:** `https://usestellarwavehub.vercel.app/api/projects`
- **Result:** created project with `id: 64`, `status: submitted`
- **Tags used:** `soroban, defi, savings, decentralized, stellar-wave`