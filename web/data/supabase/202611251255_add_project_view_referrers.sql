begin;

create table if not exists public.project_views_referrers_daily (
  project_id bigint not null
    references public.projects ("numericId") on delete cascade,
  day date not null,
  referrer_host text not null,
  views bigint not null default 0 check (views >= 0),
  primary key (project_id, day, referrer_host)
);

create index if not exists project_views_referrers_daily_lookup_idx
  on public.project_views_referrers_daily (project_id, day desc);

alter table public.project_views_referrers_daily enable row level security;
revoke all on public.project_views_referrers_daily from anon, authenticated;
grant all on public.project_views_referrers_daily to service_role;

drop function if exists public.increment_project_view(bigint);

create function public.increment_project_view(
  p_project_id bigint,
  p_referrer_host text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  view_day date := (timezone('UTC', now()))::date;
begin
  insert into public.project_views_daily as current_views (project_id, day, views)
  values (p_project_id, view_day, 1)
  on conflict (project_id, day)
  do update set views = current_views.views + 1;

  insert into public.project_views_referrers_daily as current_referrers (
    project_id, day, referrer_host, views
  )
  values (p_project_id, view_day, p_referrer_host, 1)
  on conflict (project_id, day, referrer_host)
  do update set views = current_referrers.views + 1;
end;
$$;

revoke all on function public.increment_project_view(bigint, text)
  from public, anon, authenticated;
grant execute on function public.increment_project_view(bigint, text) to service_role;

commit;
