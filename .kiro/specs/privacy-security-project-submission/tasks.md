# Implementation Plan

- [x] 1. Create Git branch and write research document
  - Checkout a new branch `feat/privacy-security-tss-submission` from main
  - Create `research/tss-turing-signing-server.md` documenting the Turing Signing Server project
  - Include: project overview, privacy mechanisms (threshold signing, distributed key management), threat model, on-chain verification via Horizon API, and Stellar account ID
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 5.1, 5.2_

- [ ]* 1.1 Write property test for research file validation
  - **Property 4: Research file contains on-chain identifiers**
  - Validate that the research file contains a Stellar account/contract ID pattern and a verification URL
  - **Validates: Requirements 5.2**

- [x] 2. Write submission validation utilities and tests
  - Create `scripts/validate-submission.ts` with helper functions: `countWords(description)` and `hasRequiredTags(tags)`
  - These utilities will be used by the submission script and tests
  - _Requirements: 3.2, 3.3_

- [ ]* 2.1 Write property test for description word count
  - **Property 1: Description word count minimum**
  - Use fast-check to generate arbitrary strings and verify only those with ≥200 words pass `countWords`
  - **Validates: Requirements 3.2**

- [ ]* 2.2 Write property test for required tags presence
  - **Property 2: Required tags presence**
  - Use fast-check to generate arbitrary tag strings and verify only those containing "privacy" and "security" pass `hasRequiredTags`
  - **Validates: Requirements 3.3**

- [-] 3. Write and execute the project submission script
  - Create `scripts/submit-tss-project.ts` that: registers/logs in to the Hub, POSTs the TSS project profile with 200+ word description, privacy/security tags, and verified Stellar account ID
  - Run the script against `https://usestellarwavehub.vercel.app/api/projects`
  - Log and save the response (project ID and status)
  - Update `research/tss-turing-signing-server.md` with the submission result
  - _Requirements: 3.1, 3.2, 3.3, 3.5, 5.3_

- [ ]* 3.1 Write property test for missing required fields → 400
  - **Property 3: Missing required fields yield 400**
  - Use fast-check to generate POST bodies with random subsets of required fields omitted and verify the API returns 400
  - **Validates: Requirements 3.4**

- [ ] 4. Checkpoint — Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Add contributor entry to CONTRIBUTORS.md
  - Add an HTML `<td>` entry inside `<!-- CONTRIBUTORS-START -->` using the template from CONTRIBUTORS.md
  - Include GitHub username, display name, and contribution description referencing the TSS research
  - _Requirements: 4.1, 4.2_

- [ ] 6. Final commit and branch verification
  - Ensure the branch has at least 4 commits with conventional commit messages (research:, feat:, docs:, etc.)
  - Verify all files are committed: research doc, submission script, validation utilities, CONTRIBUTORS.md update
  - _Requirements: 4.3_

- [ ] 7. Final Checkpoint — Ensure all tests pass, ask the user if questions arise.
