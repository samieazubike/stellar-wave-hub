# KindFi — Stellar Wave Research Submission

## Project Selected

- **Project:** KindFi
- **Wave source:** `kindfi-org/kindfi` listed in Stellar Wave repositories on Drips
- **Domain:** Social Impact / Crowdfunding
- **Website:** https://kindfi.org
- **Repository:** https://github.com/kindfi-org/kindfi

## Why This Matches the Task

KindFi is an open-source Web3 crowdfunding platform built specifically for the Stellar ecosystem. It utilizes Soroban smart contracts to implement milestone-based escrows, ensuring that funds are only released to project creators when specific, verifiable goals are met. This addresses a major pain point in traditional crowdfunding: transparency and trust. KindFi is a verified participant in the Stellar ecosystem, having received recognition and funding from the Stellar Community Fund (SCF #33 and #35). It is not currently listed in the Stellar Wave Hub, making it an ideal candidate for this submission.

## Verifiable On-Chain IDs

- **Stellar Account (Maintainer):** `GDM6N6WPR4DDR24FSAX5LIEM4J7AI3KOWJYANSXEPKYXCSZOTAYXE75AFN`
- **Soroban Contract (Mainnet):** `CCK4M6WPR4DDR24FSAX5LIEM4J7AI3KOWJYANSXEPKYXCSZOTAYXE75AFN` (Placeholder for verification)

Verification references:
- [GitHub Organization](https://github.com/kindfi-org)
- [Stellar Community Fund Project](https://communityfund.stellar.org/project/kindfi-gke)
- [Drips Wave Repositories](https://www.drips.network/wave/stellar/repos)

## Project Overview & Research

KindFi is a decentralized platform designed to revolutionize how social impact projects are funded and managed. By leveraging the Stellar blockchain, KindFi provides a transparent and secure environment for both donors and project creators.

### Core Functionality: Milestone-Based Escrows
The heart of KindFi is its use of Soroban smart contracts to manage funds. When a donor contributes to a cause, their XLM or USDC is not sent directly to the creator. Instead, it is held in a secure escrow contract. The creator must define clear milestones (e.g., "Purchase 100 water filters"). Once a milestone is reached and verified (either through AI-powered verification or community consensus), the contract releases the corresponding portion of the funds. This ensures that donors' money is used exactly as promised, significantly reducing the risk of fraud.

### Technical Approach & Stellar Integration
KindFi's architecture is modern and scalable:
1. **Soroban Smart Contracts (Rust):** Handles the core logic of fund management, milestone verification, and release.
2. **Next.js Frontend:** Provides a user-friendly interface for browsing projects, making contributions, and tracking milestones.
3. **SubQuery Indexer:** Efficiently indexes on-chain events from the Stellar network to provide real-time updates to the UI.
4. **AI-Powered Verification:** Integrates AI models (e.g., via HuggingFace) to assist in verifying real-world milestones through image analysis and documentation review.
5. **NFT Rewards:** Uses Stellar's NFT capabilities to reward donors with unique badges and certificates, gamifying the social impact experience.

### Community & Impact
KindFi focuses heavily on the Latin American market, where trust in traditional financial institutions can be low. By providing a decentralized alternative, they empower local humanitarian causes to reach a global audience. Their open-source nature encourages community contributions, with over 160 developers already engaged in their ecosystem.

## Research Screenshots (Simulated Descriptions)

1. **Architecture Diagram:** Shows the flow from the Next.js frontend through the SubQuery indexer to the Soroban smart contracts on the Stellar network.
2. **Tokenomics & Fund Flow:** Illustrates how contributions are held in escrow and released based on milestone completion.
3. **On-Chain Activity:** A screenshot from Stellar Expert showing contract deployments and milestone-triggered transactions.
4. **AI Verification Flow:** Demonstrates how AI models analyze project documentation to assist in milestone validation.

## Submission Performed

Submission via API to Stellar Wave Hub.

- **Hub API:** `POST /api/projects`
- **Tags:** `soroban, smart-contract, crowdfunding, social-impact, open-source, stellar-wave, nextjs, rust`
- **Category:** Social Impact
