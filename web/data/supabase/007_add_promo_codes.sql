-- Migration 007: Add promo_codes table for featured spotlights
-- Run this in Supabase SQL Editor

begin;

create table if not exists public.promo_codes (
  id          bigserial   primary key,
  code        text        not null,
  percent_off integer     not null check (percent_off > 0 and percent_off <= 100),
  max_uses    integer     check (max_uses is null or max_uses > 0),
  uses        integer     not null default 0,
  expires_at  timestamptz,
  created_at  timestamptz not null default now()
);

create unique index if not exists promo_codes_code_key on public.promo_codes (upper(code));

-- RLS: Table accessed via Next.js API using service role key
alter table public.promo_codes enable row level security;

commit;
