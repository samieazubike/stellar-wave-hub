# Research: Stellar-Save

## Project Name
Stellar-Save

## Description
Stellar-Save is a decentralized rotational savings and credit association (ROSCA) built entirely on Stellar Soroban smart contracts. It brings the traditional, community-based savings systems—popularly known in many African countries and globally—onto the blockchain. These time-tested financial mechanisms involve members forming a group, contributing a fixed amount regularly (e.g., weekly or monthly), and rotating who receives the full pool of contributions at the end of each cycle. 

By migrating this system to the blockchain, Stellar-Save makes rotational savings transparent, trustless, and programmable. Traditionally, these systems rely heavily on absolute trust within a small community or a central coordinator, which limits their scale and can lead to mismanagement. Stellar-Save automates the entire process through smart contracts, ensuring that once members contribute their share in native XLM (or future supported tokens), the payouts execute automatically when the cycle is complete. It removes the need for manual coordination and guarantees that funds are disbursed fairly and transparently. Members can easily join with any Stellar wallet (such as Freighter, Lobstr, or Albedo) and track the status of their group's contributions and payouts verifiable directly on-chain. The system is designed to be highly accessible for anyone looking to build financial discipline within their communities without relying on traditional banking infrastructure.

## The Problem the Project Solves
Traditional rotational savings groups (ROSCAs) are limited by geography, require a highly trusted central coordinator to collect and distribute funds, and lack transparency. This often results in disputes or loss of funds. Stellar-Save solves this by decentralizing the process, using smart contracts to hold contributions in escrow and automate payouts trustlessly, enabling global participation without geographical or administrative barriers.

## How the Project Uses Stellar
Stellar-Save leverages the Stellar network's speed and low fees. Specifically, it uses Soroban smart contracts to manage group creation, track individual contributions, securely hold funds in escrow during the cycle, and automate the distribution of the final payout pool to the rotating recipient. It integrates the Stellar Horizon API for fetching transaction history and utilizes Soroban events for real-time state updates across the frontend. It currently supports native XLM.

## Technical Approach
The project employs a robust four-layer architecture:
1. **User Layer:** Interaction via Stellar wallets (Freighter, Lobstr, Albedo).
2. **Frontend Layer:** A Single Page Application (SPA) built with React, TypeScript, and Vite, using Material-UI for components and React Query for state management.
3. **Blockchain Layer:** Soroban smart contracts written in Rust to handle the core ROSCA logic (groups, contributions, payouts).
4. **Data Layer:** Uses on-chain storage, Soroban events, and the Horizon API for historical data and real-time syncing.
It also includes an Expo React Native setup for mobile accessibility.

## Team and Community Information
The project is actively maintained on GitHub by the user **Xoulomon** (and potentially other community contributors) as part of the Stellar open-source ecosystem, particularly associated with the Stellar Wave Program.

## Verified Stellar Account ID / Soroban Contract ID
Since the contracts are dynamically deployed to Futurenet/Testnet during development cycles, specific global contract IDs rotate. However, the maintainer's associated Stellar ecosystem presence and project commits can be verified through the GitHub repository [Xoulomon/Stellar-Save](https://github.com/Xoulomon/Stellar-Save). (Note: Actual deployed testnet contract IDs are generated per deployment via `soroban contract deploy`).

## Category and Relevant Tags
**Category:** DeFi / Social Impact
**Tags:** #Soroban, #SmartContracts, #ROSCA, #DeFi, #Savings, #Web3

## Supporting Screenshots
- **Architecture Diagram:** Available at `docs/architecture-diagram.svg` within the repository.
- **Project Structure:** Features frontend, mobile, and contract codebases integrated into a monorepo.

## Sources
- GitHub Repository: [Xoulomon/Stellar-Save](https://github.com/Xoulomon/Stellar-Save)
- README and Architecture Docs: [Stellar-Save README](https://github.com/Xoulomon/Stellar-Save/blob/main/README.md)
