-- Allow tip payments (#616) in the shared payments table.
-- Tips go straight to the project's own Stellar account and have no duration,
-- so duration_days becomes nullable for them.
begin;

alter table public.payments
  alter column duration_days drop not null,
  drop constraint if exists payments_product_check,
  add constraint payments_product_check check (product in ('spotlight', 'pro', 'tip'));

commit;
