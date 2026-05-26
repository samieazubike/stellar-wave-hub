# CoopStable — Stellar Wave Research Submission

## Project Selected

- **Project:** CoopStable (Cooperative Stablecoin Protocol)
- **Wave / ecosystem source:** Stellar Community Fund awardee — [CoopStable v2 – Yield sharing stablecoin](https://communityfund.stellar.org/project/coopstable-v2-yield-sharing-stablecoin-nrc); open-source under [BreadchainCoop](https://github.com/BreadchainCoop)
- **Domain:** Stablecoin issuance / DeFi / cooperative finance
- **Website:** https://www.coopstable.app/
- **Contracts repo:** https://github.com/BreadchainCoop/Coop-Stable-Contracts
- **Client repo:** https://github.com/BreadchainCoop/coopstable-client (listed in `stellar.toml`)

## Why This Matches the Task

CoopStable is a live **asset-issuance** protocol on Stellar mainnet. It mints **cUSD**, a collateral-backed stablecoin pegged 1:1 to USDC, through Soroban smart contracts. Unlike generic payment apps, the core product is issuing and redeeming a new on-chain asset with published metadata, reserve logic, and verifiable issuer identity. The project is funded by the **Stellar Community Fund** (SDF’s flagship builder program) and ships production mainnet contracts with a valid **`stellar.toml`** at `coopstable.app`.

## Verifiable On-Chain Information

### Asset issuer (Stellar account)

| Field | Value |
|-------|-------|
| **Issuer account** | `GB4E4EA26SXUJSFJTMFCVGVNEKWGNQ44MLFRHHXWQHQ54RD7KQTYBNSR` |
| **Home domain** | `coopstable.app` |
| **Asset code** | `CUSD` |
| **Full asset ID** | `CUSD-GB4E4EA26SXUJSFJTMFCVGVNEKWGNQ44MLFRHHXWQHQ54RD7KQTYBNSR-1` |
| **Soroban token contract (SAC)** | `CA7JSNCTAGTVXJJX65YIN53XAXK72NZPD5Q62YUQXV7R7V45ELKONCJ5` |

**Verification endpoints:**

- Account: https://horizon.stellar.org/accounts/GB4E4EA26SXUJSFJTMFCVGVNEKWGNQ44MLFRHHXWQHQ54RD7KQTYBNSR
- Asset: https://api.stellar.expert/explorer/public/asset/CUSD-GB4E4EA26SXUJSFJTMFCVGVNEKWGNQ44MLFRHHXWQHQ54RD7KQTYBNSR-1
- Contract: https://api.stellar.expert/explorer/public/contract/CA7JSNCTAGTVXJJX65YIN53XAXK72NZPD5Q62YUQXV7R7V45ELKONCJ5

### Mainnet Soroban contracts (from `mainnet.contracts.json`)

| Component | Contract ID |
|-----------|-------------|
| cUSD token | `CA7JSNCTAGTVXJJX65YIN53XAXK72NZPD5Q62YUQXV7R7V45ELKONCJ5` |
| cUSD Manager | `CBVNC2YKRNPNZSIXMRVMPUODT2A4ORUSSYLUXXEUEAXO6QZHHZKXRZ74` |
| Lending Yield Controller | `CAIYIGHOUS5CG5MYNW4TPOW635ZLXIBEFFXJ6J4Z5ZBO3UC344VZRP3N` |
| Yield Distributor | `CA2BNJFVCRJWCWLLOMJ3E3A62XMZ43U4K7RC6WVBOFC7RPYOJAH5BJVH` |
| Yield Adapter Registry | `CAKIIOTQG6F5EVV4D2DUNZV766WCFO3ADUYBIN43UKEBWALXS362MHSG` |
| Blend Capital Adapter | `CDZR3DQJQNVU5WIHXF5OHFVCA4LVPWWIUN6BDX46OIZZ2A2X6U6ROKEU` |
| Blend pool | `CAJJZSGMMM3PD7N33TAPHGBUGTB43OC73HVIK2L2G6BNGGGYOSSYBXBD` |
| Treasury account | `GCEUSAY6FKAYIAFNYZUKSO5GIPWGUWPKVVPYOL5MFXBKSDOVGMLZNQTN` |
| Collateral (USDC Soroban) | `CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75` |

### On-chain metrics (Stellar Expert, May 2026)

- **Total supply:** 151,132,480 base units (7 decimals) ≈ **15.11 cUSD**
- **Trustlines:** 7 total, 7 authorized, 3 funded
- **Payments:** 10 operations; **~232.11 cUSD** cumulative payment amount (base units / 10^7)
- **DEX trades:** 0 (liquidity routed through Blend yield pool, not classic SDEX offers)
- **Contract activity:** 23 sub-invocations, 25 events (cUSD SAC contract)

## stellar.toml Verification

Fetched from https://coopstable.app/.well-known/stellar.toml:

- `ORG_NAME` / `ORG_DBA`: CoopStable
- `ORG_URL`: https://www.coopstable.app/
- `ORG_GITHUB`: https://github.com/BreadchainCoop/coopstable-client
- `ORG_DESCRIPTION`: “A yield sharing stablecoin for the Stellar ecosystem”
- `[[CURRENCIES]]` entry for **CUSD** with issuer `GB4E4EA26SXUJSFJTMFCVGVNEKWGNQ44MLFRHHXWQHQ54RD7KQTYBNSR`
- `desc`: “Coopstable is a fully collateralized stablecoin pegged to yield bearing USDC.”
- Principal: Bread Cooperative (`contact@breadchain.xyz`)

Stellar Expert `toml_info` cross-confirms name, issuer, and image metadata for the asset.

## Asset Type and Issuance Model

### Asset type

- **Category:** Crypto-collateralized stablecoin (pegged to USDC)
- **Token:** cUSD (CoopStable cooperative dollar)
- **Decimals:** 7
- **Implementation:** Soroban smart contracts + Stellar Asset Contract (SAC) for `CUSD`

### Issuance model

1. **Collateral deposit:** Users deposit USDC into the Lending Yield Controller.
2. **1:1 minting:** cUSD Manager mints cUSD equal to collateral (over-collateralization enforced by contract logic).
3. **Yield routing:** Collateral is deployed to **Blend Capital** via the Blend Capital Adapter registered in the Yield Adapter Registry.
4. **Redemption:** Burning cUSD returns principal collateral; users retain deposited principal (“lossless donation” model).
5. **Yield distribution:** Interest and emissions (e.g. BLND) are claimed periodically; **10%** to treasury, **90%** split equally among cooperative members (24-hour epochs by default).

### Supported markets and liquidity

| Pair / venue | Role |
|--------------|------|
| **cUSD ↔ USDC** | Primary peg; collateral and redemption rail |
| **USDC → Blend pool** | Yield generation (`CAJJZSGMMM3PD7N33TAPHGBUGTB43OC73HVIK2L2G6BNGGGYOSSYBXBD`) |
| **Classic SDEX** | No active cUSD order-book trades at time of research; liquidity is protocol-internal |

Future assets can be added through the adapter registry without redeploying core contracts.

## Regulatory and Compliance Model

CoopStable is a **decentralized cooperative protocol**, not a licensed money transmitter:

| Layer | Approach |
|-------|----------|
| **Collateral** | 100% USDC-backed mint/burn; supply verifiable on-chain |
| **Governance** | Breadchain Cooperative; MIDAO-listed org address in `stellar.toml` |
| **Access control** | Soroban role-based admin (owner/admin) on managers and distributors |
| **Transparency** | Public `stellar.toml`, open-source contracts, published mainnet addresses |
| **User funds** | Principal returned on withdrawal; only **yield** is socialized |
| **KYC/AML** | No issuer-level KYC in protocol; users interact via self-custody wallets |

The protocol does **not** claim fiat reserve audits like USDC; compliance is **smart-contract-enforced collateralization** plus cooperative governance. Integrators should perform their own regulatory analysis before offering cUSD to retail users.

## SCF / Stellar Ecosystem Verification

- Listed on SCF funded projects showcase: **“CoopStable v2 - Yield sharing stablecoin”**
- Project page: https://communityfund.stellar.org/project/coopstable-v2-yield-sharing-stablecoin-nrc
- Active GitHub development: `BreadchainCoop/Coop-Stable-Contracts` (Soroban, MIT license)

## Hub Submission Payload

| Field | Value |
|-------|-------|
| **name** | CoopStable |
| **category** | `defi` |
| **stellar_account_id** | `GB4E4EA26SXUJSFJTMFCVGVNEKWGNQ44MLFRHHXWQHQ54RD7KQTYBNSR` |
| **stellar_contract_id** | `CA7JSNCTAGTVXJJX65YIN53XAXK72NZPD5Q62YUQXV7R7V45ELKONCJ5` |
| **stellar_network** | `mainnet` |
| **tags** | `stablecoin, asset-issuance, soroban, defi, collateral, compliance, yield, cooperative, tokenization, stellar-wave` |
| **website_url** | `https://www.coopstable.app/` |
| **github_repos** | Coop-Stable-Contracts, coopstable-client |

## Test / Validation Checklist

- [x] SCF-funded Stellar ecosystem project (public listing)
- [x] Issuer account valid on Horizon; `home_domain` = `coopstable.app`
- [x] `stellar.toml` published and matches CUSD asset metadata
- [x] Collateral and issuance model documented with contract addresses
- [x] Original description ≥ 200 words (see `submit-coopstable.js`)
- [x] Category `defi` and tags reflect stablecoin / asset issuance

## Submission Performed

Use `research/submit-coopstable.js` after uploading research screenshots to `/api/upload`.

```bash
node research/submit-coopstable.js YOUR_JWT_TOKEN
```

Recommended screenshots:

1. Stellar Expert asset page for CUSD
2. `coopstable.app/.well-known/stellar.toml` (currency section)
3. SCF project page (CoopStable v2)
4. GitHub `mainnet.contracts.json` contract map
5. Stellar Expert cUSD Manager / Lending Controller contract pages
