-- Migration 008: Add featured spotlight transaction tracking to projects table
-- Run this in Supabase SQL Editor

begin;

alter table public.projects
  add column if not exists featured_tx_hash text,
  add column if not exists featured_amount numeric default 100,
  add column if not exists featured_expires_at timestamptz,
  add column if not exists promo_code text;

create index if not exists projects_featured_tx_hash_idx
  on public.projects (featured_tx_hash)
  where featured_tx_hash is not null;

commit;
