-- Migration 009: Add an immutable audit trail for moderation actions.

begin;

create table if not exists public.moderation_log (
  id         bigserial primary key,
  actor_id   bigint      not null,
  action     text        not null
               check (action in ('approve', 'reject', 'feature', 'unfeature', 'delist', 'delete')),
  project_id bigint      not null,
  reason     text,
  created_at timestamptz not null default now(),

  constraint moderation_log_actor_id_fkey
    foreign key (actor_id)
    references public.users ("numericId")
    on delete restrict
);

-- project_id intentionally has no foreign key. Deleting a project must not
-- remove or invalidate its audit history.
create index if not exists moderation_log_created_at_idx
  on public.moderation_log (created_at desc);

create index if not exists moderation_log_project_id_idx
  on public.moderation_log (project_id);

create index if not exists moderation_log_actor_id_idx
  on public.moderation_log (actor_id);

-- The service-role-backed API is the only supported access path.
alter table public.moderation_log enable row level security;

commit;
