# AgentPay - Stellar Wave Research Submission

## Project Selected

- **Project:** AgentPay
- **Wave source:** [`ysfadm/AgentPay`](https://www.drips.network/wave/stellar/repos), approved in the Stellar Wave Program repository catalog
- **Category:** Payments
- **Repository:** https://github.com/ysfadm/AgentPay
- **Live application:** https://agent-pay-lilac.vercel.app
- **Network:** Stellar Testnet

## Eligibility And Duplicate Check

AgentPay is listed as an approved repository in the Drips Stellar Wave catalog.
A Hub search for `AgentPay` returned no projects when this research was prepared,
so it was not among the public Hub listings.

## What AgentPay Does

AgentPay is a testnet payment system for autonomous software agents. Its core
problem is that an agent needs enough authority to pay for a service, but should
not receive unrestricted access to a person's wallet or secret key. AgentPay
models that authority as a capped, expiring, and revocable on-chain delegation.
A human grants the initial permission through a wallet signature, then the agent
can make purchases within the stated limit. The design gives the owner a way to
end the authority rather than relying on an off-chain promise that an agent will
behave.

The repository separates this into three Soroban contracts. The Agent Registry
stores the agent identity and reputation data. The Delegation Manager records
the spending allowance and enforces its limits. The Marketplace records
services and drives a purchase flow that checks the delegation before a payment
is completed. This is more than a frontend that labels a normal wallet transfer
as agentic: the limit check and related state transitions are intended to run
in Soroban, while the application uses Freighter for the human authorization
step and Stellar USDC for the demo settlement asset.

The project also exposes a web demonstration, frontend tests, Rust contract
tests, deployment scripts, and an activity feed that links transactions to
Stellar Expert. Its material correctly describes the deployment as testnet,
which matters for evaluating it: AgentPay demonstrates a concrete approach to
controlled autonomous payments, but it should not be represented as a mainnet
financial product. The project is well suited to the Payments category because
its central function is permission-scoped USDC payment execution rather than
general AI tooling.

## On-Chain Verification

The project's README and deployment configuration identify these Testnet
Soroban contracts:

- **Agent Registry:** `CBNPT7XGHQD75U7B2O6OSVYS4DNTUR3NJSWCEKPNOH5HDMER3DW4KBYI`
- **Delegation Manager:** `CDFYTLZQ54OWK3CZT4SWCRCZXPZ7VHUY5V2DISRCQYZBXV5MZQCU2WST`
- **Marketplace:** `CBKJXR23EMLGCONODKG4W3GHVLMZ2UN3V5WTJ2SHA6LYY5F7T2LQTJEF`
- **Demo USDC SAC:** `CALFVMEZVOTFQEVDMHI23ZHT5JNR3SF4BR5RMRBN6M4JT2SXEVIBMMKL`

The Agent Registry is the primary identifier for the Hub profile. It is linked
from the project's Testnet deployment table and resolves in the
[Stellar Expert Testnet explorer](https://stellar.expert/explorer/testnet/contract/CBNPT7XGHQD75U7B2O6OSVYS4DNTUR3NJSWCEKPNOH5HDMER3DW4KBYI).

The repository also links transaction
[`b5395435a81e047e9f3f5be91e52cc8af596f3604bb52ad9b5032cd88e3d4721`](https://horizon-testnet.stellar.org/transactions/b5395435a81e047e9f3f5be91e52cc8af596f3604bb52ad9b5032cd88e3d4721).
Horizon reports it as successful, with one `invoke_host_function` operation in
ledger `3829993` at `2026-07-27T16:09:15Z`.

## Suggested Hub Submission

- **Name:** AgentPay
- **Category:** Payments
- **Network:** Testnet
- **Tags:** `agent-payments, soroban, usdc, delegation, autonomous-agents, freighter, stellar-wave`
- **Website:** https://agent-pay-lilac.vercel.app
- **GitHub repository:** https://github.com/ysfadm/AgentPay
- **Soroban Contract ID:** `CBNPT7XGHQD75U7B2O6OSVYS4DNTUR3NJSWCEKPNOH5HDMER3DW4KBYI`
- **Research images:** the public mobile UI and CI/CD screenshots published in
  the project repository.

## Submission Confirmed

- **Hub project ID:** `122`
- **Hub slug:** `agentpay`
- **Submission status:** `submitted` (awaiting administrator review)
- **Network correction:** changed from the form's default `mainnet` to
  `testnet` so it matches the verified AgentPay contracts.
- **Submission evidence:** the Hub record contains the Agent Registry Testnet
  contract and two research images.

## Sources

1. [Drips Stellar Wave repository catalog](https://www.drips.network/wave/stellar/repos)
2. [AgentPay repository and README](https://github.com/ysfadm/AgentPay)
3. [Agent Registry contract explorer](https://stellar.expert/explorer/testnet/contract/CBNPT7XGHQD75U7B2O6OSVYS4DNTUR3NJSWCEKPNOH5HDMER3DW4KBYI)
4. [Verified Testnet transaction on Horizon](https://horizon-testnet.stellar.org/transactions/b5395435a81e047e9f3f5be91e52cc8af596f3604bb52ad9b5032cd88e3d4721)
