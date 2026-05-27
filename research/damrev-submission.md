# DAMREV — Gold-backed Asset (Research Submission)

## Overview

DAMREV issues `DAMREV`, a gold-backed native Stellar asset representing fractional ownership in audited U.S. alluvial gold reserves. The program is designed for compliant, institutional-grade tokenization, combining on-chain asset issuance with off-chain custody, third-party audits, and ISO 20022 messaging alignment to enable interoperability with traditional financial rails.

## Asset Type & Issuance Model

- Asset code: `DAMREV`
- Issuer account (mainnet): `GDHHAKQBIJMPHGMMCIJZZJHCKFYSUHWWQEIJFPLOLXBWYCU4RDQDPYJF`
- Issuance: native Stellar asset (credit_alphanum12) issued by the issuer above. Tokens are minted by the issuer and distributed to approved counterparties; transfer restrictions and compliance gating are enforced off-chain and via issuer policy where required.
- Backing model: 1 DAMREV token = 1 gram of segregated, audited physical alluvial gold held in secure custodial vaults; regular third-party reserve attestations are published by DAMREV and its custodians.

## Regulatory Compliance

DAMREV describes itself as operating with ISO 20022 messaging standards and with on-chain auditability combined with off-chain KYC/AML and accredited-investor gating when necessary. The project uses custodian attestations and legal structures (Ancore, LLC d/b/a DAMREV USA referenced in public materials) to meet regulatory requirements for security-token style offerings.

## On-chain Verification

1. `stellar.toml` (published by domain):

   - Location: https://damrev.com/.well-known/stellar.toml
   - `CURRENCIES` entry for `DAMREV` with issuer `GDHHAKQBIJMPHGMMCIJZZJHCKFYSUHWWQEIJFPLOLXBWYCU4RDQDPYJF` (verified).

2. Horizon asset record (mainnet):

   - Query:

     ```bash
     curl -sS "https://horizon.stellar.org/assets?asset_code=DAMREV&asset_issuer=GDHHAKQBIJMPHGMMCIJZZJHCKFYSUHWWQEIJFPLOLXBWYCU4RDQDPYJF" | jq .
     ```

   - Observed fields: `balances.authorized = "1000000000000.0000000"`, `accounts.authorized = 53`, `asset_type = credit_alphanum12` (this confirms active issuance and number of authorized trustlines at time of query).

3. Issuer account details (Horizon):

   - Query:

     ```bash
     curl -sS https://horizon.stellar.org/accounts/GDHHAKQBIJMPHGMMCIJZZJHCKFYSUHWWQEIJFPLOLXBWYCU4RDQDPYJF | jq .
     ```

   - The issuer account exists and lists `home_domain = "damrev.com"`, enabling `stellar.toml` discovery and on-chain provenance.

## Markets & Activity

DAMREV is tradable on Stellar via trustlines and offers; token liquidity and trading pairs can be inspected using Horizon orderbook and trades endpoints or third-party explorers (Stellar Expert, StellarTerm, StellarX forks). Example queries:

- Orderbook (example — XLM/DAMREV):
  ```bash
  curl -sS "https://horizon.stellar.org/order_book?selling_asset_type=native&buying_asset_type=credit_alphanum12&buying_asset_code=DAMREV&buying_asset_issuer=GDHHAKQBIJMPHGMMCIJZZJHCKFYSUHWWQEIJFPLOLXBWYCU4RDQDPYJF" | jq .
  ```

- Recent payments for the asset:
  ```bash
  curl -sS "https://horizon.stellar.org/payments?asset_code=DAMREV&asset_issuer=GDHHAKQBIJMPHGMMCIJZZJHCKFYSUHWWQEIJFPLOLXBWYCU4RDQDPYJF&order=desc&limit=20" | jq .
  ```

On-chain volume (aggregated) is available via Horizon trade and payments endpoints or via analytics providers (Stellar Expert). For authoritative verification at submission time, run the `payments` or `trades` queries and capture totals over your desired window.

## Documentation & Sources

- Official website: https://www.damrev.com
- Stellar TOML: https://damrev.com/.well-known/stellar.toml
- Horizon asset query: https://horizon.stellar.org/assets?asset_code=DAMREV&asset_issuer=GDHHAKQBIJMPHGMMCIJZZJHCKFYSUHWWQEIJFPLOLXBWYCU4RDQDPYJF

## Submission Checklist

- [x] Project is part of Stellar Wave-visible projects (research sources and Drips references available in repository `research/`).
- [x] Issuer account validated and `stellar.toml` present.
- [x] Description (>=200 words) prepared and included in submission payload.
- [x] Prepared JSON payload and helper script added at `scripts/damrev_project.json` and `scripts/submit_damrev.sh`.

## Notes for Admin / Reviewer

1. Verify current supply and authorized accounts via Horizon before approving.
2. Confirm custodial audit reports and legal entity documentation referenced on damrev.com (off-chain KYC/AML and attestations) prior to listing as approved.
3. If transfer restrictions are required in your jurisdiction, coordinate with DAMREV legal to map allowed trading flows and incorporate any UI disclosure.
