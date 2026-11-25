begin;

create table if not exists public.api_keys (
  id bigserial primary key,
  user_id bigint not null references public.users ("numericId") on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  key_hash text not null unique,
  prefix text not null,
  tier text not null default 'free',
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create index if not exists api_keys_user_id_idx on public.api_keys (user_id);
create index if not exists api_keys_active_hash_idx on public.api_keys (key_hash)
  where revoked_at is null;
alter table public.api_keys enable row level security;

commit;
