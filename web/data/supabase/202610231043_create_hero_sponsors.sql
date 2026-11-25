-- Migration 202610231043: Homepage hero sponsorship bookings (#460)
-- Sells the homepage hero slot by the week. A week can be booked once
-- (unique week_start) and a payment transaction can only redeem once
-- (unique tx_hash). Run this in the Supabase SQL Editor.

begin;

create table if not exists public.hero_sponsors (
  id bigserial primary key,
  week_start date not null unique,
  project_id bigint not null,
  headline text,
  tx_hash text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists hero_sponsors_week_start_idx
  on public.hero_sponsors (week_start);

-- RLS enabled with no policies: like moderation_log, only the server
-- (service role) reads and writes sponsorship bookings.
alter table public.hero_sponsors enable row level security;

commit;
