# Blend Capital Research Note

## Submission Metadata

- Name: Blend Capital
- Category: defi
- Tags: defi, lending, borrowing, soroban, collateral, stablecoins, stellar
- Website: https://www.blend.capital/
- GitHub: https://github.com/blend-capital
- Stellar account ID: `GDJEHTBE6ZHUXSWFI642DCGLUOECLHPF3KSXHPXTSTJ7E3JF6MQ5EZYY` (BLND issuer account)
- Stellar contract ID: `CDSYOAVXFY7SM5S64IZPPPYB4GVGGLMQVFREPSQQEZVIWXX5R23G4QSU` (v2 Pool Factory)

## Suggested Hub Description

Blend Capital is a Stellar-native lending and borrowing protocol built on Soroban. The protocol is modular rather than monolithic: anyone can create a lending market, choose its oracle, set asset-level risk parameters, and attach a backstop module that absorbs bad debt before losses are socialized to lenders. In practice, users supply supported assets into a Blend pool, receive yield funded by borrowers, and can optionally post those supplied positions as collateral to borrow other pool assets. Borrow interest is utilization-based and reactive. Blend documents that each asset has a target utilization and three configured rate points, and rates move dynamically when utilization stays too high or too low so liquidity is pulled back toward the target band.

Supported assets are pool-specific, but the official Blend docs explicitly reference live integrations for assets such as USDC, EURC, and XLM. The docs also make clear that an asset is only borrowable when its liability factor is above zero, and it is only valid collateral when its collateral factor is above zero. Risk controls are applied per asset and pool. These include collateral factors, liability factors, utilization caps, and supply caps. Blend also depends on a pool-level SEP-40 oracle contract, which cannot be changed after pool creation, so oracle selection is part of the protocol's risk model rather than an afterthought.

Liquidations are handled through Dutch auctions. When an account exceeds its borrow limit, any participant can initiate a liquidation that transfers part of the user's collateral and debt to a liquidator. If liquidations do not fully resolve a shortfall, bad debt is assigned to the backstop and auctioned. Blend's backstop uses BLND:USDC LP shares as first-loss capital, and backstop depositors earn a share of borrower interest for insuring pools. TVL is public on DefiLlama; Blend showed about $91.84 million TVL and $36.46 million borrowed on March 25, 2026.

## Sources

- Blend docs: https://docs.blend.capital/
- Deployments: https://docs.blend.capital/mainnet-deployments
- Whitepaper: https://docs.blend.capital/blend-whitepaper
- Lending: https://docs.blend.capital/users/lending-borrowing/lending
- Borrowing: https://docs.blend.capital/users/lending-borrowing/borrowing
- Liquidations: https://docs.blend.capital/users/lending-borrowing/liquidations
- Backstopping: https://docs.blend.capital/users/backstopping
- Risk parameters: https://docs.blend.capital/pool-creators/adding-assets/risk-parameters
- Interest rates: https://docs.blend.capital/pool-creators/adding-assets/interest-rates
- Oracle selection: https://docs.blend.capital/pool-creators/selecting-an-oracle
- Integrations: https://docs.blend.capital/tech-docs/integrations
- BLND asset on Stellar Expert: https://stellar.expert/explorer/public/asset/BLND-GDJEHTBE6ZHUXSWFI642DCGLUOECLHPF3KSXHPXTSTJ7E3JF6MQ5EZYY-1
- Pool factory contract on Stellar Expert: https://stellar.expert/explorer/public/contract/CDSYOAVXFY7SM5S64IZPPPYB4GVGGLMQVFREPSQQEZVIWXX5R23G4QSU
- TVL: https://defillama.com/protocol/blend
