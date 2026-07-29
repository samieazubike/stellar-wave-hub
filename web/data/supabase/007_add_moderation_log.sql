-- Migration 007: Add moderation_log table
-- Audit trail of admin moderation actions for accountability.

begin;

create table if not exists public.moderation_log (
  id         bigserial primary key,
  actor_id   bigint      not null,
  action     text        not null
               check (action in ('approve', 'reject', 'feature', 'delist', 'delete')),
  project_id bigint      not null,
  reason     text,
  created_at timestamptz not null default now(),

  constraint moderation_log_actor_id_fkey
    foreign key (actor_id)
    references public.users ("numericId")
    on delete restrict
);

-- No FK on project_id: deleted projects must remain in the audit trail.

create index if not exists moderation_log_created_at_idx
  on public.moderation_log (created_at desc);

create index if not exists moderation_log_project_id_idx
  on public.moderation_log (project_id);

create index if not exists moderation_log_actor_id_idx
  on public.moderation_log (actor_id);

-- RLS: table is backend-only.
-- All access goes through the Next.js API using the service-role key,
-- so no anon/authenticated client policies are needed.
-- Enabling RLS blocks any direct client access.
alter table public.moderation_log enable row level security;

commit;
