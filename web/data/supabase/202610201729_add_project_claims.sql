-- Migration 202610201729: Add claim fields to projects
-- Lets a maintainer claim a pending submission so other maintainers
-- know it is already being reviewed.
-- Run this in the Supabase SQL Editor.

begin;

alter table public.projects
  add column if not exists claimed_by bigint,
  add column if not exists claimed_at timestamptz;

commit;
