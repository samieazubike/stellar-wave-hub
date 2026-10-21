-- Migration 009: Add payments table for recording Stellar XLM payments
-- Covers tips (product = 'tip') and future payment products.
-- The unique constraint on tx_hash prevents double-redemption.
-- Run this in Supabase SQL Editor.

begin;

create table if not exists public.payments (
  id              bigserial primary key,
  -- Who sent the payment (Stellar public key, not necessarily a Hub user)
  from_address    text not null,
  -- Destination account that received the XLM
  to_address      text not null,
  -- Verified on-chain amount (string to preserve Stellar precision, 7 dp)
  amount_xlm      text not null,
  -- Transaction hash – unique so each tx can only be redeemed once
  tx_hash         text not null,
  -- Memo attached to the transaction, e.g. "tip:my-project"
  memo            text,
  -- Logical product that this payment covers, e.g. 'tip', 'featured'
  product         text not null default 'tip',
  -- Optional FK to the project being tipped / featured
  project_id      bigint,
  -- Optional FK to the Hub user who initiated the tip (may be null for anon)
  user_id         bigint,
  created_at      timestamptz not null default now(),

  constraint payments_tx_hash_unique unique (tx_hash),

  constraint payments_project_id_fkey
    foreign key (project_id)
    references public.projects ("numericId")
    on delete set null,

  constraint payments_user_id_fkey
    foreign key (user_id)
    references public.users ("numericId")
    on delete set null
);

-- Speed up look-ups by project (e.g. "tips received by project X")
create index if not exists payments_project_id_idx
  on public.payments (project_id);

-- Speed up look-ups by sender address
create index if not exists payments_from_address_idx
  on public.payments (from_address);

-- Speed up look-ups by product type
create index if not exists payments_product_idx
  on public.payments (product);

create index if not exists payments_created_at_idx
  on public.payments (created_at desc);

-- Seed the counter so nextId() works for the 'payments' collection
insert into public.counters (name, value)
values ('payments', 0)
on conflict (name) do nothing;

commit;
