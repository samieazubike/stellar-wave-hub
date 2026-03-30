-- Migration: Add user social links, project research images, and network field
-- Run this in Supabase SQL Editor

begin;

-- ─── Users: social media fields ─────────────────────────────────────

alter table public.users
  add column if not exists twitter_url text,
  add column if not exists discord_username text,
  add column if not exists telegram_url text,
  add column if not exists website_url text;

-- ─── Projects: research images (stored as JSON array of URLs) ───────

alter table public.projects
  add column if not exists research_images jsonb default '[]'::jsonb;

-- ─── Projects: network selection (testnet or mainnet) ───────────────

alter table public.projects
  add column if not exists stellar_network text not null default 'mainnet'
  check (stellar_network in ('testnet', 'mainnet'));

commit;
