-- Migration 007: Add notifications table
-- In-app notifications for maintainers when new projects are submitted.

begin;

create table if not exists public.notifications (
  id          bigserial primary key,
  user_id     bigint      not null,
  type        text        not null default 'submission',
  title       text        not null,
  body        text        not null,
  link        text,
  project_id  bigint,
  read        boolean     not null default false,
  created_at  timestamptz not null default now(),

  constraint notifications_user_id_fkey
    foreign key (user_id)
    references public.users ("numericId")
    on delete cascade
);

create index if not exists notifications_user_id_idx
  on public.notifications (user_id, created_at desc);

create index if not exists notifications_unread_idx
  on public.notifications (user_id) where not read;

alter table public.notifications enable row level security;

commit;
