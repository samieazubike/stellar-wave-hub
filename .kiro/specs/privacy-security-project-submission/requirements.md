# Requirements Document

## Introduction

This feature involves researching a privacy/security-focused project from the Stellar Wave Program, documenting its privacy mechanisms and security architecture, and submitting its profile to the Stellar Wave Hub. The submission must include a comprehensive original description (minimum 200 words), verified on-chain Stellar account/contract IDs, accurate category and tags, and the contributor must be added to CONTRIBUTORS.md.

## Glossary

- **Stellar Wave Program**: Stellar Development Foundation's grant and ecosystem program for projects building on Stellar/Soroban
- **Stellar Wave Hub**: The community-driven project directory at https://usestellarwavehub.vercel.app for discovering Wave Program projects
- **Soroban**: Stellar's smart contract platform
- **Stellar Account ID**: A public key (G...) identifying an account on the Stellar network
- **Soroban Contract ID**: A contract address (C...) identifying a deployed smart contract on Stellar
- **ZK Proofs**: Zero-knowledge proofs — cryptographic methods to prove knowledge without revealing the underlying data
- **SEP**: Stellar Ecosystem Proposal — standardized protocol specifications for Stellar interoperability
- **Horizon API**: Stellar's REST API for querying blockchain data
- **Privacy Mechanism**: Technical approach used to protect user data (e.g., encryption, ZK proofs, confidential transactions)
- **Threat Model**: Documentation of what adversaries and attack vectors a system is designed to defend against
- **CONTRIBUTORS.md**: The file tracking all contributors to the Stellar Wave Hub repository

## Requirements

### Requirement 1

**User Story:** As a researcher, I want to identify a privacy/security-focused Stellar Wave Program project not yet submitted to the Hub, so that I can contribute a unique and valuable profile.

#### Acceptance Criteria

1. WHEN selecting a project, THE researcher SHALL choose a project that is a verified participant in the Stellar Wave Program and focuses on privacy, security, or data protection
2. WHEN selecting a project, THE researcher SHALL verify the project has not already been submitted to Stellar Wave Hub
3. WHEN a project is selected, THE researcher SHALL document the project name, website URL, GitHub repository URL, and Stellar account ID or Soroban contract ID from public on-chain sources

### Requirement 2

**User Story:** As a researcher, I want to document the privacy and security mechanisms of the selected project, so that Hub users understand how the project protects user data on Stellar.

#### Acceptance Criteria

1. WHEN documenting the project, THE researcher SHALL describe the privacy approach used (e.g., ZK proofs, encryption, confidential transactions, access control)
2. WHEN documenting the project, THE researcher SHALL describe the threat model — what adversaries and attack vectors the project defends against
3. WHEN documenting the project, THE researcher SHALL specify what user data or on-chain state is protected and how
4. WHEN documenting the project, THE researcher SHALL verify any on-chain components (Stellar account or Soroban contract) exist on the Stellar network via Horizon API or Stellar Expert

### Requirement 3

**User Story:** As a contributor, I want to submit the researched project profile to Stellar Wave Hub via the API, so that the project becomes discoverable in the directory.

#### Acceptance Criteria

1. WHEN submitting the project, THE system SHALL accept a POST request to `/api/projects` with all required fields: name, description, category, stellar_account_id, and tags
2. WHEN submitting the project, THE description SHALL contain a minimum of 200 words covering the privacy model and security guarantees
3. WHEN submitting the project, THE tags SHALL include "privacy" and "security" along with other relevant tags
4. IF the submission request is missing required fields, THEN THE system SHALL return a 400 error with a descriptive message
5. WHEN the submission succeeds, THE system SHALL return a 201 response with the created project record including its assigned ID and status "submitted"

### Requirement 4

**User Story:** As a contributor, I want to add myself to CONTRIBUTORS.md, so that my research contribution is recognized in the project.

#### Acceptance Criteria

1. WHEN adding a contributor entry, THE contributor SHALL use the HTML template defined in CONTRIBUTORS.md inside the `<!-- CONTRIBUTORS-START -->` section
2. WHEN adding a contributor entry, THE entry SHALL include the contributor's GitHub username, display name, and a description of the contribution
3. WHEN the contribution is complete, THE contributor SHALL create a dedicated Git branch and make at least 4 commits documenting the research and submission process

### Requirement 5

**User Story:** As a developer, I want a research document stored in the repository, so that the project's privacy mechanisms and on-chain verification are permanently documented.

#### Acceptance Criteria

1. WHEN the research is complete, THE researcher SHALL create a markdown file under `research/` documenting the selected project, its privacy mechanisms, threat model, and on-chain verification details
2. WHEN documenting on-chain verification, THE researcher SHALL include the Stellar account ID or contract ID and the verification endpoint used
3. WHEN the research document is created, THE document SHALL reference the submission result including the assigned project ID and status from the Hub API response
