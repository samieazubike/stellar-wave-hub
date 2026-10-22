-- Migration 202610220910: Add rating_votes table for review helpfulness upvotes
-- Run this in Supabase SQL Editor

begin;

create table if not exists public.rating_votes (
  "numericId" bigint primary key,
  rating_id bigint not null,
  user_id bigint not null,
  created_at timestamptz not null default now(),
  constraint rating_votes_rating_id_fkey
    foreign key (rating_id)
    references public.ratings ("numericId")
    on delete cascade,
  constraint rating_votes_user_id_fkey
    foreign key (user_id)
    references public.users ("numericId")
    on delete cascade
);

create unique index if not exists rating_votes_rating_user_unique_idx
  on public.rating_votes (rating_id, user_id);

create index if not exists rating_votes_rating_id_idx
  on public.rating_votes (rating_id);

create index if not exists rating_votes_user_id_idx
  on public.rating_votes (user_id);

create index if not exists rating_votes_created_at_idx
  on public.rating_votes (created_at desc);

-- Seed counters for nextId('rating_votes')
insert into public.counters (name, value)
values ('rating_votes', 0)
on conflict (name) do nothing;

commit;
