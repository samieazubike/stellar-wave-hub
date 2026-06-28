-- Migration: Add database-side search support for Explore projects
-- Run this in Supabase SQL Editor

begin;

alter table public.projects
  add column if not exists search_vector tsvector
  generated always as (
    setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(category, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(tags, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'C')
  ) stored;

create index if not exists projects_search_vector_idx
  on public.projects
  using gin (search_vector);

commit;
