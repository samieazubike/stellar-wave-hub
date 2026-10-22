-- Stellar Wave Hub - Reports Table Migration
-- Allows signed-in users to report projects or reviews for moderation

begin;

create table if not exists public.reports (
  id bigserial primary key,
  "numericId" bigint unique,
  target_type text not null,
  target_id bigint not null,
  reporter_id bigint not null,
  reason text not null,
  note text,
  -- Legacy name used by review reports and the admin inbox; kept in sync with note.
  details text,
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reports_reporter_id_fkey
    foreign key (reporter_id)
    references public.users ("numericId")
    on delete cascade
);

create index if not exists reports_target_idx
  on public.reports (target_type, target_id);

create index if not exists reports_reporter_id_idx
  on public.reports (reporter_id);

create index if not exists reports_status_idx
  on public.reports (status);

-- Deduplication: One open report per user per target
create unique index if not exists reports_unique_open_user_target_idx
  on public.reports (target_type, target_id, reporter_id)
  where status = 'open';

-- Existing databases: make sure the columns the API writes are present.
alter table public.reports
  add column if not exists note text,
  add column if not exists details text,
  add column if not exists updated_at timestamptz not null default now();

-- RLS: table is backend-only via service-role key
alter table public.reports enable row level security;

-- Seed reports counter for nextId()
insert into public.counters (name, value)
values ('reports', 0)
on conflict (name) do nothing;

commit;
