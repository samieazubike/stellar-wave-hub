# Axelar — Stellar Wave Research Submission

## Project Identity

- **Project Name:** Axelar
- **Category:** Infrastructure / Interoperability
- **Wave Source:** Listed in Drips Wave Stellar approved projects (stellar/wave/repos on drips.network)
- **Website:** https://www.axelar.network
- **Repository:** https://github.com/axelarnetwork/axelar-amplifier-stellar (Stellar-specific implementation)
- **Documentation:** https://docs.axelar.dev
- **Drips Project Page:** https://drips.network/projects/axelarnetwork
- **Logo / Profile Image:** https://github.com/axelarnetwork.png

## Submission Fields

- **Name:** Axelar
- **Category:** infrastructure
- **Stellar network:** testnet (with mainnet integration live)
- **Stellar contract ID (testnet):** `CCSNWHMQSPTW4PS7L32OIMH7Z6NFNCKYZKNFSWRSYX7MK64KHBDZDT5I`
- **Tags:** `soroban, cross-chain, interoperability, infrastructure, messaging, token-bridge, gateway, cgp, ibc, developer-tools, stellar-wave`
- **GitHub repositories:**
  - Stellar-specific implementation: https://github.com/axelarnetwork/axelar-amplifier-stellar
  - Core contracts deployments: https://github.com/axelarnetwork/axelar-contract-deployments
  - Example implementations: https://github.com/axelarnetwork/stellar-gmp-example
  - ITS examples: https://github.com/axelarnetwork/stellar-its-example
- **Additional resources:**
  - Whitepaper: https://axelar.network/papers
  - Blog: https://axelar.network/blog

## Description

Axelar is a decentralized interoperability platform that connects blockchains through a unified set of protocols and infrastructure. At its core is the Cross-Chain Gateway Protocol (CGP), which routes messages and assets across disparate chains—whether EVM-based, Cosmos-based, or non-EVM platforms like Stellar and XRP Ledger. The network is powered by a community of validators operating in Proof-of-Stake consensus, using Axelar's native AXL token as economic security.

For Stellar specifically, Axelar deployed its full interoperability suite via Soroban smart contracts. This includes the AxelarGateway contract, which handles incoming cross-chain messages and asset transfers; the GasService contract, which manages payment for cross-chain execution; the InterchainTokenService (ITS), supporting Axelar's hub-and-spoke model for token routing; and example contracts demonstrating General Message Passing (GMP). The implementation is production-ready on both testnet and mainnet, with multiple institutional and DeFi projects already integrating it, including Solv (RWA platform), Stronghold (SHx asset bridge), and Squid (cross-chain liquidity router).

What makes Axelar particularly valuable on Stellar is the removal of liquidity fragmentation. Previously, to send an asset from Stellar to Ethereum or Avalanche required separate, isolated bridges, each with limited liquidity pools. Axelar connects Stellar to over 70 chains through a single unified network, allowing assets issued on Stellar—from USDC to custom tokens—to flow seamlessly into DeFi, yield products, and trading venues elsewhere without requiring separate integrations for each chain. This is especially relevant for Stellar's focus on institutional finance and asset issuance; projects like Solv can now issue yield-bearing RWA tokens on Stellar and immediately access cross-chain liquidity.

Technically, Axelar's architecture separates concerns clearly. The on-chain gateway and token services execute the final state transitions (asset mints, burns, message forwarding) within deterministic logic. The off-chain validator network runs consensus on proofs submitted by relayers, collectively deciding which cross-chain operations are authorized. This dual-layer design—on-chain safety, off-chain liveness—means Stellar applications can participate in cross-chain activity without depending on centralized bridges or introducing new trust assumptions beyond Axelar's validator set.

## Problem it Solves

1. **Liquidity Fragmentation:** Stellar-based assets and dApps were isolated from broader blockchain liquidity pools. Cross-chain access required either custom point-to-point bridges or manual off-chain wrapping. Axelar provides a single, unified bridge to 70+ chains.

2. **Asset Issuance Isolation:** Financial institutions and projects issuing assets on Stellar had no straightforward way to extend those assets into other ecosystems for trading, yield, or payment flows. Axelar's ITS Hub enables seamless cross-chain deployments.

3. **Cross-Chain Composability Complexity:** dApps wanting to send messages or trigger state across chains faced incompatible tooling. Axelar's GMP provides a uniform interface for calling contracts on any connected chain.

4. **Expensive Interoperability:** Building custom bridge infrastructure is costly and insecure. Axelar's shared validator network and battle-tested protocol suite reduce the risk and engineering burden.

## How it Uses Stellar

- **Soroban Smart Contracts:** The AxelarGateway, GasService, InterchainTokenService, and related contracts are all deployed as Soroban Rust contracts compiled to WebAssembly and run on Stellar's mainnet and testnet.

- **Asset Bridging via SAC:** Stellar Asset Contracts (native and wrapped assets) are supported as bridge assets. When an asset is deposited into Axelar's gateway on Stellar, it is locked; Axelar's validator network then mints wrapped representations on destination chains or vice versa.

- **RPC Integration:** The deployment and operation of Axelar contracts on Stellar uses Soroban RPC endpoints (https://soroban-testnet.stellar.org and mainnet equivalents) to submit transactions and query contract state.

- **Native Token Support:** Stellar's native XLM can be bridged across chains through Axelar, increasing liquidity and utility beyond the Stellar ecosystem.

- **Compliance and Payments:** Stellar's built-in compliance framework (issuer revocation, clawback, etc.) is preserved when assets move through Axelar to other chains, enabling regulated financial institutions to maintain control over their assets.

## Technical Approach

**On-Chain Contract Design:**
- **AxelarGateway**: Stores proofs from the Axelar validator network, validates message and token signatures, and executes state changes (mints, burns, calls to dApps).
- **GasService**: Collects fees (in a designated gas token) for cross-chain operations, then reimburses relayers on destination chains for execution costs.
- **InterchainTokenService (ITS Hub Mode)**: For Stellar, operates in Hub mode, meaning all token transfers are routed through the Axelar chain's central coordination point, then reflected back to Stellar or other destinations.
- **Message Encoding**: Cross-chain messages use ABI encoding and are wrapped with source/destination chains, sender addresses, and payload; contracts on both ends unpack and validate these structures.

**Off-Chain Components:**
- **Validator Network**: Community validators run Axelar nodes (built on Cosmos SDK), reach consensus on cross-chain operations via Byzantine Fault Tolerance, and produce multi-signature proofs.
- **Relayers**: These permissionless agents submit validator proofs to the destination gateway and trigger execution of message handlers.

**Deployment and Configuration:**
- Contracts are deployed via TypeScript deployment scripts that handle optimization, funding, and initialization.
- Configuration is environment-based; mainnet and testnet gateways have different contract IDs and RPC endpoints.
- Upgrade mechanisms allow safe contract evolution without losing state.

**Example Flows:**
1. **GMP (General Message Passing):** A user calls a contract on Stellar, triggering an outgoing message. That message is encoded, submitted to AxelarGateway, and the Axelar network relays it to (e.g.) Ethereum, where a relayer submits a proof to the Ethereum gateway, which then calls the destination contract.
2. **Token Transfer:** A user deposits USDC into Axelar's gateway on Stellar. The gateway locks the USDC, the Axelar validator network confirms, and the corresponding wrapped token is minted on Avalanche or another destination chain.

## Team / Community

Axelar is maintained by the **Axelar Foundation** and backed by an active open-source community and professional organization. Key contributors include:
- Core protocol developers contributing to axelarnetwork repositories on GitHub.
- A community of 70+ validator operators securing the network.
- Multiple integrations and example repositories maintained by Axelar engineers and community members.

The Stellar integration was announced in late 2024 / early 2025, with multiple foundational projects (Solv, Stronghold, Squid) launching integrations concurrently, indicating strong alignment and partnership.

## On-Chain Verification

**Testnet Gateway Contract:**
- **Address:** `CCSNWHMQSPTW4PS7L32OIMH7Z6NFNCKYZKNFSWRSYX7MK64KHBDZDT5I`
- **Network:** Stellar Testnet (SDF Network; September 2015)
- **Verification method:** Listed in official Axelar documentation and confirmed in the stellar-gmp-example repository.

**Gas Service (Testnet):**
- **Address:** `CAZUKAFB5XHZKFZR7B5HIKB6BBMYSZIV3V2VWFTQWKYEMONWK2ZLTZCT`

**Interchain Token Service (Testnet):**
- **Address:** `CCXT3EAQ7GPQTJWENU62SIFBQ3D4JMNQSB77KRPTGBJ7ZWBYESZQBZRK`

**Mainnet Status:**
Multiple sources (Axelar blog, news articles, Solv integration announcements) confirm that Axelar's Stellar integration is **live on mainnet** as of early 2025, with production usage by institutional projects. Specific mainnet contract IDs follow the same pattern and are deployed via the axelar-contract-deployments repository.

## Research Sources

1. Axelar official website and documentation: https://www.axelar.network and https://docs.axelar.dev
2. GitHub repositories:
   - https://github.com/axelarnetwork/axelar-amplifier-stellar (Stellar-specific smart contracts)
   - https://github.com/axelarnetwork/stellar-gmp-example (GMP example for Stellar)
   - https://github.com/axelarnetwork/stellar-its-example (ITS example for Stellar)
   - https://github.com/axelarnetwork/axelar-contract-deployments (deployment scripts and configuration)
3. Axelar blog posts:
   - "Axelar Network Integrates Stellar" (2025): https://axelar.network/blog/axelar-stellar-integration
   - "Retail Payments on Blockchain" (co-authored with Stellar): https://axelar.network/blog/retail-payments-stablecoin-standard
4. Stellar press release: "Smart Contracts Launch on Stellar with $100M Allocated to Soroban Adoption Fund"
5. Axelar whitepaper and technical documentation
6. Drips Wave project listing: https://drips.network (Axelar listed in Stellar Wave approved projects)
7. Integration announcements from partner projects (Solv, Stronghold, Squid)

## Supporting Resources & Screenshots

The following supporting materials are recommended for the Hub submission:

### Official Documentation & Diagrams
1. **Axelar-Stellar Integration Announcement**: https://axelar.network/blog/axelar-stellar-integration
   - Official blog post with integration overview and use case examples (Solv, Stronghold, Squid)

2. **Cross-Chain Gateway Protocol Architecture**:
   - Referenced in Axelar whitepaper and technical docs
   - Shows validator network consensus, on-chain gateway, and relayer flow

3. **ITS Hub Model Diagram**:
   - Available in Axelar ITS Hub Release Notes
   - Illustrates token routing through central hub for Stellar and other chains

4. **On-Chain Contract Verification**:
   - **Stellar Expert (Testnet)**: https://stellar.expert/explorer/testnet/contract/CCSNWHMQSPTW4PS7L32OIMH7Z6NFNCKYZKNFSWRSYX7MK64KHBDZDT5I
   - Shows deployed AxelarGateway contract code, storage, and invocations

5. **GitHub Repository Visualizations**:
   - Network dependency graph: https://github.com/axelarnetwork/axelar-amplifier-stellar/network
   - Repository traffic and contributor activity

### Deployment Timeline
- **Testnet Deployment**: Q4 2024
- **Mainnet Launch**: Early 2025
- **Partner Launches**: Solv, Stronghold, Squid announced concurrent integration

---

## Summary

Axelar is production-grade cross-chain infrastructure that, through its Soroban deployment on Stellar, solves the long-standing problem of asset and message isolation on Stellar. By connecting Stellar to 70+ chains through a unified validator network and smart contract system, Axelar enables institutional projects, DeFi applications, and asset issuers to operate across ecosystems without liquidity fragmentation. Its involvement in the Stellar Wave Program and active integration by projects like Solv and Stronghold demonstrate both its readiness and relevance to the Stellar ecosystem.
