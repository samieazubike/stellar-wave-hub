-- Migration 202610220905: Maintainer applications (#244) and notifications
-- The notifications table matches what createNotification() in
-- web/src/lib/db.ts writes (it was used by the app but never created).
-- Run this in the Supabase SQL Editor.
begin;

create table if not exists public.maintainer_applications (
  id bigserial primary key,
  user_id bigint not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reason text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint maintainer_applications_user_id_fkey
    foreign key (user_id)
    references public.users ("numericId")
    on delete cascade
);

create index if not exists maintainer_applications_user_id_idx on public.maintainer_applications (user_id);
create index if not exists maintainer_applications_status_idx on public.maintainer_applications (status);

create table if not exists public.notifications (
  id bigserial primary key,
  "numericId" bigint,
  user_id bigint not null,
  project_id bigint,
  project_name text,
  status text,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now(),
  constraint notifications_user_id_fkey
    foreign key (user_id)
    references public.users ("numericId")
    on delete cascade
);

-- Bring an existing notifications table up to the same shape.
alter table public.notifications
  add column if not exists "numericId" bigint,
  add column if not exists project_id bigint,
  add column if not exists project_name text,
  add column if not exists status text;

create index if not exists notifications_user_id_idx on public.notifications (user_id);
create index if not exists notifications_read_idx on public.notifications (read);

insert into public.counters (name, value)
values
  ('maintainer_applications', 0),
  ('notifications', 0)
on conflict (name) do nothing;

commit;
