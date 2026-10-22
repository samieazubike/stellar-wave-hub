-- Stellar Wave Hub - Add avatar_url to users
-- Public URL of the user's uploaded avatar (square-cropped), shown in the
-- navbar, on reviews and on profiles. Initials are the fallback when null.

begin;

alter table if exists public.users
  add column if not exists avatar_url text;

commit;
