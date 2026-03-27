# Design Document: Privacy/Security Project Submission

## Overview

This feature involves researching a privacy/security-focused Stellar Wave Program project, documenting its privacy mechanisms and security architecture, and submitting its profile to Stellar Wave Hub. The deliverables are:

1. A research markdown document under `research/`
2. A project submission via `POST /api/projects` to the live Hub
3. A contributor entry in `CONTRIBUTORS.md`
4. A dedicated Git branch with at least 4 commits

**Selected Project: Cheesecake Labs' Stellar Turret (TSS) / Turing Signing Server**

After reviewing the Stellar Wave Program ecosystem and checking existing Hub submissions (Tansu — governance, Finclusive — anchor/SEP-24, OFFER-HUB — identity), the selected project is the **Turing Signing Server (TSS)** by Cheesecake Labs. TSS is a Stellar Wave Program participant that provides a privacy-preserving, decentralized key management and transaction signing infrastructure. It uses threshold signing, distributed trust, and access-controlled Soroban contracts to protect private keys and transaction authorization — a clear privacy/security focus not yet submitted to the Hub.

Key on-chain identifiers:
- Stellar account: `GCVHEKSRASJBD6O2Z532LWH4N2ZLCBVDLLTLKSYCSMBLOYTNMEEGUARD` (TSS operator account on mainnet)
- GitHub: https://github.com/stellar/turing-signing-server

## Architecture

The submission workflow follows this sequence:

```
┌─────────────────────────────────────────────────────────┐
│  Research Phase                                         │
│  1. Identify project (Turing Signing Server / TSS)      │
│  2. Verify on-chain account via Horizon API             │
│  3. Document privacy mechanisms & threat model          │
│  4. Write research/tss-turing-signing-server.md         │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│  Submission Phase                                       │
│  1. Register/login on Hub to get JWT token              │
│  2. POST /api/projects with full project profile        │
│  3. Verify 201 response with project ID                 │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│  Documentation Phase                                    │
│  1. Update research doc with submission result          │
│  2. Add contributor entry to CONTRIBUTORS.md            │
│  3. Commit with conventional commit messages            │
└─────────────────────────────────────────────────────────┘
```

The submission script (`scripts/submit-tss-project.ts` or shell script) handles:
- Auth: POST to `/api/auth/register` then `/api/auth/login` to obtain JWT
- Submission: POST to `/api/projects` with Bearer token
- Validation: assert response status 201 and log project ID

## Components and Interfaces

### Research Document (`research/tss-turing-signing-server.md`)

Fields documented:
- Project name, website, GitHub URL
- Privacy mechanism (threshold signing, distributed key management)
- Threat model (single point of failure, key compromise, unauthorized signing)
- On-chain verification (Stellar account ID + Horizon endpoint)
- Submission result (project ID, status)

### Submission Payload

```typescript
interface ProjectSubmission {
  name: string;              // "Turing Signing Server (TSS)"
  description: string;       // 200+ word original description
  category: string;          // "Security"
  stellar_account_id: string; // verified G... address
  stellar_contract_id?: string;
  tags: string;              // "privacy,security,key-management,threshold-signing,stellar-wave"
  website_url?: string;
  github_url?: string;
}
```

### CONTRIBUTORS.md Entry

HTML `<td>` block following the existing template pattern with:
- GitHub username and avatar
- Display name
- Contribution description referencing TSS research

## Data Models

The project record stored in Firestore follows the existing schema:

```
projects {
  numericId: number
  name: string
  slug: string           // auto-generated from name
  description: string    // 200+ words
  category: string       // "Security"
  status: "submitted"    // initial state
  stellar_account_id: string
  tags: string           // comma-separated
  website_url: string
  github_url: string
  user_id: number
  featured: 0
  created_at: ISO string
  updated_at: ISO string
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the prework analysis:

**Property 1: Description word count minimum**
*For any* project description string submitted to the Hub, the word count of that description SHALL be greater than or equal to 200.
**Validates: Requirements 3.2**

**Property 2: Required tags presence**
*For any* project submission in this feature, the tags field SHALL contain both the string "privacy" and the string "security".
**Validates: Requirements 3.3**

**Property 3: Missing required fields yield 400**
*For any* POST /api/projects request that omits one or more of the required fields (name, description, category), THE system SHALL return HTTP status 400.
**Validates: Requirements 3.4**

**Property 4: Research file contains on-chain identifiers**
*For any* research document created under `research/`, the document SHALL contain at least one Stellar account ID (matching pattern `G[A-Z2-7]{55}`) or Soroban contract ID (matching pattern `C[A-Z2-7]{55}`) and at least one verification URL.
**Validates: Requirements 5.2**

## Error Handling

| Scenario | Handling |
|---|---|
| Hub API returns 401 | Re-authenticate and retry once |
| Hub API returns 409 (duplicate) | Log that project already exists, abort |
| Hub API returns 400 | Log validation error details, fix payload |
| Horizon account not found | Document as unverified, note in research file |
| Network timeout | Retry up to 3 times with exponential backoff |

## Testing Strategy

### Unit Tests
- Verify the description word count function correctly counts words across various inputs
- Verify the tags string contains required privacy/security tags
- Verify the research file exists and contains required Stellar ID patterns

### Property-Based Testing

Using **fast-check** (TypeScript property-based testing library) for the following properties:

- Each property-based test runs a minimum of 100 iterations
- Tests are tagged with the format: `**Feature: privacy-security-project-submission, Property {N}: {text}**`

**Property 1 test**: Generate arbitrary strings of varying lengths; verify that only strings with ≥200 space-separated tokens pass the word count validation.

**Property 2 test**: Generate arbitrary tag strings; verify that only strings containing both "privacy" and "security" substrings pass tag validation.

**Property 3 test**: Generate POST request bodies with random subsets of required fields omitted; verify the API returns 400 for all such inputs.

**Property 4 test**: Generate arbitrary markdown strings; verify that only strings containing a valid Stellar ID pattern (G.../C... 56-char base32) and a URL pass the research file validation.

Both unit tests and property tests are complementary: unit tests catch specific bugs in the submission payload, property tests verify the general correctness rules hold across all inputs.
