begin;

alter table public.projects
  add column if not exists claimed_by bigint references public.users ("numericId") on delete set null,
  add column if not exists claimed_at timestamptz;

create index if not exists projects_claimed_by_idx on public.projects (claimed_by);

commit;
