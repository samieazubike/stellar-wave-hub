-- Add optional Pro project page banner URLs.

alter table public.projects
  add column if not exists banner_url text;
