This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment Variables

Create a `.env` file in `web/` with:

```bash
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
JWT_SECRET=your-secret-key-change-this
STELLAR_HORIZON_URL=https://horizon.stellar.org
```

## Supabase Setup

Run the SQL in [data/supabase/schema.sql](data/supabase/schema.sql) in your Supabase project's SQL Editor.

This creates all required tables and indexes used by the API routes:

- `users`
- `projects`
- `maintainer_categories`
- `ratings`
- `auth_challenges`
- `counters`
- `financial_snapshots`

## Optional RLS Policies

Run [data/supabase/rls.sql](data/supabase/rls.sql) after the base schema if you want Row Level Security enabled.

This policy set provides:

- Public read access for approved/featured projects
- Claim-based authenticated writes for users/projects/ratings
- Backend-only access (service-role) for `auth_challenges`, `counters`, and `financial_snapshots`

The write policies expect JWT custom claims:

- `app_user_id` (mapped to `users.numericId`)
- `app_role` (for admin overrides)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
