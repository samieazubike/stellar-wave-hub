# Open-Stellar Passport — Research Submission

## Basic info
- Name: Open-Stellar Passport
- Description: A zero-knowledge agent passport for Stellar that lets autonomous AI agents prove identity, anti-Sybil status, and spend capacity without revealing the owner’s identity or full balance. It is designed for x402-style payments and on-chain verification through Soroban contracts.
- Category: AI / Identity / Zero-Knowledge / Payments / Stellar Ecosystem
- Stellar contract IDs:
  - Validator contract: CDNSZUNEWFCGSPWLPDSWTENR2WPHKC34RGZQG7RJA54OPGTZGVVRFYBA
  - Verifier contract: CCMKLYSRUH2HMA4UU6WLXWQXEY6KAH5AWB5BEVMJGNGC5GLGTVROLG4A
- Tags: stellar, soroban, zero-knowledge, zk, ai-agents, passport, identity, payments, x402, on-chain

## What the project does
Open-Stellar Passport creates a privacy-preserving credential for AI agents on Stellar. The system uses a Groth16 proof generated client-side in the browser and verified on-chain in Soroban. The proof demonstrates that the agent is backed by an attested human or business identity, is not using the same identity multiple times, and has enough funds for a declared spend cap without exposing the exact balance.

## How it uses Stellar
The project is built around Stellar/Soroban smart contracts deployed on testnet. The validator contract checks proofs, prevents replay through a nullifier, and records a passport attestation that can be used by x402-style payment gates. The verifier contract performs the BN254 proof verification.

## On-chain activity
The repository documents real on-chain activity on Stellar testnet:
- Validator contract deployment and initialization
- Verifier contract deployment
- A successful verify_and_register transaction that minted a passport attestation
- Replay attempts that fail with NullifierUsed
- Tampered input attempts that fail with InvalidProof

## Team and community
- Project author: Leo Cagli
- Project origin: Built for the Stellar Hacks: Real-World ZK hackathon
- Community signals: open-source repository, public demo, demo video, documentation, SDK, and design-system assets
- Public links:
  - Live demo: https://leocagli.github.io/open-stellar-passport/
  - GitHub repo: https://github.com/leocagli/open-stellar-passport
  - Demo video: https://github.com/leocagli/open-stellar-passport/tree/main/docs

## Why it matters
The project addresses a real gap in autonomous agent commerce: how to let agents pay without exposing full balances or centralizing identity. It combines privacy-preserving zero-knowledge proofs with Stellar’s on-chain execution to create a practical trust layer for agent payments.

## Suggested screenshots / attachments
- Architecture and product flow: [docs/hero.png](docs/hero.png)
- Contract and on-chain verification details: [README.md](README.md)
- Demo walkthrough and payment gating logic: [frontend/README.md](frontend/README.md)
