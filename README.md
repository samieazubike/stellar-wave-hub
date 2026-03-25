# Stellar Wave Hub

A community-driven project directory for the [Stellar Wave Program](https://stellar.org). Discover every project built through the program, spotlight new entries, rate them across multiple dimensions, and track each project's live on-chain financial activity directly from its Stellar account or Soroban smart contract.

> Think of it as **Product Hunt meets a Stellar blockchain explorer**, scoped to the Wave ecosystem.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Project Structure](#project-structure-nextjs-target)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
    - [Next.js App](#nextjs-app-setup)
    - [Smart Contract](#smart-contract-setup)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Smart Contract](#smart-contract)
- [Data Models](#data-models)
- [Contributing](#contributing)

---

## Overview

Stellar Wave Hub solves three gaps in the current Wave ecosystem:

| Gap                | Solution                                                                            |
| ------------------ | ----------------------------------------------------------------------------------- |
| **Discovery**      | Public directory of all approved Wave projects with search, filters, and categories |
| **Quality signal** | Multi-dimensional rating system (Overall, Purpose, Innovation, Usability)           |
| **Transparency**   | Live on-chain financial tracker via Stellar Horizon API                             |

**User roles:**

- **Contributor** — Browse, submit, and rate projects
- **Admin** — Review and approve/reject submissions, mark projects as featured
- **Visitor** _(stretch)_ — Read-only access without registration

---

## Architecture

```
┌──────────────────────────────────────────────────┐
│                    Browser / Client              │
│            Next.js App Router + Tailwind CSS     │
└──────────────────────┬───────────────────────────┘
                       │ Server Components + REST
┌──────────────────────▼───────────────────────────┐
│                Next.js Route Handlers            │
│      Auth · Projects · Ratings · Financials      │
└───────────┬──────────────────────┬───────────────┘
            │                      │
┌───────────▼──────────┐  ┌────────▼───────────────┐
│   SQLite (better-    │  │  Stellar Horizon API    │
│   sqlite3) database  │  │  (read-only, cached)    │
└──────────────────────┘  └────────────────────────┘
                                    │
                         ┌──────────▼──────────────┐
                         │  Soroban Smart Contract  │
                         │  (wave_hub_registry)     │
                         │  Rust · soroban-sdk      │
                         └─────────────────────────┘
```

**Tech stack:**

| Layer          | Technology                                                 |
| -------------- | ---------------------------------------------------------- |
| Frontend       | Next.js (App Router), React 18, Tailwind CSS               |
| Backend        | Next.js Route Handlers (`app/api/*`)                       |
| Database       | SQLite via `better-sqlite3` (upgradeable to PostgreSQL)    |
| Auth           | JWT bearer tokens, bcrypt password hashing                 |
| Blockchain     | `@stellar/stellar-sdk`, Stellar Horizon REST API           |
| Smart Contract | Rust, `soroban-sdk`                                        |
| Security       | Next.js middleware, route-level auth checks, rate limiting |

---

## Project Structure (Next.js Target)

```
stellar-wave-hub/
├── frontend/                   # Next.js full-stack application
│   ├── public/
│   ├── app/
│   │   ├── api/                # Backend endpoints in Next.js
│   │   │   ├── auth/
│   │   │   ├── projects/
│   │   │   ├── ratings/
│   │   │   └── financials/
│   │   ├── (pages)/            # Route-level UI pages
│   │   ├── layout.jsx
│   │   ├── page.jsx
│   │   └── globals.css
│   ├── components/             # Reusable UI components
│   ├── context/                # Global auth state
│   ├── lib/
│   │   ├── db.js               # SQLite setup + schema
│   │   ├── auth.js             # JWT utilities
│   │   └── stellarService.js   # Horizon API wrapper
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── middleware.js
│
└── contracts/                  # Soroban smart contracts (Rust)
    └── wave_hub_registry/
        ├── Cargo.toml
        └──
            └── lib.rs          # WaveHubRegistry contract
```

---

## Prerequisites

| Tool        | Version | Notes                                    |
| ----------- | ------- | ---------------------------------------- |
| Node.js     | 18+     | Next.js app tooling (frontend + backend) |
| npm / yarn  | 9+      | Package manager                          |
| Rust        | 1.74+   | Smart contract compilation               |
| Stellar CLI | latest  | Contract deployment                      |
| Git         | any     | Version control                          |

Install the Stellar CLI:

```bash
cargo install --locked stellar-cli --features opt
```

---

## Getting Started

> The steps below assume the Next.js migration is in place.

### Next.js App Setup

```bash
cd web

# Install dependencies
npm install

# Create local environment file
copy .env.example .env

# Add your real Supabase + JWT values to .env

# Start development server
npm run dev

# Build and start production server
npm run build
npm start
```

The web app will be available at `http://localhost:3000`.

All backend endpoints are served from the same Next.js app under `http://localhost:3000/api/*`.

**First admin account:** Register normally, then update the role in Supabase:

```sql
update public.users
set role = 'admin'
where email = 'your@email.com';
```

### Smart Contract Setup

```bash
cd contracts/wave_hub_registry

# Build the contract
cargo build --target wasm32-unknown-unknown --release

# Or use the Stellar CLI build command
stellar contract build

# Run tests
cargo test

# Deploy to Stellar Testnet
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/wave_hub_registry.wasm \
  --source <YOUR_SECRET_KEY> \
  --network testnet
```

---

## Environment Variables

### Next.js App (`frontend/.env.local`)

| Variable              | Default                       | Description                                                          |
| --------------------- | ----------------------------- | -------------------------------------------------------------------- |
| `PORT`                | `3000`                        | Next.js server port                                                  |
| `JWT_SECRET`          | —                             | Secret for signing JWT tokens (change in production)                 |
| `STELLAR_HORIZON_URL` | `https://horizon.stellar.org` | Horizon endpoint (`https://horizon-testnet.stellar.org` for testnet) |
| `STELLAR_NETWORK`     | `public`                      | `public` or `testnet`                                                |
| `DB_PATH`             | `./data/stellar_wave_hub.db`  | SQLite database file path                                            |
| `NEXT_PUBLIC_APP_URL` | —                             | Public app URL (e.g., `http://localhost:3000`)                       |

---

## Maintainer Verification Flow

For the current `web/` app, use these runtime variables in `web/.env`:

| Variable | Description |
| -------- | ----------- |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key |
| `JWT_SECRET` | JWT signing secret |
| `STELLAR_HORIZON_URL` | Horizon endpoint |

Recommended verification flow:

1. `cd web`
2. `copy .env.example .env`
3. Fill `web/.env` with real Supabase credentials and a `JWT_SECRET`
4. Run `web/data/supabase/schema.sql` in Supabase SQL Editor
5. Optionally run `web/data/supabase/rls.sql`
6. Run `npm install`
7. Run `npm run dev`
8. Open `http://localhost:3000/register` and create a contributor account
9. Promote that account to admin in Supabase if approval testing is needed
10. Open `http://localhost:3000/submit`
11. Paste the data from `web/data/submissions/facilpay-usdc-project.json`
12. Submit and confirm it appears in `My Projects`
13. Open `/admin`, approve the project, and verify it appears on `/explore`
14. Open the project detail page and confirm the Asset Research, Trading Pairs, and Verification Sources sections render correctly

API-only verification:

1. Log in through the UI
2. Copy the bearer token from the browser
3. POST `web/data/submissions/facilpay-usdc-project.json` to `/api/projects`
4. Include `Authorization: Bearer <token>` and `Content-Type: application/json`
5. Confirm the created record via `/api/projects/my` and the project detail page

Local checks completed in this workspace:

```bash
cd web
npm run lint
npm run build
```

---

## API Reference

All API routes are implemented as Next.js Route Handlers under `frontend/app/api/*`.

All authenticated routes require the header:

```
Authorization: Bearer <jwt_token>
```

### Auth

| Method | Endpoint             | Auth     | Description                |
| ------ | -------------------- | -------- | -------------------------- |
| POST   | `/api/auth/register` | —        | Register a new contributor |
| POST   | `/api/auth/login`    | —        | Login and receive JWT      |
| GET    | `/api/auth/me`       | Required | Get current user profile   |
| PUT    | `/api/auth/me`       | Required | Update profile             |

### Projects

| Method | Endpoint                    | Auth     | Description                                                                          |
| ------ | --------------------------- | -------- | ------------------------------------------------------------------------------------ |
| GET    | `/api/projects`             | Optional | List approved projects (supports `?category`, `?search`, `?sort`, `?page`, `?limit`) |
| POST   | `/api/projects`             | Required | Submit a new project                                                                 |
| GET    | `/api/projects/pending`     | Admin    | Pending approval queue                                                               |
| GET    | `/api/projects/my`          | Required | Current user's submissions                                                           |
| GET    | `/api/projects/:slug`       | Optional | Project detail page                                                                  |
| PUT    | `/api/projects/:id`         | Required | Edit own project                                                                     |
| PUT    | `/api/projects/:id/approve` | Admin    | Approve (optionally feature)                                                         |
| PUT    | `/api/projects/:id/reject`  | Admin    | Reject with optional reason                                                          |
| DELETE | `/api/projects/:id`         | Admin    | Delete a project                                                                     |

### Ratings

| Method | Endpoint                          | Auth     | Description                   |
| ------ | --------------------------------- | -------- | ----------------------------- |
| POST   | `/api/ratings`                    | Required | Submit or update a rating     |
| GET    | `/api/ratings/project/:projectId` | —        | Get all ratings for a project |
| DELETE | `/api/ratings/:id`                | Required | Delete own rating             |

### Financials

| Method | Endpoint                                  | Auth | Description                        |
| ------ | ----------------------------------------- | ---- | ---------------------------------- |
| GET    | `/api/financials/:projectId/summary`      | —    | Account balances + payment summary |
| GET    | `/api/financials/:projectId/transactions` | —    | Recent transactions (last 20)      |
| GET    | `/api/financials/:projectId/contract-ops` | —    | Soroban contract invocations       |

---

## Smart Contract

The `wave_hub_registry` Soroban contract (Rust) provides an **on-chain registry** of approved Stellar Wave projects. It serves as a trustless source of truth complementing the off-chain database.

**Contract interface:**

```rust
// Register a new project (admin only)
fn register_project(env: Env, admin: Address, project_id: Symbol, account_id: Address)

// Remove a project (admin only)
fn remove_project(env: Env, admin: Address, project_id: Symbol)

// Check if a project is registered
fn is_registered(env: Env, project_id: Symbol) -> bool

// Get the Stellar account ID for a project
fn get_account(env: Env, project_id: Symbol) -> Option<Address>

// Get all registered project IDs
fn get_projects(env: Env) -> Vec<Symbol>
```

**Deployment addresses:**

| Network | Contract ID                |
| ------- | -------------------------- |
| Testnet | _(deploy and update here)_ |
| Mainnet | _(TBD — post-MVP)_         |

---

## Data Models

```
users           — id, username, email, password_hash, role, stellar_address, github_url, bio
projects        — id, name, slug, description, category, status, stellar_contract_id, stellar_account_id, tags
ratings         — id, project_id, user_id, score, purpose_score, innovation_score, usability_score, review_text
financial_snapshots — id, project_id, balances, total_received, total_sent, snapshot_at
contract_invocations — id, project_id, contract_id, transaction_hash, function_name, invoker, ledger
```

Project `status` lifecycle:

```
submitted → pending → approved / rejected
                          ↓
                       featured  (admin promotes)
```

---

## Contributing

We welcome contributions from everyone! See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide.

**Quick start:**

1. Pick an [open issue](https://github.com/samieazubike/stellar-wave-hub/issues) and claim it
2. Fork the repo and create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes
4. Run checks: `npm run lint` (web app) / `cargo test` (contract)
5. Add yourself to [CONTRIBUTORS.md](CONTRIBUTORS.md)
6. Open a pull request

See the [Contributors](CONTRIBUTORS.md) list for everyone who has helped build this project.

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

_Built for the Stellar Wave Program community._
