-- Migration: Add promo_codes table for spotlight discounts
-- Run this in Supabase SQL Editor

begin;

create table if not exists public.promo_codes (
  code text primary key,
  percent_off integer not null check (percent_off between 1 and 100),
  max_uses integer,               -- null = unlimited
  uses integer not null default 0,
  expires_at timestamptz,         -- null = never expires
  created_at timestamptz not null default now()
);

-- Backend-only: accessed exclusively via service role key.
-- RLS is enabled but no anon/authenticated policies are added.
alter table public.promo_codes enable row level security;

commit;
