# Slender

- Category: defi
- Tags: defi, lending, borrowing, soroban, flash-loans, overcollateralized, stellar-wave
- Website: https://slender.fi/
- GitHub: https://github.com/eq-lab/slender
- Stellar account ID: `GCVWQNFTPVJISL3NM7UWJIESDVL6B73RS6NYV4P3J4WSC7WSTFECEO2J`
- Stellar contract ID: `CCL2KTHYOVMNNOFDT7PEAHACUBYVFLRH2LYWVQB6IPMHHAVUBC7ZUUC2`

Slender is a Stellar Community Fund backed lending and borrowing protocol built on Soroban. The Stellar Community Fund project page classifies Slender as a lending and borrowing project, and the protocol's public app, codebase, and Certora audit all support that classification. Slender uses a pooled money market design rather than isolated vaults. Users deposit supported assets into a reserve, receive yield-bearing sTokens, and can borrow other assets against posted collateral. The debt is overcollateralized and interest-bearing, while reserve liquidity is shared across all suppliers and borrowers. Slender also supports flash loans, which makes it broader than a basic collateralized lending desk.

The currently published mainnet deployment supports three live markets: XLM, XRP, and USDC. Slender's mainnet deployment config shows that all three reserves have borrowing enabled and each reserve has a 90% utilization cap, which is meant to keep part of the pool liquid for withdrawals. The same config publishes reserve-specific collateral discounts and liquidity caps. XLM and XRP are both configured with an 80% discount, while USDC is configured with a 95% discount, making USDC the strongest posted collateral of the three on the live configuration. Penalty order is also set per reserve, so the protocol can liquidate collateral in a deterministic sequence.

Interest rates are utilization driven instead of fixed. Slender's SCF submission says rates move with supply and demand, and the published mainnet config exposes the current parameters directly: `IR_INITIAL_RATE_BPS=200`, `IR_MAX_RATE_BPS=50000`, `IR_ALPHA=143`, and `IR_SCALING_COEFF_BPS=9000`. That means borrowing starts at a relatively low base rate but ramps up sharply as utilization approaches the cap. Mainnet also sets a `FLASH_LOAN_FEE_BPS=9`, so flash borrowers pay 0.09% when the loan is repaid in the same transaction flow. The pool config also includes `USER_ASSET_LIMIT=3`, a one day grace period, and minimum collateral and debt thresholds in the base asset.

Slender's risk model is visible both in configuration and in contract code. Reserve-level controls include `discount`, `liquidity_cap`, `util_cap`, and borrowing enablement. Pool-level controls include `initial_health`, `grace_period`, `timestamp_window`, `flash_loan_fee`, and `liquidation_protocol_fee`. The liquidation function checks whether an account is still a good position; if not, a liquidator can repay debt and seize collateral, with a protocol fee carved out of the liquidated amount. Slender also depends on a SEP-40 oracle feed and uses TWAP-related parameters, timestamp checks, and sanity bounds to reduce manipulation or stale-price risk. I verified the mainnet pool contract, oracle contract, and XLM token contract through the Stellar Expert contract API. The pool contract API also exposes the mainnet creator account above, which I am using as the clearest public on-chain account identifier for this submission. I did not find a separate, protocol-specific public TVL source in the official Slender docs, app, or DefiLlama API on March 27, 2026, so TVL should be treated as not publicly published from the sources below.

## Sources

- Stellar Community Fund project page: https://communityfund.stellar.org/dashboard/submissions/recPZV9KigYc4et2I
- Slender website: https://slender.fi/
- Slender app: https://app.slender.fi/
- Slender GitHub: https://github.com/eq-lab/slender
- Slender README: https://raw.githubusercontent.com/eq-lab/slender/master/README.md
- Mainnet deployment artifacts: https://raw.githubusercontent.com/eq-lab/slender/master/deploy/artifacts/mainnet/.contracts
- Mainnet deployment config: https://raw.githubusercontent.com/eq-lab/slender/master/deploy/scripts/.mainnet.env
- Deployment script: https://raw.githubusercontent.com/eq-lab/slender/master/deploy/scripts/deploy.sh
- Reserve configuration type: https://raw.githubusercontent.com/eq-lab/slender/master/interfaces/pool-interface/src/types/reserve_configuration.rs
- Pool configuration type: https://raw.githubusercontent.com/eq-lab/slender/master/interfaces/pool-interface/src/types/pool_config.rs
- Liquidation implementation: https://raw.githubusercontent.com/eq-lab/slender/master/contracts/pool/src/methods/liquidate.rs
- Certora audit summary: https://www.certora.com/reports/slender
- Stellar Expert pool contract API: https://api.stellar.expert/explorer/public/contract/CCL2KTHYOVMNNOFDT7PEAHACUBYVFLRH2LYWVQB6IPMHHAVUBC7ZUUC2
- Stellar Expert oracle contract API: https://api.stellar.expert/explorer/public/contract/CALI2BYU2JE6WVRUFYTS6MSBNEHGJ35P4AVCZYF3B6QOE3QKOB2PLE6M
- Stellar Expert XLM token contract API: https://api.stellar.expert/explorer/public/contract/CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA
- Stellar Expert account API: https://api.stellar.expert/explorer/public/account/GCVWQNFTPVJISL3NM7UWJIESDVL6B73RS6NYV4P3J4WSC7WSTFECEO2J
