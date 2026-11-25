begin;

alter table public.payments drop constraint if exists payments_product_check;
alter table public.payments add constraint payments_product_check
  check (product in ('spotlight', 'donation'));
alter table public.payments alter column user_id drop not null;
alter table public.payments alter column project_id drop not null;
alter table public.payments alter column duration_days drop not null;
alter table public.payments add column if not exists message text;
alter table public.payments drop constraint if exists payments_message_length_check;
alter table public.payments add constraint payments_message_length_check
  check (message is null or char_length(message) <= 500);
alter table public.payments drop constraint if exists payments_product_fields_check;
alter table public.payments add constraint payments_product_fields_check check (
  (product = 'spotlight' and user_id is not null and project_id is not null and duration_days is not null)
  or
  (product = 'donation' and project_id is null and duration_days is null)
);
alter table public.payments enable row level security;

commit;
