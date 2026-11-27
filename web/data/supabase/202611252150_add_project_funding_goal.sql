-- Add optional XLM funding goal fields to projects.
begin;

alter table public.projects
  add column if not exists funding_goal_xlm numeric,
  add column if not exists funding_goal_label text;

alter table public.projects
  drop constraint if exists projects_funding_goal_xlm_check,
  add constraint projects_funding_goal_xlm_check
    check (funding_goal_xlm is null or funding_goal_xlm > 0);

commit;
