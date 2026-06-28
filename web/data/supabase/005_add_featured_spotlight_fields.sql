-- Migration: Featured Spotlight monetization fields
-- Add to Supabase (used by repo via Firestore wrapper + schema parity)

begin;

alter table public.projects
  add column if not exists featured_until timestamptz,
  add column if not exists featured_tx_hash text;

create unique index if not exists projects_featured_tx_hash_unique_idx
  on public.projects (featured_tx_hash)
  where featured_tx_hash is not null;

commit;

