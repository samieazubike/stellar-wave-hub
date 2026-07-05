-- Migration: Add moderation action audit log
-- Run this in Supabase SQL Editor after schema.sql and rls.sql

begin;

create table if not exists public.moderation_log (
  id bigserial primary key,
  actor_id bigint not null,
  action text not null check (action in ('approve', 'reject', 'feature', 'delist', 'delete')),
  project_id bigint not null,
  reason text,
  created_at timestamptz not null default now(),
  constraint moderation_log_actor_id_fkey
    foreign key (actor_id)
    references public.users ("numericId")
    on delete restrict
);

create index if not exists moderation_log_created_at_idx on public.moderation_log (created_at desc);
create index if not exists moderation_log_project_id_idx on public.moderation_log (project_id);
create index if not exists moderation_log_actor_id_idx on public.moderation_log (actor_id);

-- Backend-only: no anon/authenticated policies. Service role access only.
alter table public.moderation_log enable row level security;

commit;
