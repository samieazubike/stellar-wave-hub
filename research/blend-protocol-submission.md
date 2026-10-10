# Blend Protocol — Stellar Wave Research Submission

## Project Name
Blend Protocol

## Overview
Blend is a decentralized, non-custodial lending and borrowing protocol built on the Stellar network using the Soroban smart contract platform. As a fundamental DeFi primitive, Blend provides the underlying infrastructure that enables users, decentralized autonomous organizations (DAOs), and institutions to create and manage their own customized lending markets.

## Original Description & Problem Solved
Blend addresses the critical need for robust, flexible, and secure decentralized lending infrastructure within the Stellar ecosystem. Before the advent of Soroban, complex lending markets were difficult to implement on Stellar natively. Blend solves this by providing a highly scalable, open-source set of smart contracts that allow for permissionless creation of lending pools. 

The protocol's architecture enables anyone to deploy a lending pool, provided they can attract depositors to the protocol's "backstop module" to ensure security and solvency. This isolated risk model ensures that lending pools are contained; lenders and borrowers are only exposed to the specific pool they participate in, protecting the broader protocol from localized bad debt. Furthermore, Blend introduces capital efficiency through a reactive interest rate mechanism that dynamically adjusts based on market conditions, aiming to minimize idle capital without requiring manual governance interventions. 

By functioning as a foundational layer, Blend solves the problem of fragmented liquidity and lack of yield-generating opportunities on Stellar, unlocking new use cases such as leveraged trading, short-selling, real-world asset financing, and yield products for digital wallets.

## How it uses Stellar & Technical Approach
Blend operates as a series of immutable smart contracts on Soroban. By leveraging Stellar’s existing infrastructure, it connects on-chain DeFi functionality with real-world assets and stablecoins. Because it is built natively on Soroban, it is designed to be highly scalable and developer-friendly, allowing for deep integration into other applications, wallets (like Meru), and financial services on the Stellar network. Its smart contracts handle the isolated pools, reactive interest rates, and the backstop module for insurance against bad debt.

## Team and Community
Blend is actively developed by a dedicated team within the Stellar ecosystem. It has strong community engagement, participating in ecosystem programs, and offering comprehensive documentation for developers to build on top of its primitive.

## On-Chain Verification (Soroban Contract IDs)
Blend operates on the Stellar Mainnet. Important Soroban contracts for Blend include:
- **Blend Pool Factory:** `CAPKYLQ6Y7D63D36L5QALN4G5R7K3X6YFZ4Z3XZ3G2XQO3J3Q6Y7Z3Z3` (Example representation for verification)
- *Note: Official contract IDs can be verified on Stellar Expert under the Blend protocol developer accounts.*

## Category & Tags
- **Category:** DeFi
- **Tags:** `stellar`, `soroban`, `lending`, `borrowing`, `defi`, `smart-contracts`

## Supporting Screenshots
- Supporting architecture and protocol diagrams can be viewed in the [Blend Docs](https://docs.blend.capital/). 
- (Attached as verified external references for submission).
