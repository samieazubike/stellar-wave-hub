-- Migration: Create payments and story_submissions tables
begin;

create table if not exists public.payments (
  id bigserial primary key,
  tx_hash text not null unique,
  product text not null,
  amount numeric not null default 0,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists payments_tx_hash_key on public.payments (tx_hash);
create index if not exists payments_product_idx on public.payments (product);

create table if not exists public.story_submissions (
  id bigserial primary key,
  project_id bigint not null,
  author_id bigint,
  title text not null,
  body_md text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  tx_hash text not null unique,
  slug text unique,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint story_submissions_project_id_fkey
    foreign key (project_id)
    references public.projects ("numericId")
    on delete cascade
);

create index if not exists story_submissions_project_id_idx on public.story_submissions (project_id);
create index if not exists story_submissions_status_idx on public.story_submissions (status);
create unique index if not exists story_submissions_tx_hash_key on public.story_submissions (tx_hash);
create unique index if not exists story_submissions_slug_key on public.story_submissions (slug);

alter table public.payments enable row level security;
alter table public.story_submissions enable row level security;

create policy payments_public_read
  on public.payments
  for select
  to anon, authenticated
  using (true);

create policy story_submissions_public_read
  on public.story_submissions
  for select
  to anon, authenticated
  using (true);

commit;
