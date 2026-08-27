-- Migration: Add "substantial" project completeness flag
-- Run this in Supabase SQL Editor

begin;

-- ─── Projects: completeness predicate ──────────────────────────────────
-- A project is "substantial" (a real, complete build rather than a thin
-- placeholder submission) when it meets BOTH of:
--   1. it has a deployed Soroban smart contract (stellar_contract_id) —
--      required, not merely sufficient on its own; AND
--   2. it meets at least 2 of these 3 secondary completeness markers:
--       - stellar_account_id is set (on-chain presence)
--       - github_url is set, or github_repos has at least one entry
--       - website_url is set
--
-- description length isn't scored here: the submission form already
-- enforces a 20-char minimum (web/src/app/submit/page.tsx), so it's true
-- for every row and wouldn't differentiate anything.
--
-- To retune the rule (e.g. change the threshold or which markers count),
-- edit the function body below with `create or replace function`. Note
-- that this alone does NOT retroactively recompute already-stored rows —
-- Postgres only recomputes a stored generated column when its row is
-- updated. After changing the function, force a backfill with:
--   update public.projects set "numericId" = "numericId";

create or replace function public.project_is_substantial(
  p_stellar_contract_id text,
  p_stellar_account_id text,
  p_github_url text,
  p_github_repos jsonb,
  p_website_url text
) returns boolean
language sql
immutable
as $$
  select
    p_stellar_contract_id is not null
    and (
      (case when p_stellar_account_id is not null then 1 else 0 end) +
      (case when p_github_url is not null
              or jsonb_array_length(coalesce(p_github_repos, '[]'::jsonb)) > 0
            then 1 else 0 end) +
      (case when p_website_url is not null then 1 else 0 end)
    ) >= 2
$$;

alter table public.projects
  add column if not exists is_substantial boolean
  generated always as (
    public.project_is_substantial(
      stellar_contract_id, stellar_account_id, github_url, github_repos, website_url
    )
  ) stored;

create index if not exists projects_is_substantial_idx
  on public.projects (is_substantial)
  where is_substantial = true;

commit;
