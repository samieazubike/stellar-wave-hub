-- Store the first treasury balance recorded for each UTC calendar day.

begin;

create table if not exists public.treasury_snapshots (
  snapshot_date date primary key,
  balance numeric(39, 0) not null,
  created_at timestamptz not null default now()
);

-- This table is accessed by the Next.js API with the service-role key only.
alter table public.treasury_snapshots enable row level security;

commit;
