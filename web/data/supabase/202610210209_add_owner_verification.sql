-- Migration: add project owner-verification state
-- Run this in the Supabase SQL Editor (or via migration tooling).
--
-- A project owner proves control of the project's Stellar account by signing a
-- short-lived challenge (see POST /api/projects/[id]/verify-owner/challenge).
-- When that signature is accepted, owner_verified_at records when verification
-- happened and owner_verified_address records which account signed it.

begin;

alter table public.projects
  add column if not exists owner_verified_at timestamptz,
  add column if not exists owner_verified_address text;

create index if not exists projects_owner_verified_address_idx
  on public.projects (owner_verified_address)
  where owner_verified_address is not null;

commit;
