-- Record verified spotlight payments and prevent transaction replay.
-- Run this in Supabase SQL Editor after the earlier numbered migrations.

begin;

create table if not exists public.payments (
  id bigserial primary key,
  product text not null,
  user_id bigint not null references public.users ("numericId") on delete restrict,
  project_id bigint not null references public.projects ("numericId") on delete restrict,
  tx_hash text not null unique,
  amount_xlm numeric(20, 7) not null check (amount_xlm > 0),
  duration_days integer not null check (duration_days > 0),
  created_at timestamptz not null default now()
);

create index if not exists payments_user_id_idx on public.payments (user_id);
create index if not exists payments_project_id_idx on public.payments (project_id);
alter table public.payments enable row level security;

commit;
