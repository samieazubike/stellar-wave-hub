-- Stellar Wave Hub - Supabase schema
-- Run this in Supabase SQL Editor (or via migration tooling)

begin;

create table if not exists public.users (
  "numericId" bigint primary key,
  username text not null,
  email text,
  password_hash text,
  role text not null default 'contributor' check (role in ('contributor', 'maintainer', 'admin')),
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
  featured_tx_hash text,
  featured_until timestamptz,
  featured_amount numeric default 100,
  featured_expires_at timestamptz,
  promo_code text,
  owner_verified_at timestamptz,
  owner_verified_address text,
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
create unique index if not exists projects_featured_tx_hash_unique_idx
  on public.projects (featured_tx_hash)
  where featured_tx_hash is not null;

-- Maintainer category assignments
-- Associates maintainers with the categories they can moderate
create table if not exists public.maintainer_categories (
  "userId" bigint not null,
  category text not null,
  created_at timestamptz not null default now(),
  constraint maintainer_categories_pkey
    primary key ("userId", category),
  constraint maintainer_categories_user_id_fkey
    foreign key ("userId")
    references public.users ("numericId")
    on delete cascade
);

create index if not exists maintainer_categories_user_id_idx on public.maintainer_categories ("userId");
create index if not exists maintainer_categories_category_idx on public.maintainer_categories (category);

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
  owner_reply text,
  owner_reply_at timestamptz,
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

create table if not exists public.project_updates (
  id bigint primary key,
  project_id bigint not null,
  author_id bigint not null,
  title text not null check (char_length(title) between 1 and 120),
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now(),
  constraint project_updates_project_id_fkey
    foreign key (project_id)
    references public.projects ("numericId")
    on delete cascade,
  constraint project_updates_author_id_fkey
    foreign key (author_id)
    references public.users ("numericId")
    on delete cascade
);

create index if not exists project_updates_project_created_at_idx
  on public.project_updates (project_id, created_at desc);

create table if not exists public.treasury_snapshots (
  snapshot_date date primary key,
  balance numeric(39, 0) not null,
  created_at timestamptz not null default now()
);

create table if not exists public.promo_codes (
  id bigserial primary key,
  code text not null,
  percent_off integer not null check (percent_off > 0 and percent_off <= 100),
  max_uses integer check (max_uses is null or max_uses > 0),
  uses integer not null default 0,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists promo_codes_code_key on public.promo_codes (upper(code));

create table if not exists public.reports (
  id bigserial primary key,
  "numericId" bigint unique,
  reporter_id bigint not null,
  target_type text not null check (target_type in ('project', 'rating')),
  target_id bigint not null,
  reason text not null,
  note text,
  details text,
  status text not null default 'open'
    check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by bigint,
  constraint reports_reporter_id_fkey
    foreign key (reporter_id)
    references public.users ("numericId")
    on delete cascade,
  constraint reports_resolved_by_fkey
    foreign key (resolved_by)
    references public.users ("numericId")
    on delete set null
);

create unique index if not exists reports_unique_open_user_target_idx
  on public.reports (target_type, target_id, reporter_id)
  where status = 'open';
create index if not exists reports_status_created_at_idx
  on public.reports (status, created_at desc);
create index if not exists reports_target_idx
  on public.reports (target_type, target_id);

-- Seed counters used by nextId()
insert into public.counters (name, value)
values
  ('users', 0),
  ('projects', 0),
  ('ratings', 0),
  ('rating_votes', 0),
  ('reports', 0),
  ('project_updates', 0)
on conflict (name) do nothing;

create table if not exists public.rating_votes (
  "numericId" bigint primary key,
  rating_id bigint not null,
  user_id bigint not null,
  created_at timestamptz not null default now(),
  constraint rating_votes_rating_id_fkey
    foreign key (rating_id)
    references public.ratings ("numericId")
    on delete cascade,
  constraint rating_votes_user_id_fkey
    foreign key (user_id)
    references public.users ("numericId")
    on delete cascade
);

create unique index if not exists rating_votes_rating_user_unique_idx on public.rating_votes (rating_id, user_id);
create index if not exists rating_votes_rating_id_idx on public.rating_votes (rating_id);
create index if not exists rating_votes_user_id_idx on public.rating_votes (user_id);
create index if not exists rating_votes_created_at_idx on public.rating_votes (created_at desc);

alter table public.reports enable row level security;

alter table public.project_updates enable row level security;

commit;

