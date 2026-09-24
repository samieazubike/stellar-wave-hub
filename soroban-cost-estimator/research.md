# Soroban Cost Estimator — Stellar Wave Hub research (issue #332)

## Eligibility and duplicate check

- On 2026-09-24, searched the Hub [Explore](https://usestellarwavehub.vercel.app/explore) page for “Soroban Cost Estimator” and reviewed its [approval queue](https://usestellarwavehub.vercel.app/queue). No existing or pending entry matched the project before submission.
- The exact [Stellar-Cost-Labs/soroban-cost-estimator](https://github.com/Stellar-Cost-Labs/soroban-cost-estimator) repository appears in [Drips' approved Stellar Wave repos](https://www.drips.network/wave/stellar/repos) when searching for “cost-estimator”. The project is eligible; issue #332 concerns this Hub submission, not code changes to the estimator.

## Suggested Hub fields

| Field | Value |
| --- | --- |
| Name | Soroban Cost Estimator |
| Category | Tools |
| Network | Testnet (verified fixture deployment; the CLI can query other configured networks) |
| Tags | soroban, developer-tooling, fee-estimation, rpc, cost-monitoring |
| Website | https://github.com/Stellar-Cost-Labs/soroban-cost-estimator |
| Repository | https://github.com/Stellar-Cost-Labs/soroban-cost-estimator |
| Verified Soroban contract | `CC4WIEYYSCFGDJXMLZ73FKUUJNDEOJRNOOBZHI55QR27NW4RCNTHAQ5T` (increment **test fixture**, not a protocol contract) |

## Original description for the Hub (336 words)

Soroban Cost Estimator is a Rust command-line tool for developers who need to understand the resource cost of a Stellar smart contract before sending a transaction. Fee estimates can go stale when a network changes resource prices, and a compiled contract alone does not tell a developer how many instructions or ledger reads a particular call will use. The tool accepts a compiled WASM file, uses Stellar RPC's simulateTransaction method for an upload or a call to an already deployed contract, and reports CPU instructions, memory, ledger footprint, transaction size, and resource fees in stroops and XLM.

Its second workflow tracks the network's pricing configuration. It fetches Soroban ConfigSetting entries through RPC, decodes their XDR, saves local snapshots, and compares a new snapshot with an older one. A watch command can repeat this check, while a local cache links earlier estimates to the pricing settings that produced them. This helps a team identify when an estimate may need to be rerun after network configuration changes. Fee arithmetic uses integer stroops, with the simulation's resource fee treated as the total and network rates used to break out CPU, storage, and bandwidth components.

The repository includes a small increment contract built specifically as a test fixture. Its testnet contract ID is CC4WIEYYSCFGDJXMLZ73FKUUJNDEOJRNOOBZHI55QR27NW4RCNTHAQ5T. StellarExpert confirms its deployment on July 31, 2026 and displays the WASM hash recorded in the fixture documentation. The project's comparison records 524,389 CPU instructions and about 18,999 stroops for a simulated increment call using both this tool and the Stellar CLI. The explorer activity view shows the deployment; the increment comparison used simulation and should not be mistaken for a submitted on-chain invocation.

This is developer tooling, not a deployed fee oracle or a contract that handles user funds. Results depend on the selected network, current ledger state, RPC response, and invocation arguments. The source explicitly warns when fee-rate settings cannot be fetched, and the project describes itself as unaudited. Maintainer information and contribution guidance are public in the Stellar-Cost-Labs repository and its community links.

## Independent verification and technical notes

1. The [README](https://github.com/Stellar-Cost-Labs/soroban-cost-estimator/blob/main/README.md) describes the CLI workflows and distinguishes upload simulation from invocation simulation. A deployed contract is required for invocation, whereas upload estimation uses a WASM artifact. The [Rust manifest](https://github.com/Stellar-Cost-Labs/soroban-cost-estimator/blob/main/Cargo.toml) names the CLI crate and its dependencies.
2. [RPC response parsing](https://github.com/Stellar-Cost-Labs/soroban-cost-estimator/blob/main/src/rpc/simulate.rs) handles camelCase fields, string or numeric cost values, and modern SorobanTransactionData XDR. [Fee calculation](https://github.com/Stellar-Cost-Labs/soroban-cost-estimator/blob/main/src/report/fee_calc.rs) uses network-sourced rates and integer stroops; the refundable portion is the remainder of the RPC total, floored at zero for malformed or missing fee cases. This is a useful code-level qualification of the report, beyond marketing language.
3. The project's [fixture cross-check](https://github.com/Stellar-Cost-Labs/soroban-cost-estimator/blob/main/tests/fixtures/contract/README.md) identifies the deployed increment contract, WASM SHA-256 `ea14bca998e98f0ddb338e8e5cef6e19f07378a3b71e8b4f8868cedc857e4ecd`, and [deployment transaction](https://stellar.expert/explorer/testnet/tx/d89a51f0c0c1c7d9a0497a59ec17611605e4e50401e9deccf8df2fe8de2ab6ef). Independently checked the [StellarExpert testnet contract page](https://stellar.expert/explorer/testnet/contract/CC4WIEYYSCFGDJXMLZ73FKUUJNDEOJRNOOBZHI55QR27NW4RCNTHAQ5T): it reports a WASM contract created 2026-07-31 at 14:53:15 UTC, with hash `ea14bca9…857e4ecd` and the matching transaction. The visible activity is deployment, while the 524,389-instruction comparison is a simulation record.
4. The project is maintained in the [Stellar-Cost-Labs GitHub repository](https://github.com/Stellar-Cost-Labs/soroban-cost-estimator); its README names [@aigbagbobila](https://github.com/aigbagbobila) as maintainer and provides [contributing guidance](https://github.com/Stellar-Cost-Labs/soroban-cost-estimator/blob/main/CONTRIBUTING.md), [issues](https://github.com/Stellar-Cost-Labs/soroban-cost-estimator/issues), Telegram and Discord links. Some README clone commands and Cargo metadata still refer to the prior `aigbagbobila` repository path, so use the current Drips-linked `Stellar-Cost-Labs` URL above.

## Evidence screenshots

The Hub submission includes two research images for admin review: a screenshot of the StellarExpert testnet contract deployment and a screenshot of the project's fixture cross-check table and reproduction notes. These show the exact contract and the reported tool-versus-CLI comparison. The images are attached through the Hub's Research Images field, which is visible to administrators during review.
