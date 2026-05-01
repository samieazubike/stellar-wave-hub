# WaveHubRegistry — Deployment Guide

This document walks through deploying the `wave_hub_registry` contract to
Stellar **testnet** and **mainnet** (public network), plus how to upgrade it
later without losing any on-chain state.

## 1. Prerequisites

Install the Soroban / Stellar CLI:

```bash
cargo install --locked stellar-cli
# verify
stellar --version
```

Add the Rust WASM target:

```bash
rustup target add wasm32-unknown-unknown
```

Generate (or import) a deployer identity:

```bash
# create a new keypair
stellar keys generate --global admin --network testnet

# or import an existing secret key
stellar keys add --global admin --secret-key
```

Fund it on the network you're targeting:

```bash
# testnet — funded automatically via Friendbot
stellar keys fund admin --network testnet

# mainnet — send real XLM to the address shown by:
stellar keys address admin
```

## 2. Build the WASM

From the repo root:

```bash
cd contracts/wave_hub_registry
stellar contract build
```

The optimized WASM is written to
`target/wasm32-unknown-unknown/release/wave_hub_registry.wasm`.

Optionally strip debug metadata:

```bash
stellar contract optimize \
  --wasm target/wasm32-unknown-unknown/release/wave_hub_registry.wasm
```

## 3. Run the tests

```bash
cargo test
```

All tests should pass before you deploy to any network.

## 4. Deploy to testnet

### 4a. Install and deploy

```bash
# install the WASM on the ledger (returns a hash — save it, you'll need it for upgrades)
WASM_HASH=$(stellar contract install \
  --network testnet \
  --source admin \
  --wasm target/wasm32-unknown-unknown/release/wave_hub_registry.wasm)

echo "WASM hash: $WASM_HASH"

# deploy a new contract instance from that WASM
CONTRACT_ID=$(stellar contract deploy \
  --network testnet \
  --source admin \
  --wasm-hash $WASM_HASH)

echo "Contract: $CONTRACT_ID"
```

### 4b. Pick the payment token

On **testnet**, use the native XLM wrapper or set up your own test USDC:

```bash
# native XLM SAC on testnet
XLM_SAC=$(stellar contract id asset --asset native --network testnet --source admin)
echo "Testnet XLM SAC: $XLM_SAC"
```

### 4c. Initialize

Fees are in the token's smallest unit. For USDC on Stellar (7 decimals):
`1_000_000` = 0.1 USDC. For XLM (7 decimals, called stroops): `1_000_000` = 0.1 XLM.

```bash
ADMIN_ADDRESS=$(stellar keys address admin)

stellar contract invoke \
  --network testnet \
  --source admin \
  --id $CONTRACT_ID \
  -- initialize \
  --admin $ADMIN_ADDRESS \
  --token $XLM_SAC \
  --reg_fee 5000000 \
  --rate_fee 1000000
```

### 4d. Verify

```bash
stellar contract invoke --network testnet --source admin --id $CONTRACT_ID -- get_admin
stellar contract invoke --network testnet --source admin --id $CONTRACT_ID -- get_rating_fee
stellar contract invoke --network testnet --source admin --id $CONTRACT_ID -- get_version
```

You should see the admin address, `"1000000"`, and `"1"` respectively.

## 5. Deploy to mainnet (production)

Everything below runs against the **public network**. Double-check every
command before executing — mainnet actions cost real XLM and are irreversible.

### 5a. Install the WASM

```bash
WASM_HASH=$(stellar contract install \
  --network mainnet \
  --source admin \
  --wasm target/wasm32-unknown-unknown/release/wave_hub_registry.wasm)

echo "Mainnet WASM hash: $WASM_HASH"
```

Store this hash somewhere durable (secrets manager, ops doc). You'll need it
again for future upgrades.

### 5b. Deploy the contract

```bash
CONTRACT_ID=$(stellar contract deploy \
  --network mainnet \
  --source admin \
  --wasm-hash $WASM_HASH)

echo "Mainnet contract: $CONTRACT_ID"
```

### 5c. Identify the payment token

On mainnet, use the official USDC SAC address:

```
CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75
```

(Source: [Circle's Stellar USDC page](https://www.circle.com/blog/usdc-now-available-on-stellar).)

### 5d. Initialize on mainnet

```bash
USDC_SAC=CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75
ADMIN_ADDRESS=$(stellar keys address admin)

# fees: 0.5 USDC registration, 0.1 USDC per rating
stellar contract invoke \
  --network mainnet \
  --source admin \
  --id $CONTRACT_ID \
  -- initialize \
  --admin $ADMIN_ADDRESS \
  --token $USDC_SAC \
  --reg_fee 5000000 \
  --rate_fee 1000000
```

> **Important:** the admin address you pass here controls everything — fee
> changes, project registration, upgrades, withdrawals. Use a hardware-wallet
> backed key or a multisig address for mainnet.

### 5e. Set a treasury address (optional)

By default the treasury is the admin. To route collected fees elsewhere:

```bash
stellar contract invoke \
  --network mainnet \
  --source admin \
  --id $CONTRACT_ID \
  -- set_treasury \
  --admin $ADMIN_ADDRESS \
  --treasury <G...>
```

## 6. Common operations

### Register a project

The `project_id` is a Soroban `Symbol` (max 32 chars, `[a-zA-Z0-9_]`). Use
the project's slug from the web app.

```bash
stellar contract invoke \
  --network mainnet \
  --source admin \
  --id $CONTRACT_ID \
  -- register_project \
  --admin $ADMIN_ADDRESS \
  --project_id my_project_slug \
  --account_id <G...project account...> \
  --payer $ADMIN_ADDRESS
```

### Rate a project (user)

A user signs this transaction with their own wallet (Freighter, etc.):

```bash
stellar contract invoke \
  --network mainnet \
  --source user_key \
  --id $CONTRACT_ID \
  -- rate_project \
  --user $(stellar keys address user_key) \
  --project_id my_project_slug \
  --score 5
```

The user is charged the current `rate_fee` (0.1 USDC by default). They must
have a USDC trustline set up and sufficient balance.

### Read the average rating

```bash
stellar contract invoke \
  --network mainnet \
  --source admin \
  --id $CONTRACT_ID \
  -- get_project_rating \
  --project_id my_project_slug
# → { "count": "3", "sum": "12" }  (average = 12/3 = 4.0)
```

### Withdraw collected fees

```bash
stellar contract invoke \
  --network mainnet \
  --source admin \
  --id $CONTRACT_ID \
  -- withdraw_fees \
  --admin $ADMIN_ADDRESS
```

## 7. Upgrading the contract

The contract uses Soroban's standard upgrade pattern. Storage (projects,
ratings, fees, treasury, admin) is preserved across upgrades.

### 7a. Build and install the new WASM

```bash
cd contracts/wave_hub_registry
# (edit source, add tests, etc.)
stellar contract build

NEW_WASM_HASH=$(stellar contract install \
  --network mainnet \
  --source admin \
  --wasm target/wasm32-unknown-unknown/release/wave_hub_registry.wasm)
```

### 7b. Call `upgrade`

```bash
stellar contract invoke \
  --network mainnet \
  --source admin \
  --id $CONTRACT_ID \
  -- upgrade \
  --admin $ADMIN_ADDRESS \
  --new_wasm_hash $NEW_WASM_HASH
```

The version counter bumps automatically. Verify:

```bash
stellar contract invoke \
  --network mainnet \
  --source admin \
  --id $CONTRACT_ID \
  -- get_version
```

### 7c. Upgrade safety notes

- **Never change the layout of existing storage keys** in an upgrade. You can
  add new keys; renaming or changing the type of existing ones corrupts data.
- **Run the new version against testnet first.** Deploy the upgrade on
  testnet, exercise every entrypoint, and only then repeat on mainnet.
- **Add a migration function** when a new field needs backfilling. Mark it
  admin-gated and idempotent, then call it once after the upgrade lands.
- **Upgrade is irreversible** in the sense that the old WASM hash won't
  roll back by itself — you'd need to deploy the old WASM again and call
  `upgrade` with its hash.

## 8. Integrating the contract with the web app

Store these in `web/.env.local`:

```
NEXT_PUBLIC_CONTRACT_ID=C...        # the contract ID from step 5b
NEXT_PUBLIC_CONTRACT_NETWORK=mainnet
NEXT_PUBLIC_USDC_SAC=CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75
```

On the rating page, the flow is:

1. User connects Freighter (or another Stellar wallet).
2. App builds a `rate_project` invocation using the Stellar SDK + Soroban RPC.
3. App asks wallet to sign — user pays 0.1 USDC via the SAC transfer inside
   the contract.
4. App polls the transaction result. On success, the web DB also records the
   rating for fast querying and uses the on-chain contract as source of
   truth.

## 9. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Error(Contract, #9)` on `rate_project` | User already rated | Check `has_rated` first |
| `Error(Contract, #6)` on `rate_project` | Project not registered on-chain | Run `register_project` first |
| `host error: trustline missing` | User has no USDC trustline | User adds trustline via their wallet |
| `host error: balance insufficient` | Not enough USDC | Fund user's account |
| `Error(Contract, #3)` | Non-admin called an admin function | Use the admin key |

## 10. Contract addresses

After deployment, record these for the team:

| Network | Contract ID | WASM hash | Admin | Token |
|---|---|---|---|---|
| testnet | `C...` | `...` | `G...` | native XLM SAC |
| mainnet | `C...` | `...` | `G...` (multisig) | USDC SAC |
