-- Migration 006: Add submission_notes table
-- Internal review notes on project submissions, visible to admins only.

begin;

create table if not exists public.submission_notes (
  id         bigserial primary key,
  project_id bigint      not null,
  author_id  bigint      not null,
  body       text        not null,
  created_at timestamptz not null default now(),

  constraint submission_notes_project_id_fkey
    foreign key (project_id)
    references public.projects ("numericId")
    on delete cascade,

  constraint submission_notes_author_id_fkey
    foreign key (author_id)
    references public.users ("numericId")
    on delete cascade
);

create index if not exists submission_notes_project_id_idx
  on public.submission_notes (project_id);

create index if not exists submission_notes_created_at_idx
  on public.submission_notes (created_at asc);

-- RLS: table is backend-only.
-- All access goes through the Next.js API using the service-role key,
-- so no anon/authenticated client policies are needed.
-- Enabling RLS blocks any direct client access.
alter table public.submission_notes enable row level security;

commit;
