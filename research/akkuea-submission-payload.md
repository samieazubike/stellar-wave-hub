# Akkuea — POST /api/projects Submission Payload

## Endpoint

```
POST https://usestellarwavehub.vercel.app/api/projects
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## Request Body

```json
{
  "name": "Akkuea",
  "description": "Akkuea is an institutional-grade Real-World Asset (RWA) tokenization and DeFi lending platform built on the Stellar blockchain. It solves two tightly coupled problems: the illiquidity of real estate and the collateral limitations of DeFi. Property owners tokenize their real estate into fractional on-chain shares, and investors can use those shares as collateral to borrow from DeFi lending pools — all on Stellar's high-throughput, low-cost network.\n\nThe platform is built as a Bun monorepo with four workspaces: a Next.js 16 frontend, an Elysia/Bun REST API, a shared TypeScript library, and Soroban smart contracts written in Rust. The core contract (real_estate_defi_contracts.wasm) is a single WASM binary containing both the property tokenization and DeFi lending logic, deployed to Stellar Testnet.\n\nKey features include: KYC/AML compliance enforced at the smart contract level (not just the API), role-based access control (Admin, Pauser, Oracle, Verifier, Liquidator, EmergencyGuard), oracle-integrated asset valuation with configurable staleness guardrails (default 1-hour max age), automated interest calculation and liquidation mechanisms, and upgradeable contracts via Soroban's WASM upgrade path without changing the contract ID.\n\nUsers authenticate via Stellar wallet signatures using @creit.tech/stellar-wallets-kit — no passwords, no centralized auth. The project is licensed MIT, developed by Acachete Labs, and is the highest-starred repository in the Stellar Wave Program (42 stars, 232 forks, 1,680+ commits). It participates at the 4x Points multiplier tier on Drips.",
  "category": "DeFi",
  "stellar_contract_id": "CBFQV2RY5VHVFU3HT2I72FLXWY5YNZC37LWJSOZQCX45B76NBO4YZHM4",
  "stellar_account_id": null,
  "stellar_network": "testnet",
  "tags": "rwa,defi,real-estate,tokenization,lending,soroban,stellar-wave,kyc,collateral,bun",
  "website_url": null,
  "github_url": "https://github.com/akkuea/akkuea",
  "github_repos": [
    "https://github.com/akkuea/akkuea"
  ],
  "logo_url": null,
  "research_images": []
}
```

## Field Notes

| Field | Value | Notes |
|---|---|---|
| `name` | `Akkuea` | Exact project name |
| `category` | `DeFi` | Primary category — RWA+DeFi hybrid |
| `stellar_contract_id` | `CBFQV2RY5VHVFU3HT2I72FLXWY5YNZC37LWJSOZQCX45B76NBO4YZHM4` | REAL_ESTATE_TOKEN contract, from `apps/shared/src/contracts.testnet.json` |
| `stellar_network` | `testnet` | Contracts deployed on Stellar Testnet |
| `tags` | `rwa,defi,real-estate,tokenization,lending,soroban,stellar-wave,kyc,collateral,bun` | Comma-separated |
| `github_url` | `https://github.com/akkuea/akkuea` | Monorepo root |

## Second Contract ID (DEFI_LENDING)

The platform deploys two contracts. The submission uses the REAL_ESTATE_TOKEN contract as the primary `stellar_contract_id`. The DEFI_LENDING contract ID is:

```
CBFOZBCYMIDIZLNHT6ANMBU6LSGC6REM6Z5M4ST35E5T5FDWWZAWZLTX
```

Both are verifiable at:
- `https://stellar.expert/explorer/testnet/contract/CBFQV2RY5VHVFU3HT2I72FLXWY5YNZC37LWJSOZQCX45B76NBO4YZHM4`
- `https://stellar.expert/explorer/testnet/contract/CBFOZBCYMIDIZLNHT6ANMBU6LSGC6REM6Z5M4ST35E5T5FDWWZAWZLTX`

## curl Example

```bash
curl -X POST https://usestellarwavehub.vercel.app/api/projects \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Akkuea",
    "description": "Akkuea is an institutional-grade Real-World Asset (RWA) tokenization and DeFi lending platform built on the Stellar blockchain. It solves two tightly coupled problems: the illiquidity of real estate and the collateral limitations of DeFi. Property owners tokenize their real estate into fractional on-chain shares, and investors can use those shares as collateral to borrow from DeFi lending pools — all on Stellar'\''s high-throughput, low-cost network.\n\nThe platform is built as a Bun monorepo with four workspaces: a Next.js 16 frontend, an Elysia/Bun REST API, a shared TypeScript library, and Soroban smart contracts written in Rust. The core contract (real_estate_defi_contracts.wasm) is a single WASM binary containing both the property tokenization and DeFi lending logic, deployed to Stellar Testnet.\n\nKey features include: KYC/AML compliance enforced at the smart contract level (not just the API), role-based access control (Admin, Pauser, Oracle, Verifier, Liquidator, EmergencyGuard), oracle-integrated asset valuation with configurable staleness guardrails (default 1-hour max age), automated interest calculation and liquidation mechanisms, and upgradeable contracts via Soroban'\''s WASM upgrade path without changing the contract ID.\n\nUsers authenticate via Stellar wallet signatures using @creit.tech/stellar-wallets-kit — no passwords, no centralized auth. The project is licensed MIT, developed by Acachete Labs, and is the highest-starred repository in the Stellar Wave Program (42 stars, 232 forks, 1,680+ commits). It participates at the 4x Points multiplier tier on Drips.",
    "category": "DeFi",
    "stellar_contract_id": "CBFQV2RY5VHVFU3HT2I72FLXWY5YNZC37LWJSOZQCX45B76NBO4YZHM4",
    "stellar_account_id": null,
    "stellar_network": "testnet",
    "tags": "rwa,defi,real-estate,tokenization,lending,soroban,stellar-wave,kyc,collateral,bun",
    "github_url": "https://github.com/akkuea/akkuea",
    "github_repos": ["https://github.com/akkuea/akkuea"],
    "logo_url": null,
    "research_images": []
  }'
```

## Expected Response (201 Created)

```json
{
  "project": {
    "numericId": <assigned_id>,
    "name": "Akkuea",
    "slug": "akkuea",
    "description": "...",
    "category": "DeFi",
    "status": "submitted",
    "stellar_contract_id": "CBFQV2RY5VHVFU3HT2I72FLXWY5YNZC37LWJSOZQCX45B76NBO4YZHM4",
    "stellar_account_id": null,
    "stellar_network": "testnet",
    "tags": "rwa,defi,real-estate,tokenization,lending,soroban,stellar-wave,kyc,collateral,bun",
    "github_url": "https://github.com/akkuea/akkuea",
    "github_repos": ["https://github.com/akkuea/akkuea"],
    "featured": 0,
    "created_at": "<timestamp>",
    "updated_at": "<timestamp>"
  }
}
```
