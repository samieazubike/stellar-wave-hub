# FxDAO

- Category: defi
- Tags: defi, lending, borrowing, stablecoins, cdp, liquidations, soroban, stellar-wave
- Website: https://fxdao.io
- GitHub: https://github.com/FxDAO
- Logo: https://assets.fxdao.io/brand/FxDAO-logo.png
- Stellar account ID: `GC7JVOXZJSHY3GHKWUJWKIUYWEJ4RZABSRQZQ5JBZEC5QUTYBUHVNIKV`
- Stellar contract ID: `CCUN4RXU5VNDHSF4S4RKV4ZJYMX2YWKOH6L4AKEKVNVDQ7HY5QIAO4UB`

FxDAO is a Stellar-native borrowing protocol centered on collateralized debt positions. Users open Vaults, deposit XLM as collateral, and mint synthetic stablecoins such as USDx, EURx, or GBPx against that position. The protocol documents an issuance ceiling of up to 85% of collateral value, which corresponds to an opening collateral ratio of about 115%, while the minimum collateral ratio before liquidation is currently 110%. That structure makes FxDAO closer to a CDP system than to a pooled money market: the user is not borrowing from a shared lender pool with utilization-driven rates, but minting protocol-issued debt against locked collateral.

The supported collateral is currently narrow by design. FxDAO states that Lumens are the only accepted collateral asset today because XLM is the network's native asset, has the deepest liquidity on Stellar, and avoids issuer-side clawback risk. On the debt side, FxDAO publishes classic-asset issuers and Soroban token contracts for FXG, USDx, EURx, and GBPx, plus a Soroban Vaults contract on mainnet. The protocol's official addresses page lists the mainnet protocol manager and admin account as `GC7JVOXZJSHY3GHKWUJWKIUYWEJ4RZABSRQZQ5JBZEC5QUTYBUHVNIKV` and the mainnet Vaults contract as `CCUN4RXU5VNDHSF4S4RKV4ZJYMX2YWKOH6L4AKEKVNVDQ7HY5QIAO4UB`. Both identifiers resolve through Stellar Expert API, which shows the account is active and the Vaults contract was created by that admin account.

FxDAO's pricing model is intentionally simple. Its borrowing cost is a flat 0.25% fee on collateral deposited rather than a floating utilization curve. The main risk controls are overcollateralization, redemptions, and open liquidations. If a vault falls below the minimum collateral ratio, any qualifying liquidator can repay the stablecoin debt and seize the collateral minus the protocol's 0.5% share rate. FxDAO also allows stablecoin holders to redeem against the riskiest vaults, which pressures unhealthy positions before they drift too far from solvency. As of 2026-03-27, DefiLlama reported roughly $977,183 in TVL for FxDAO on Stellar. That TVL is public and DefiLlama states its methodology is the value of XLM locked in the Vaults contract.

## Sources

- FxDAO basics: https://fxdao.io/docs/the-basics
- FxDAO borrowing: https://fxdao.io/docs/borrowing
- FxDAO liquidations: https://fxdao.io/docs/liquidations
- FxDAO official addresses: https://fxdao.io/docs/addresses
- Stellar Expert account API: https://api.stellar.expert/explorer/public/account/GC7JVOXZJSHY3GHKWUJWKIUYWEJ4RZABSRQZQ5JBZEC5QUTYBUHVNIKV
- Stellar Expert contract API: https://api.stellar.expert/explorer/public/contract/CCUN4RXU5VNDHSF4S4RKV4ZJYMX2YWKOH6L4AKEKVNVDQ7HY5QIAO4UB
- DefiLlama protocol API: https://api.llama.fi/protocol/fxdao
