-- Migration 202610220920: Report resolution tracking for the admin inbox (#527)
-- Builds on 202610212215_create_reports_table.sql.
-- Run this in the Supabase SQL Editor.

begin;

alter table public.reports
  add column if not exists resolved_at timestamptz,
  add column if not exists resolved_by bigint;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'reports_resolved_by_fkey'
  ) then
    alter table public.reports
      add constraint reports_resolved_by_fkey
      foreign key (resolved_by) references public.users ("numericId")
      on delete set null;
  end if;
end $$;

create index if not exists reports_status_created_at_idx
  on public.reports (status, created_at desc);

commit;
