-- Sponsor bookings for the homepage hero sponsor strip.
-- Owners pick a free week from availability and pay to confirm.
-- A booking is considered confirmed once paid and appears in its week.

create table if not exists public.sponsor_bookings (
  id uuid primary key default gen_random_uuid(),
  week_start date not null,
  week_end date not null,
  sponsor_name text not null,
  sponsor_url text,
  sponsors_logo_url text,
  contact_email text not null,
  status text not null default 'pending',
  payment_reference text,
  amount_cents integer not null default 0,
  currency text not null default 'usd',
  paid_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint sponsor_bookings_status_check check (status in ('pending', 'confirmed', 'cancelled')),
  constraint sponsor_bookings_week_range_check check (week_end >= week_start),
  constraint sponsor_bookings_amount_check check (amount_cents >= 0)
);

-- One confirmed booking per week. Pending bookings may coexist but only one can be paid.
create unique index if not exists sponsor_bookings_confirmed_week_uniq
  on public.sponsor_bookings (week_start)
  where status = 'confirmed';

create index if not exists sponsor_bookings_week_start_idx
  on public.sponsor_bookings (week_start);

create index if not exists sponsor_bookings_status_idx
  on public.sponsor_bookings (status);

-- Keep updated_at in sync.
create or replace function public.set_sponsor_bookings_updated_at()
returns trigger
language plfsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on public.sponsor_bookings;
create trigger sponsor_bookings_set_updated_at
before update on public.sponsor_bookings
for each row
execute function public.set_sponsor_bookings_updated_at();

-- Row level security.
alter table public.sponsor_bookings enable row level security;

-- Anyone can read confirmed bookings so the homepage can render the hero sponsor.
drop policy if exists on public.sponsor_bookings;
create policy sponsor_bookings_public_read_confirmed
on public.sponsor_bookings
for select
to anon
using (status = 'confirmed');

-- Authenticated users can read their own pending bookings (by contact email).
create policy sponsor_bookings_owner_read
on public.sponsor_bookings
for select
to authenticated
using (contact_email = auth.jwt()->>email);

-- Authenticated users can create a pending booking for themselves.
create policy sponsor_bookings_owner_insert
on public.sponsor_bookings
for insert
to authenticated
with check (contact_email = auth.jwt()->>email and status = 'pending');

-- Owners can update their own pending booking (e.g. to confirm after payment).
create policy sponsor_bookings_owner_update
on public.sponsor_bookings
for update
to authenticated
using (contact_email = auth.jwt()->>email)
with check (contact_email = auth.jwt()->>email);
