create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id integer not null references public.users(numericId) on delete cascade,
  project_id integer references public.projects(numericId) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "Users can read own notifications" on public.notifications;
create policy "Users can read own notifications"
  on public.notifications for select
  using (user_id = nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'user_id', '')::integer);
