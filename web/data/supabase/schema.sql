-- Stellar Wave Hub - Supabase schema
-- Run this in Supabase SQL Editor (or via migration tooling)

begin;

create table if not exists public.users (
  "numericId" bigint primary key,
  username text not null,
  email text,
  password_hash text,
  role text not null default 'contributor',
  stellar_address text,
  github_url text,
  twitter_url text,
  discord_username text,
  telegram_url text,
  website_url text,
  bio text,
  auth_method text,
  created_at timestamptz not null default now()
);

create unique index if not exists users_username_key on public.users (username);
create unique index if not exists users_email_key on public.users (email) where email is not null;
create index if not exists users_stellar_address_idx on public.users (stellar_address);

create table if not exists public.projects (
  "numericId" bigint primary key,
  name text not null,
  slug text not null,
  description text not null,
  category text not null,
  status text not null default 'submitted',
  stellar_account_id text,
  stellar_contract_id text,
  tags text,
  website_url text,
  github_url text,
  github_repos jsonb default '[]'::jsonb,
  logo_url text,
  research_images jsonb default '[]'::jsonb,
  stellar_network text not null default 'mainnet' check (stellar_network in ('testnet', 'mainnet')),
  user_id bigint not null,
  featured integer not null default 0,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_user_id_fkey
    foreign key (user_id)
    references public.users ("numericId")
    on delete restrict
);

create unique index if not exists projects_slug_key on public.projects (slug);
create index if not exists projects_status_idx on public.projects (status);
create index if not exists projects_category_idx on public.projects (category);
create index if not exists projects_created_at_idx on public.projects (created_at desc);
create index if not exists projects_user_id_idx on public.projects (user_id);

create table if not exists public.ratings (
  "numericId" bigint primary key,
  project_id bigint not null,
  user_id bigint not null,
  score integer not null,
  purpose_score integer,
  innovation_score integer,
  usability_score integer,
  review_text text,
  tx_hash text,
  created_at timestamptz not null default now(),
  constraint ratings_project_id_fkey
    foreign key (project_id)
    references public.projects ("numericId")
    on delete cascade,
  constraint ratings_user_id_fkey
    foreign key (user_id)
    references public.users ("numericId")
    on delete cascade,
  constraint ratings_score_check check (score between 1 and 5),
  constraint ratings_purpose_score_check check (purpose_score is null or purpose_score between 1 and 5),
  constraint ratings_innovation_score_check check (innovation_score is null or innovation_score between 1 and 5),
  constraint ratings_usability_score_check check (usability_score is null or usability_score between 1 and 5)
);

create unique index if not exists ratings_project_user_unique_idx on public.ratings (project_id, user_id);
create index if not exists ratings_project_id_idx on public.ratings (project_id);
create index if not exists ratings_user_id_idx on public.ratings (user_id);
create index if not exists ratings_created_at_idx on public.ratings (created_at desc);

create table if not exists public.auth_challenges (
  "publicKey" text primary key,
  challenge text not null,
  nonce text not null,
  created_at bigint not null,
  expires_at bigint not null
);

create index if not exists auth_challenges_expires_at_idx on public.auth_challenges (expires_at);

create table if not exists public.counters (
  name text primary key,
  value bigint not null default 0
);

create table if not exists public.financial_snapshots (
  id bigserial primary key,
  project_id bigint not null,
  snapshot_data jsonb not null,
  created_at timestamptz not null default now(),
  constraint financial_snapshots_project_id_fkey
    foreign key (project_id)
    references public.projects ("numericId")
    on delete cascade
);

create index if not exists financial_snapshots_project_id_idx on public.financial_snapshots (project_id);
create index if not exists financial_snapshots_created_at_idx on public.financial_snapshots (created_at desc);

-- Seed counters used by nextId()
insert into public.counters (name, value)
values
  ('users', 0),
  ('projects', 0),
  ('ratings', 0)
on conflict (name) do nothing;

commit;
