-- Migration 202610220915: Add owner reply columns to ratings
-- Run this in Supabase SQL Editor

begin;

alter table public.ratings
  add column if not exists owner_reply text,
  add column if not exists owner_reply_at timestamptz;

commit;
