-- Moderation Log Table for tracking admin/maintainer actions
-- This table tracks all moderation actions (approvals, rejections, reviews)
-- for generating maintainer stats and leaderboards

create table if not exists public.moderation_log (
  id bigserial primary key,
  admin_id bigint not null,
  admin_username text not null,
  project_id bigint not null,
  project_name text not null,
  action text not null, -- 'approve', 'reject', 'feature', 'delist', 'review'
  action_details jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint moderation_log_admin_id_fkey
    foreign key (admin_id)
    references public.users ("numericId")
    on delete restrict,
  constraint moderation_log_project_id_fkey
    foreign key (project_id)
    references public.projects ("numericId")
    on delete cascade
);

create index if not exists moderation_log_admin_id_idx on public.moderation_log (admin_id);
create index if not exists moderation_log_action_idx on public.moderation_log (action);
create index if not exists moderation_log_created_at_idx on public.moderation_log (created_at desc);
create index if not exists moderation_log_project_id_idx on public.moderation_log (project_id);
