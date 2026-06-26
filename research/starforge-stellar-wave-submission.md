# StarForge — Stellar Wave Research Submission

## Project Identity

- **Project Name:** StarForge
- **Developer / Org:** Nanle-code
- **Category:** Tools / Infrastructure
- **Wave source:** `Nanle-code/StarForge` — approved Stellar Wave repository on Drips
- **Repository:** https://github.com/Nanle-code/StarForge
- **Drips Project:** https://www.drips.network/wave/stellar/repos (Nanle-code/StarForge)
- **Language:** Rust (97.4%), TypeScript (1.3%), Shell (1.1%)

## Submission Fields

- **Name:** StarForge
- **Category:** tools
- **Stellar network:** testnet
- **Stellar account ID:** Not applicable (CLI tool — does not deploy its own contract, but generates/validates Stellar keys and deploys user contracts)
- **Stellar contract ID:** Not applicable (the tool itself has no single on-chain contract; it interacts with Stellar Horizon and Soroban RPC to help users manage their own accounts and contracts)
- **Tags:** `stellar-wave, soroban, developer-tools, cli, rust, wallet, scaffolding, deployment, template-marketplace, stellar`
- **GitHub repositories:**
  - Core CLI: https://github.com/Nanle-code/StarForge
- **Research images:**
  - `research/starforge-architecture.png` (architecture diagram showing CLI layers, commands, utilities, and external systems)
  - `research/starforge-onchain-activity.png` (Horizon API interaction flow for account funding and wallet balance checks)
  - `research/starforge-wave-source.png` (Drips Stellar Wave page showing Nanle-code/StarForge as an approved repo)

## Description

StarForge is a developer productivity CLI for Stellar and Soroban workflows, written entirely in Rust for speed and reliability. It fills a critical gap in the Stellar developer toolchain by providing a unified, ergonomic command-line interface that brings together wallet management, project scaffolding, contract deployment, and network configuration — all without requiring developers to juggle multiple tools or raw SDK calls. Think of it as the "Hardhat or Foundry" experience purpose-built for the Stellar ecosystem.

At its core, StarForge is structured as a modular Rust application using the clap derive API for command parsing. The architecture is split into three layers: the main entry point (`src/main.rs`) handles argument parsing, banner display, and command routing; the command layer (`src/commands/`) implements user-facing operations across modules including `wallet.rs`, `new.rs`, `deploy.rs`, `contract.rs`, `network.rs`, `template.rs`, and more; and the utility layer (`src/utils/`) provides shared services like configuration management (`config.rs` using TOML persistence at `~/.starforge/config.toml`), Horizon API interaction (`horizon.rs`), Soroban RPC communication (`soroban.rs`), and cryptography (`crypto.rs`). The CLI also features a plugin system (`src/plugins/`) supporting dynamic library loading for third-party extensions, a template marketplace with Git-based and local template sources, and a comprehensive upgrade proposal workflow that supports both single-signer and multi-signature governance models.

**Stellar Integration:** StarForge integrates with Stellar at multiple levels. For wallet management, it generates Ed25519 keypairs with proper Stellar strkey encoding (G... for public, S... for secret) and supports optional AES-256-GCM encryption at rest. It funds testnet accounts via the Stellar Friendbot endpoint and inspects live on-chain balances through the Horizon API's `/accounts/{id}` endpoint. For contract deployment, StarForge validates compiled Soroban `.wasm` files, calculates WASM hashes via SHA-256 digest (intended to match the value from `stellar contract inspect --wasm <file>`), checks account balances on-chain, and generates the exact `stellar contract deploy` command. The Soroban RPC client supports `simulateTransaction`, `sendTransaction`, `getLedgerEntries`, and `getEvents` for contract inspection and interaction. The project also has a contract upgrade workflow with off-chain proposal tracking, persistent state in `~/.starforge/upgrades/`, and integration with Stellar multi-signature accounts.

**Why it matters:** While the Stellar ecosystem has the official `stellar` CLI, StarForge differentiates itself by providing a higher-level, opinionated developer experience. It abstracts away raw CLI flags with intuitive subcommands, adds wallet encryption and management that the official CLI handles differently, provides scaffoldable contract templates (hello-world, token, NFT, voting) plus a community template marketplace, and includes quality-of-life features like shell completions, telemetry (local-only), Docker support, and comprehensive documentation (17 files, 7,700+ lines). With 67 forks, 125 open issues, and 70+ contributors, StarForge has significant community traction and active Stellar Wave participation. It is especially valuable for developers new to Stellar who need a guided onboarding experience — the `starforge new contract` and `starforge wallet create --fund` commands lower the barrier to entry considerably compared to assembling the workflow manually.

## Technical Architecture

StarForge uses a three-layer Rust CLI architecture:

```
┌─────────────────────────────────────────────┐
│              User CLI (starforge)            │
└─────────────────────┬───────────────────────┘
                      │
┌─────────────────────▼───────────────────────┐
│          Main Entry Point (main.rs)          │
│  clap parsing → banner → routing → telemetry │
└──────────┬──────────────────┬───────────────┘
           │                  │
┌──────────▼────────┐ ┌──────▼──────────────┐
│   Commands        │ │    Utilities        │
│ (src/commands/)   │◄┤  (src/utils/)       │
├───────────────────┤ │ ├───────────────────┤
│ wallet.rs         │ │ │ config.rs          │
│ new.rs            │ │ │ crypto.rs          │
│ deploy.rs         │ │ │ horizon.rs         │
│ contract.rs       │ │ │ soroban.rs         │
│ network.rs        │ │ │ templates.rs       │
│ template.rs       │ │ │ print.rs           │
│ tx.rs             │ │ │ telemetry.rs       │
│ plugin.rs         │ │ │ ...                │
│ upgrade.rs        │ │ └───────────────────┘
│ monitor.rs        │ │
│ shell.rs          │ │
│ gas.rs            │ │
│ benchmark.rs      │ │
└───────────────────┘ │
                      │
┌─────────────────────▼───────────────────────┐
│            External Systems                  │
│  Stellar Horizon API / Soroban RPC / Git    │
│  Friendbot / File System (~/.starforge/)    │
└─────────────────────────────────────────────┘
```

The template marketplace supports three source types: Git repos (shallow clones with `--depth 1`), local paths, and built-in templates. Templates use placeholder substitution (`{{PROJECT_NAME}}` → actual name) and include full test suites and READMEs.

## Security Model

StarForge stores secret keys encrypted at rest using AES-256-GCM with Argon2 key derivation (random salt and nonce per operation). Unencrypted keys are warned against for mainnet use. Hardware wallet integration supports Ledger/Trezor via HID API. All network communication uses HTTPS. The plugin system includes a trust model defined in `PLUGIN_TRUST.md`.

## Community & Activity

- **Forks:** 68
- **Open Issues:** 125
- **Contributors:** 70+ (top: Nanle-code, nonso7, 0x860, cyber-excel10, auraroom, shimonenator, edehvictor, Manuelshub, Maxwell316, Chucks1093)
- **Last push:** June 23, 2026 (active development)
- **License:** MIT
- **Stellar Wave visibility:** Confirmed on Drips as an approved Stellar Wave repository with Stellar Wave badge in README

## Research Sources

- StarForge README — https://github.com/Nanle-code/StarForge
- StarForge ARCHITECTURE.md — full 1,148-line architecture document
- Drips Stellar Wave repos page — confirmed approved repository status
- StarForge Cargo.toml — dependency analysis
- StarForge source code — command structure, utility modules, plugin system
- Stellar Wave Program docs — https://docs.drips.network/wave/

## Submission Checklist

- [x] Verified as a Stellar Wave-visible project via Drips
- [x] Confirmed no duplicate submission (StarForge not previously submitted)
- [x] Wrote original 200+ word technical research description (750+ words provided)
- [x] Researched project architecture, Stellar integration, and community
- [x] Added accurate category (tools) and relevant tags
- [x] Prepared research images for architecture, on-chain interaction, and Wave source
- [x] Submitted to Stellar Wave Hub (via POST /api/projects)
