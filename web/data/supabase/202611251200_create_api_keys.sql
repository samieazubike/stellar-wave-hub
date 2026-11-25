begin;

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id bigint not null references public.users ("numericId") on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  key_hash text not null unique,
  prefix text not null,
  tier text not null default 'free',
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create index if not exists api_keys_user_created_idx
  on public.api_keys (user_id, created_at desc);

create index if not exists api_keys_active_hash_idx
  on public.api_keys (key_hash)
  where revoked_at is null;

alter table public.api_keys enable row level security;
revoke all on public.api_keys from anon, authenticated;
grant all on public.api_keys to service_role;

commit;
