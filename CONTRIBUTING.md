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

Want to improve the platform itself? We welcome code contributions too. This guide takes you from a fresh clone to a running local app with an admin account.

#### Prerequisites

- [Node.js](https://nodejs.org) 20 or newer, and npm
- A free [Supabase](https://supabase.com) account
- The [Freighter](https://www.freighter.app) browser extension (for wallet sign-in)
- Rust and the `wasm32-unknown-unknown` target (only for smart contract work)

> **Use a throwaway Supabase project** for local development. The app talks to Supabase with the service-role key, which bypasses Row Level Security, so never reuse a project that holds real data, and never commit the key.

#### Step 1: Clone and install

```bash
git clone https://github.com/samieazubike/stellar-wave-hub.git
cd stellar-wave-hub/web
npm install
```

#### Step 2: Create a Supabase project and apply the migrations

1. In Supabase, create a new project.
2. Open **SQL Editor** and run the files in `web/data/supabase/` one at a time, in this order:

   1. `schema.sql`
   2. Every numbered migration in ascending filename order: first the short-prefixed ones (`002_…` through `008_…`), then the timestamp-prefixed ones (`YYYYMMDDHHMM_…`). `ls web/data/supabase` lists them in the right order.

   > `schema.sql` already restricts `users.role` to `contributor`, `maintainer` or `admin`. If `005_add_maintainer_role.sql` fails with `constraint "users_role_check" already exists`, that is harmless: skip it and continue.

3. `rls.sql` is optional. Local development works without it. Run it only if you are testing Row Level Security policies.

#### Step 3: Set environment variables

Copy `web/.env.example` to `web/.env.local` and fill in at least these values:

```bash
# Supabase: Project Settings -> API
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Signs login tokens. Use any long random string.
JWT_SECRET=replace-with-a-random-string-of-at-least-32-chars

# Stellar testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_CONTRACT_NETWORK=testnet
```

Optional variables:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SITE_URL` | Base URL used for metadata, sitemap and robots |
| `NEXT_PUBLIC_API_URL` | API base URL for project page metadata |
| `NEXT_PUBLIC_CONTRACT_ID` | Rating contract ID (defaults to none) |
| `NEXT_PUBLIC_SOROBAN_RPC_URL` | Soroban RPC endpoint override |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Used by the sitemap only |
| `CRON_SECRET` | Protects the `/api/cron/snapshots` route |

> Always set your own `JWT_SECRET`. In development a missing secret falls back to a publicly known value; production builds refuse to start unless it is set to at least 32 characters.

Make sure `.env.local` is never committed: `git check-ignore web/.env.local` should print the path.

#### Step 4: Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

#### Step 5: Create an admin user

The `admin` role cannot be self-assigned, so promote an account you created yourself:

1. Create an account in the running app using its sign-up flow.
2. In the Supabase **SQL Editor**, promote it (replace `your-username`):

   ```sql
   update public.users
   set role = 'admin'
   where username = 'your-username';
   ```

3. Confirm the change:

   ```sql
   select "numericId", username, role from public.users where username = 'your-username';
   ```

4. Sign out and back in so your session picks up the new role, then open [http://localhost:3000/admin](http://localhost:3000/admin).

See [docs/MAINTAINERS.md](docs/MAINTAINERS.md) for what admins can do.

#### Step 6: Connect Freighter on Stellar testnet

1. Install the [Freighter](https://www.freighter.app) extension and create or import a **testnet-only** account. Never use a wallet that holds real funds.
2. In Freighter, switch the network to **Test Net**.
3. Fund the account with the testnet faucet (Friendbot): `https://friendbot.stellar.org?addr=YOUR_PUBLIC_KEY`
4. In the app, choose wallet sign-in. Freighter will ask you to sign a challenge message, which proves you own the address without sending a transaction.

#### Smart contract work

```bash
cd contracts/wave_hub_registry
cargo build --target wasm32-unknown-unknown --release
cargo test
```

#### Troubleshooting

| Problem | Fix |
|---------|-----|
| `relation "public.users" does not exist` | `schema.sql` has not been run in this Supabase project |
| Admin page redirects or shows no admin tools | Sign out and back in after changing the role |
| Wallet sign-in fails | Check that Freighter is on **Test Net** and the account is funded |
| Install is very slow | Use `npm install --prefer-offline --no-audit --no-fund` |
### 4. Report Bugs & Suggest Features

Open an issue with a clear description of the bug or feature request.

### 5. Maintaining the Project

If you hold maintainer (`admin`) access, see [docs/MAINTAINERS.md](docs/MAINTAINERS.md) for responsibilities, the permission matrix, and the review checklist to use before approving submissions.

## Roles and Permissions

Stellar Wave Hub has a role-based permission system to manage access to platform features. Every user is assigned one role upon registration, and roles can be upgraded by administrators.

### Roles

- **Contributor** — The default role for all new users. Contributors can submit projects, leave reviews and ratings on approved projects, and manage their own content.
- **Maintainer** — A trusted role with moderation capabilities. Maintainers review pending submissions (scoped to assigned categories), approve or reject projects, and receive notifications when new projects are submitted in their categories. Maintainers can also moderate ratings and reviews.
- **Admin** — The highest authority role. Admins have full access to all moderation and configuration features across all categories, can assign roles to users, and manage maintainer category assignments.

### Permission Matrix

The table below shows what each role can do:

| Action                                  | Contributor | Maintainer | Admin |
|-----------------------------------------|:-----------:|:----------:|:-----:|
| Submit a project                        | ✓           | ✓          | ✓     |
| Rate/review approved projects           | ✓           | ✓          | ✓     |
| Edit own submissions                    | ✓           | ✓          | ✓     |
| View pending queue (public /queue page) | ✓           | ✓          | ✓     |
| View pending submissions (data access)  |             | ✓          | ✓     |
| Approve/feature submissions             |             | ✓*         | ✓     |
| Reject/delist projects                  |             | ✓*         | ✓     |
| Edit any project                        |             |            | ✓     |
| Delete any project (permanent)          |             |            | ✓     |
| Delete any rating/review                |             |            | ✓     |
| Access /admin or /maintainer routes     |             | ✓          | ✓     |
| Assign user roles                       |             |            | ✓     |
| Assign maintainer categories            |             |            | ✓     |
| Receive submission notifications        |             | ✓          | ✓     |

\* Maintainer moderation actions (approve, reject, delist) are scoped to the categories they are assigned to. Admins can moderate all categories.

### Role Assignment

Role assignments are managed by Admins through the platform's admin interface. If you believe you should be granted Maintainer or Admin access, reach out to an existing Admin via the repository discussions or issues.

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
