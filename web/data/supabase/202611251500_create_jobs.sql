-- Migration: job board
-- Projects can post roles they're hiring for. Access is managed by the
-- Next.js API using the Supabase service role.

begin;

create table if not exists public.jobs (
  id bigint primary key,
  project_id bigint not null,
  posted_by bigint not null,
  title text not null check (char_length(title) between 3 and 120),
  description text not null check (char_length(description) between 20 and 10000),
  type text not null default 'full_time'
    check (type in ('full_time', 'part_time', 'contract', 'internship', 'bounty')),
  compensation numeric check (compensation is null or compensation >= 0),
  compensation_currency text not null default 'USD'
    check (compensation_currency in ('XLM', 'USD')),
  compensation_period text not null default 'year'
    check (compensation_period in ('hour', 'month', 'year', 'fixed')),
  location text,
  remote boolean not null default true,
  apply_url text not null,
  status text not null default 'active'
    check (status in ('active', 'closed')),
  featured_until timestamptz,
  expires_at timestamptz not null default (now() + interval '30 days'),
  tx_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint jobs_project_id_fkey
    foreign key (project_id)
    references public.projects ("numericId")
    on delete cascade,
  constraint jobs_posted_by_fkey
    foreign key (posted_by)
    references public.users ("numericId")
    on delete cascade
);

create index if not exists jobs_status_expires_at_idx
  on public.jobs (status, expires_at);

create index if not exists jobs_project_id_idx
  on public.jobs (project_id);

create unique index if not exists jobs_tx_hash_key
  on public.jobs (tx_hash) where tx_hash is not null;

insert into public.counters (name, value)
values ('jobs', 0)
on conflict (name) do nothing;

alter table public.jobs enable row level security;

commit;
