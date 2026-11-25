begin;

alter table public.projects
  add column if not exists pro_until timestamptz,
  add column if not exists pro_tx_hash text;

alter table public.payments
  drop constraint if exists payments_product_check,
  drop constraint if exists payments_duration_days_check,
  add constraint payments_product_check check (product in ('spotlight', 'pro')),
  add constraint payments_duration_days_check check (duration_days in (7, 30, 90, 365));

create or replace function public.redeem_pro_payment(
  p_tx_hash text,
  p_user_id bigint,
  p_project_id bigint,
  p_amount numeric,
  p_source_address text,
  p_destination_address text,
  p_network text
)
returns timestamptz
language plpgsql
as $$
declare
  new_pro_until timestamptz;
begin
  insert into public.payments (
    tx_hash,
    product,
    user_id,
    project_id,
    amount,
    duration_days,
    source_address,
    destination_address,
    network
  ) values (
    p_tx_hash,
    'pro',
    p_user_id,
    p_project_id,
    p_amount,
    365,
    p_source_address,
    p_destination_address,
    p_network
  );

  update public.projects
  set
    pro_until = greatest(coalesce(pro_until, now()), now()) + interval '365 days',
    pro_tx_hash = p_tx_hash,
    updated_at = now()
  where "numericId" = p_project_id
    and user_id = p_user_id
  returning pro_until into new_pro_until;

  if not found then
    raise exception 'Project owner changed or project not found';
  end if;

  return new_pro_until;
end;
$$;

revoke all on function public.redeem_pro_payment(
  text, bigint, bigint, numeric, text, text, text
) from public, anon, authenticated;
grant execute on function public.redeem_pro_payment(
  text, bigint, bigint, numeric, text, text, text
) to service_role;

commit;
