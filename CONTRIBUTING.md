# Contributing to Stellar Wave Hub

Thank you for your interest in contributing to Stellar Wave Hub! This project is community-driven — every contribution helps build a better directory for the Stellar Wave ecosystem.

## How to Contribute

### 1. Research & Upload Stellar Wave Projects

The primary way to contribute is by researching projects from the Stellar Wave Program and uploading them to the Hub. Check the [open issues](https://github.com/samieazubike/stellar-wave-hub/issues) for available tasks.

**Steps:**

1. Pick an open issue that interests you
2. Comment on the issue to claim it
3. Research a Stellar Wave project (you choose which one)
4. Submit it through the platform or API
5. Open a PR to add yourself to [CONTRIBUTORS.md](CONTRIBUTORS.md)

**Project submission requirements:**

- The project **must** be part of the Stellar Wave Program
- All data must be verifiable from public sources
- Description must be original (min 200 words) — no copy-paste
- Stellar account ID / Soroban contract ID must be valid on-chain
- Category and tags must accurately reflect the project

### 2. Rate & Review Projects

Once projects are approved, you can contribute by rating and reviewing them across 4 dimensions: Overall, Purpose, Innovation, and Usability. Reviews should be substantive and demonstrate independent research.

### 3. Code Contributions

Want to improve the platform itself? We welcome code contributions too.

**Setup:**

```bash
# Clone the repo
git clone https://github.com/samieazubike/stellar-wave-hub.git
cd stellar-wave-hub

# Install web app dependencies
cd web
npm install

# Copy environment variables
cp .env.example .env.local
# Fill in your Firebase and JWT credentials

# Start dev server
npm run dev
```

**For smart contract work:**

```bash
cd contracts/wave_hub_registry
cargo build --target wasm32-unknown-unknown --release
cargo test
```

### 4. Report Bugs & Suggest Features

Open an issue with a clear description of the bug or feature request.

### 5. Maintaining the Project

If you hold maintainer (`admin`) access, see [docs/MAINTAINERS.md](docs/MAINTAINERS.md) for responsibilities, the permission matrix, and the review checklist to use before approving submissions.

## Contribution Workflow

1. **Fork** the repository
2. **Create a branch**: `git checkout -b feat/your-feature` or `git checkout -b fix/your-fix`
3. **Make your changes**
4. **Run checks:**
   - Web app: `cd web && npm run lint`
   - Contract: `cd contracts/wave_hub_registry && cargo test`
5. **Add yourself** to [CONTRIBUTORS.md](CONTRIBUTORS.md) if this is your first contribution
6. **Commit** with a clear message: `feat: add project XYZ` or `fix: resolve login issue`
7. **Push** and open a **Pull Request**

## Commit Message Format

Use conventional commits:

- `feat:` — new feature or project submission
- `fix:` — bug fix
- `docs:` — documentation changes
- `research:` — project research and submission
- `review:` — project rating and review

## Code of Conduct

- Be respectful and constructive
- Submit only verifiable, accurate project data
- Do not plagiarize descriptions — write original content
- Give honest, fair ratings and reviews
- Help other contributors when you can

## Points System

Issues are tagged with point values reflecting their complexity:

| Label | Complexity | Example |
|-------|-----------|---------|
| `200 points` | High | Research & upload a full project profile |

Points are tracked for contributor recognition.

## Questions?

Open an issue or reach out through the repository discussions. We're happy to help you get started.
