# CoopStable — Copy-Paste Submission Data

Use at https://usestellarwavehub.vercel.app/submit after logging in.

## Form fields

| Field | Value |
|-------|-------|
| **Name** | CoopStable |
| **Category** | DeFi |
| **Stellar Account ID** | `GB4E4EA26SXUJSFJTMFCVGVNEKWGNQ44MLFRHHXWQHQ54RD7KQTYBNSR` |
| **Soroban Contract ID** | `CA7JSNCTAGTVXJJX65YIN53XAXK72NZPD5Q62YUQXV7R7V45ELKONCJ5` |
| **Network** | Mainnet |
| **Website** | https://www.coopstable.app/ |
| **Logo URL** | https://www.coopstable.app/logo.png |
| **Tags** | `stablecoin, asset-issuance, soroban, defi, collateral, compliance, yield, cooperative, tokenization, stellar-wave` |

## GitHub repos

1. **Soroban Contracts (Core)** — https://github.com/BreadchainCoop/Coop-Stable-Contracts  
2. **Frontend Client** — https://github.com/BreadchainCoop/coopstable-client  

## Description (paste into form)

CoopStable is a decentralized cooperative stablecoin protocol on Stellar that issues cUSD, a collateral-backed digital dollar pegged 1:1 to USDC. Built by the Breadchain Cooperative and funded through the Stellar Community Fund (CoopStable v2), the project combines Soroban smart contracts with Stellar's Stellar Asset Contract (SAC) to deliver transparent mint-and-burn mechanics, yield generation, and cooperative revenue sharing.

The issuance model is straightforward and verifiable on mainnet: users deposit USDC into the Lending Yield Controller, the cUSD Manager mints an equivalent amount of cUSD, and collateral is routed through the Yield Adapter Registry into Blend Capital lending pools. When users redeem, cUSD is burned and principal USDC is returned. This "lossless donation" design means depositors keep their principal while the protocol socializes only the yield—10 percent to the treasury and 90 percent distributed equally among cooperative members on configurable epochs (default 24 hours).

CoopStable's regulatory posture is protocol-native rather than bank-licensed: collateralization is enforced by smart contracts, roles are gated through Soroban access control, and public metadata is published in a stellar.toml at coopstable.app. The issuer account GB4E4EA26SXUJSFJTMFCVGVNEKWGNQ44MLFRHHXWQHQ54RD7KQTYBNSR lists home_domain coopstable.app and issues CUSD with documented organization details for CoopStable and the Bread Cooperative. On-chain supply, trustlines, and contract invocations can be audited via Stellar Expert and Horizon without trusting off-chain reports.

Technically, the system is modular: separate contracts manage token lifecycle (cUSD Manager), user flows (Lending Yield Controller), yield splits (Yield Distributor), and protocol adapters (Blend Capital Adapter). Mainnet addresses are committed in the public BreadchainCoop/Coop-Stable-Contracts repository. The cUSD SAC contract CA7JSNCTAGTVXJJX65YIN53XAXK72NZPD5Q62YUQXV7R7V45ELKONCJ5 was created by the issuer account and links to asset CUSD-GB4E4EA26SXUJSFJTMFCVGVNEKWGNQ44MLFRHHXWQHQ54RD7KQTYBNSR-1.

For the Stellar ecosystem, CoopStable demonstrates how Soroban can power community-governed stablecoin issuance with real collateral, DeFi yield, and open-source auditability—an alternative to centralized fiat stablecoins that still anchors value to USDC while funding cooperative public goods through transparent on-chain economics.

## Research images (upload before submit)

1. https://stellar.expert/explorer/public/asset/CUSD-GB4E4EA26SXUJSFJTMFCVGVNEKWGNQ44MLFRHHXWQHQ54RD7KQTYBNSR-1  
2. https://coopstable.app/.well-known/stellar.toml  
3. https://communityfund.stellar.org/project/coopstable-v2-yield-sharing-stablecoin-nrc  
4. https://github.com/BreadchainCoop/Coop-Stable-Contracts/blob/main/mainnet.contracts.json  
5. Horizon account: https://horizon.stellar.org/accounts/GB4E4EA26SXUJSFJTMFCVGVNEKWGNQ44MLFRHHXWQHQ54RD7KQTYBNSR  
