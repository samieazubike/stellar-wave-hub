-- Migration: Add category_sponsors and payments tables
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

create table if not exists public.category_sponsors (
  id bigserial primary key,
  category text not null,
  project_id bigint not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  tx_hash text not null unique,
  created_at timestamptz not null default now(),
  constraint category_sponsors_project_id_fkey
    foreign key (project_id)
    references public.projects ("numericId")
    on delete cascade,
  constraint category_sponsors_dates_check
    check (ends_at > starts_at)
);

create index if not exists category_sponsors_category_idx on public.category_sponsors (category);
create index if not exists category_sponsors_active_idx on public.category_sponsors (category, starts_at, ends_at);
create unique index if not exists category_sponsors_tx_hash_key on public.category_sponsors (tx_hash);

alter table public.category_sponsors enable row level security;
alter table public.payments enable row level security;

create policy category_sponsors_public_read
  on public.category_sponsors
  for select
  to anon, authenticated
  using (true);

commit;
