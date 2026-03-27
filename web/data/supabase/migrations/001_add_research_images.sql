-- Migration: add research_images column to projects table
-- Run this against existing Supabase deployments that were created before this column was added.

alter table public.projects
  add column if not exists research_images jsonb not null default '[]'::jsonb;
