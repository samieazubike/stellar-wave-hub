-- Migration: project owner updates
-- Access is managed by the Next.js API using the Supabase service role.

begin;

create table if not exists public.project_updates (
  id bigint primary key,
  project_id bigint not null,
  author_id bigint not null,
  title text not null check (char_length(title) between 1 and 120),
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now(),

  constraint project_updates_project_id_fkey
    foreign key (project_id)
    references public.projects ("numericId")
    on delete cascade,
  constraint project_updates_author_id_fkey
    foreign key (author_id)
    references public.users ("numericId")
    on delete cascade
);

create index if not exists project_updates_project_created_at_idx
  on public.project_updates (project_id, created_at desc);

insert into public.counters (name, value)
values ('project_updates', 0)
on conflict (name) do nothing;

alter table public.project_updates enable row level security;

commit;
