begin;

create table if not exists public.project_views_daily (
  project_id bigint not null
    references public.projects ("numericId") on delete cascade,
  day date not null,
  views bigint not null default 0 check (views >= 0),
  primary key (project_id, day)
);

alter table public.project_views_daily enable row level security;
revoke all on public.project_views_daily from anon, authenticated;
grant all on public.project_views_daily to service_role;

create or replace function public.increment_project_view(p_project_id bigint)
returns bigint
language sql
security invoker
set search_path = ''
as $$
  insert into public.project_views_daily as current_views (project_id, day, views)
  values (p_project_id, (timezone('UTC', now()))::date, 1)
  on conflict (project_id, day)
  do update set views = current_views.views + 1
  returning views;
$$;

revoke all on function public.increment_project_view(bigint)
  from public, anon, authenticated;
grant execute on function public.increment_project_view(bigint) to service_role;

commit;
