# OverSync — Stellar Wave Research Submission

## Project Selected

- **Project:** OverSync
- **Wave source:** `karagozemin/OverSync` listed in Stellar Wave repositories on Drips
- **Domain:** Cross-chain Bridge / Infrastructure
- **Website:** Not published as a standalone production website (testnet deployment)
- **Repository:** https://github.com/karagozemin/OverSync
- **Documentation:** Available in repository (ARCHITECTURE.md, docs/)

## Why This Matches the Task

OverSync is an active Stellar Wave Program participant with a sophisticated cross-chain bridge implementation between Ethereum and Stellar. It addresses a critical security problem in DeFi: bridge hacks have caused over $1.1B in losses (Ronin $625M, Wormhole $325M, Multichain $231M). OverSync replaces vulnerable validator-set bridges with a Hashed Timelock Contract (HTLC) architecture that eliminates single points of compromise. The project has live deployed contracts on both Sepolia (Ethereum testnet) and Stellar testnet, with comprehensive documentation, CI-enforced test coverage, and a multi-layer refund mechanism ensuring funds cannot be lost. It was not previously submitted to the Hub at the time of this submission.

## Verifiable On-Chain IDs

- **HTLC Contract (Stellar testnet):** `CDIKSJKVMXKGBRD3BBEBMF7Q4GQJ52ECU6R6G5HEKXKXVGGWK2CTA6JK`
- **Resolver Registry Contract (Stellar testnet):** `CBSR7Z4MHLPMLFFM5K3PK3YLZAVCOMJ4KPVRWO4VPL3FF64MSTIZ4WGF`
- **HTLCEscrow Contract (Ethereum Sepolia testnet):** `0xb352339BEb146f2699d28D736700B953988bB178`
- **ResolverRegistry Contract (Ethereum Sepolia testnet):** `0x7D9ce70Aa40E144E8BbE266a0dc3b3F91B6D1D99`

Verification endpoints:
- `https://stellar.expert/explorer/testnet/contract/CDIKSJKVMXKGBRD3BBEBMF7Q4GQJ52ECU6R6G5HEKXKXVGGWK2CTA6JK`
- `https://stellar.expert/explorer/testnet/contract/CBSR7Z4MHLPMLFFM5K3PK3YLZAVCOMJ4KPVRWO4VPL3FF64MSTIZ4WGF`
- `https://sepolia.etherscan.io/address/0xb352339BEb146f2699d28D736700B953988bB178`
- `https://sepolia.etherscan.io/address/0x7D9ce70Aa40E144E8BbE266a0dc3b3F91B6D1D99`

Source code references:
- Stellar HTLC: `https://github.com/karagozemin/OverSync/blob/master/soroban/contracts/htlc/src/lib.rs`
- Stellar Resolver Registry: `https://github.com/karagozemin/OverSync/blob/master/soroban/contracts/resolver-registry/src/lib.rs`
- Ethereum HTLCEscrow: `https://github.com/karagozemin/OverSync/blob/master/contracts/contracts/v2/HTLCEscrow.sol`
- Ethereum ResolverRegistry: `https://github.com/karagozemin/OverSync/blob/master/contracts/contracts/v2/ResolverRegistry.sol`

## What OverSync Does

OverSync is a cross-chain token bridge between Ethereum and Stellar using a Hashed Timelock Contract (HTLC) mechanism inspired by 1inch Fusion+ architecture. The core value proposition is **security through cryptographic guarantees rather than trusted validators**. Traditional bridges use off-chain validator quorums that sign proofs of locks; when these quorums are compromised, wrapped tokens are minted without real locks, causing the massive bridge hacks seen in DeFi. OverSync eliminates this attack surface by using HTLCs where funds can only move when cryptographic preimages are revealed on-chain, with no trusted intermediaries required.

The swap flow works as follows:
1. User locks ETH on Ethereum under sha256(secret) with timelock = 24h
2. Resolver locks XLM on Stellar under the same hashlock with timelock = 12h (shorter to protect the resolver)
3. User claims XLM on Stellar by revealing the secret (preimage becomes public on-chain)
4. Resolver claims ETH on Ethereum using that same secret

If the user never claims, the resolver's destination-side refund expires first (12h vs 24h), so the resolver gets their XLM back. The user can then refund their ETH at 24h. Both legs settle, or both legs refund — there is no state where funds are stuck or lost.

## Technical Architecture (Detailed)

OverSync is a multi-repository system with four main components:

### 1. Smart Contract Layer

**Ethereum (Sepolia testnet):**
- `HTLCEscrow` — Solidity contract that locks ETH under hashlock and timelock conditions; supports refund operations and resolver claims
- `ResolverRegistry` — Registry contract that manages authorized resolver addresses; provides role-based access control

**Stellar Soroban (testnet):**
- `oversync-htlc` — Rust/Soroban contract implementing HTLC logic for XLM locks; mirrors Ethereum functionality with Stellar-specific optimizations
- `oversync-resolver-registry` — Soroban contract for resolver management; cross-chain coordination with Ethereum registry

### 2. Off-Chain Services

- **Coordinator** — Orchestrates the bridge operation; monitors lock events and triggers corresponding locks on the destination chain
- **Resolver** — Service that claims funds on the source chain after preimage revelation; handles the completion leg of swaps
- **Relayer** — Background services including refund watchdog and contract event poller; ensures automated recovery and monitoring
- **Frontend** — React-based UI for users to initiate swaps, monitor status, and trigger refunds

### 3. Security Architecture

OverSync implements **four independent refund mechanisms** as defense-in-depth:
1. **Timelock** — Automatic refund when time expires
2. **refundOrder** — Contract-level refund function callable by users
3. **refundAddress** — Designated fallback address for emergency recovery
4. **Refund watchdog** — Off-chain service that monitors and triggers refunds when needed

This layered approach ensures that even with three of four mechanisms offline, users always have a path to recover funds.

### 4. Trust Model

The architecture creates a minimal trust model:
- No validator quorums or multisig signers required
- All state transitions are enforced by smart contract code
- Preimage revelation is the only way to move funds across chains
- Time-based refunds provide safety nets for all participants
- Resolver is incentivized but cannot steal funds (can only refund if user doesn't act)

## Stellar Integration

OverSync uses Stellar in three key ways:
1. **HTLC Implementation** — Soroban smart contracts provide the hashlock/timelock primitives for XLM locks
2. **Cross-Chain Destination** — Stellar serves as the destination chain for ETH→XLM swaps, leveraging its low fees and fast finality
3. **Resolver Registry** — On-chain registry manages authorized resolvers, providing decentralized access control

The project uses Soroban SDK for contract development, Stellar CLI for deployment, and integrates with Stellar RPC for contract interaction. The testnet deployment demonstrates full cross-chain functionality.

## Community & Ecosystem

- **Wave participation:** Listed in Stellar Wave repositories on Drips
- **Open issues:** 10 open issues on Drips (indicating active development)
- **Test coverage:** CI-enforced with `#[contracttest]` annotations
- **Documentation:** Comprehensive architecture docs, differentiation analysis vs competitors (CCTP v2, Axelar ITS, Allbridge)
- **Security focus:** Explicitly addresses bridge hack patterns with cryptographic solutions

## Submission Performed

Research completed: June 2, 2026.

- **Hub endpoint:** `https://usestellarwavehub.vercel.app/api/projects`
- **Result:** Pending submission (requires authentication)
- **Category:** `infrastructure`
- **Tags:** `cross-chain, bridge, htlc, soroban, ethereum, stellar, security, trustless, atomic-swaps, testnet, infrastructure, stellar-wave`

## Submission Checklist

- [x] Verified as a Stellar Wave-visible project via Drips
- [x] Confirmed the project is not already in the approved Hub project list
- [x] Wrote original 200+ word technical research description
- [x] Verified Stellar/Soroban contract IDs
- [x] Added category and accurate tags
- [x] Documented Ethereum Sepolia contracts for cross-chain context
- [x] Prepared comprehensive technical architecture documentation
