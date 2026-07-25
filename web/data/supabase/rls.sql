-- Stellar Wave Hub - Optional RLS policies
-- Run this after data/supabase/schema.sql
--
-- NOTE:
-- These policies assume JWT custom claims:
--   app_user_id (numericId as string)
--   app_role    (e.g. "admin", "maintainer", or "contributor")
-- If those claims are absent, authenticated write policies will deny access.

begin;

alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.ratings enable row level security;
alter table public.auth_challenges enable row level security;
alter table public.counters enable row level security;
alter table public.financial_snapshots enable row level security;

-- USERS
drop policy if exists users_public_read on public.users;
drop policy if exists users_self_read on public.users;
drop policy if exists users_self_update on public.users;

create policy users_public_read
  on public.users
  for select
  to anon, authenticated
  using (true);

create policy users_self_read
  on public.users
  for select
  to authenticated
  using (
    (
      auth.jwt() ->> 'app_user_id'
    ) is not null
    and "numericId" = (auth.jwt() ->> 'app_user_id')::bigint
  );

create policy users_self_update
  on public.users
  for update
  to authenticated
  using (
    (
      auth.jwt() ->> 'app_user_id'
    ) is not null
    and "numericId" = (auth.jwt() ->> 'app_user_id')::bigint
  )
  with check (
    (
      auth.jwt() ->> 'app_user_id'
    ) is not null
    and "numericId" = (auth.jwt() ->> 'app_user_id')::bigint
  );

-- PROJECTS
drop policy if exists projects_public_read on public.projects;
drop policy if exists projects_owner_read on public.projects;
drop policy if exists projects_owner_insert on public.projects;
drop policy if exists projects_owner_update on public.projects;
drop policy if exists projects_owner_delete on public.projects;

create policy projects_public_read
  on public.projects
  for select
  to anon, authenticated
  using (status in ('approved', 'featured'));

create policy projects_owner_read
  on public.projects
  for select
  to authenticated
  using (
    (
      auth.jwt() ->> 'app_user_id'
    ) is not null
    and user_id = (auth.jwt() ->> 'app_user_id')::bigint
  );

create policy projects_owner_insert
  on public.projects
  for insert
  to authenticated
  with check (
    (
      auth.jwt() ->> 'app_user_id'
    ) is not null
    and user_id = (auth.jwt() ->> 'app_user_id')::bigint
    and status = 'submitted'
  );

create policy projects_owner_update
  on public.projects
  for update
  to authenticated
  using (
    (
      auth.jwt() ->> 'app_user_id'
    ) is not null
    and (
      user_id = (auth.jwt() ->> 'app_user_id')::bigint
      or coalesce(auth.jwt() ->> 'app_role', '') in ('admin', 'maintainer')
    )
  )
  with check (
    (
      auth.jwt() ->> 'app_user_id'
    ) is not null
    and (
      user_id = (auth.jwt() ->> 'app_user_id')::bigint
      or coalesce(auth.jwt() ->> 'app_role', '') in ('admin', 'maintainer')
    )
  );

create policy projects_owner_delete
  on public.projects
  for delete
  to authenticated
  using (
    (
      auth.jwt() ->> 'app_user_id'
    ) is not null
    and (
      user_id = (auth.jwt() ->> 'app_user_id')::bigint
      or coalesce(auth.jwt() ->> 'app_role', '') in ('admin', 'maintainer')
    )
  );

-- RATINGS
drop policy if exists ratings_public_read on public.ratings;
drop policy if exists ratings_owner_insert on public.ratings;
drop policy if exists ratings_owner_update on public.ratings;
drop policy if exists ratings_owner_delete on public.ratings;

create policy ratings_public_read
  on public.ratings
  for select
  to anon, authenticated
  using (true);

create policy ratings_owner_insert
  on public.ratings
  for insert
  to authenticated
  with check (
    (
      auth.jwt() ->> 'app_user_id'
    ) is not null
    and user_id = (auth.jwt() ->> 'app_user_id')::bigint
  );

create policy ratings_owner_update
  on public.ratings
  for update
  to authenticated
  using (
    (
      auth.jwt() ->> 'app_user_id'
    ) is not null
    and (
      user_id = (auth.jwt() ->> 'app_user_id')::bigint
      or coalesce(auth.jwt() ->> 'app_role', '') in ('admin', 'maintainer')
    )
  )
  with check (
    (
      auth.jwt() ->> 'app_user_id'
    ) is not null
    and (
      user_id = (auth.jwt() ->> 'app_user_id')::bigint
      or coalesce(auth.jwt() ->> 'app_role', '') in ('admin', 'maintainer')
    )
  );

create policy ratings_owner_delete
  on public.ratings
  for delete
  to authenticated
  using (
    (
      auth.jwt() ->> 'app_user_id'
    ) is not null
    and (
      user_id = (auth.jwt() ->> 'app_user_id')::bigint
      or coalesce(auth.jwt() ->> 'app_role', '') in ('admin', 'maintainer')
    )
  );

-- BACKEND-ONLY TABLES (auth_challenges, counters, financial_snapshots)
-- No anon/authenticated policies are added. With RLS enabled, direct client access is denied.
-- Server-side use with SUPABASE_SERVICE_ROLE_KEY remains allowed.

commit;
