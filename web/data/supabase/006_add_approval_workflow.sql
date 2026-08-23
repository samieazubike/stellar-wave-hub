-- Migration: Two-person approval workflow for sensitive actions
-- Adds approval_requests table and counter

begin;

create table if not exists public.approval_requests (
  "numericId" bigint primary key,
  project_id bigint not null,
  action_type text not null check (action_type in ('feature', 'unfeature', 'delete')),
  requested_by bigint not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reason text,
  reviewer_id bigint,
  reviewer_note text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint approval_requests_project_id_fkey
    foreign key (project_id)
    references public.projects ("numericId")
    on delete cascade,
  constraint approval_requests_requested_by_fkey
    foreign key (requested_by)
    references public.users ("numericId")
    on delete cascade,
  constraint approval_requests_reviewer_id_fkey
    foreign key (reviewer_id)
    references public.users ("numericId")
    on delete set null
);

create index if not exists approval_requests_project_id_idx on public.approval_requests (project_id);
create index if not exists approval_requests_status_idx on public.approval_requests (status);
create index if not exists approval_requests_requested_by_idx on public.approval_requests (requested_by);
create index if not exists approval_requests_created_at_idx on public.approval_requests (created_at desc);

-- Counter for auto-incrementing IDs
insert into public.counters (name, value)
values ('approval_requests', 0)
on conflict (name) do nothing;

commit;
