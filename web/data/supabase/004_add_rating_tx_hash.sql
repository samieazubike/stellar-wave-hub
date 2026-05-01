-- Migration: Add on-chain transaction hash to ratings
-- Run this in Supabase SQL Editor

begin;

-- Stores the Stellar transaction hash returned by the WaveHubRegistry contract
-- when a user rates a project on-chain (paying the 0.1 USDC rating fee).
-- Null for legacy off-chain ratings.
alter table public.ratings
  add column if not exists tx_hash text;

create index if not exists ratings_tx_hash_idx on public.ratings (tx_hash) where tx_hash is not null;

commit;
