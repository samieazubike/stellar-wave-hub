-- Stellar Wave Hub - Migration 005: Add maintainer role
-- Adds a CHECK constraint to users.role to enforce valid roles
-- (contributor < maintainer < admin)

begin;

alter table if exists public.users
  add constraint users_role_check
  check (role in ('contributor', 'maintainer', 'admin'));

commit;
