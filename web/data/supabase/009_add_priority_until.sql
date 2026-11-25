-- Migration 009: Add priority queue support to projects table
-- Run this in Supabase SQL Editor

begin;

alter table public.projects
  add column if not exists priority_until timestamptz;

create index if not exists projects_priority_until_idx
  on public.projects (priority_until)
  where priority_until is not null;

commit;
