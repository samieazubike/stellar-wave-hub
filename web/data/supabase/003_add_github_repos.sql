-- Migration: Add multiple GitHub repos support for projects
-- Run this in Supabase SQL Editor

begin;

-- ─── Projects: multiple GitHub repos (stored as JSON array of objects) ─
-- Each entry: { "label": "Frontend", "url": "https://github.com/..." }

alter table public.projects
  add column if not exists github_repos jsonb default '[]'::jsonb;

commit;
