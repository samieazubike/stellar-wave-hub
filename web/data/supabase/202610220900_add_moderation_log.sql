-- Migration 202610220900: Moderation audit log (#241)
-- One row per moderation action so admins can see who did what and when,
-- and per-maintainer stats (#416) can be aggregated from it.
-- Run this in the Supabase SQL Editor.

begin;

create table if not exists public.moderation_log (
  id bigserial primary key,
  actor_id bigint not null,
  action text not null check (action in ('approve', 'reject', 'feature', 'delist', 'delete')),
  project_id bigint not null,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists moderation_log_actor_created_idx
  on public.moderation_log (actor_id, created_at desc);

alter table public.moderation_log enable row level security;

commit;
