begin;

create table if not exists public.payments (
  id bigserial primary key,
  tx_hash text not null unique,
  product text not null check (product = 'spotlight'),
  user_id bigint not null references public.users ("numericId") on delete restrict,
  project_id bigint not null references public.projects ("numericId") on delete restrict,
  amount numeric(20, 7) not null check (amount > 0),
  duration_days integer not null check (duration_days in (7, 30, 90)),
  source_address text not null,
  destination_address text not null,
  network text not null check (network in ('mainnet', 'testnet')),
  created_at timestamptz not null default now()
);

create index if not exists payments_product_created_at_idx
  on public.payments (product, created_at desc);
create index if not exists payments_project_id_idx
  on public.payments (project_id);
create index if not exists payments_user_id_idx
  on public.payments (user_id);

commit;