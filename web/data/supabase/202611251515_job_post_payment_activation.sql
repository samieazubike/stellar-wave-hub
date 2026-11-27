begin;

alter table public.payments
  drop constraint if exists payments_product_check,
  add constraint payments_product_check check (product in ('spotlight', 'pro', 'tip', 'job_post'));

alter table public.jobs
  alter column status set default 'draft',
  drop constraint if exists jobs_status_check,
  add constraint jobs_status_check check (status in ('draft', 'active', 'closed'));

update public.jobs
  set status = 'draft',
      featured_until = null,
      updated_at = now()
  where status = 'active'
    and tx_hash is null;

create or replace function public.redeem_job_payment(
  p_tx_hash text,
  p_user_id bigint,
  p_job_id bigint,
  p_amount numeric,
  p_source_address text,
  p_destination_address text,
  p_network text,
  p_featured boolean
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  job_project_id bigint;
  job_title text;
  activation_time timestamptz := now();
  job_expiry timestamptz := activation_time + interval '30 days';
  featured_expiry timestamptz;
begin
  select project_id, title
    into job_project_id, job_title
    from public.jobs
    where id = p_job_id
      and posted_by = p_user_id
      and status = 'draft'
    for update;

  if not found then
    raise exception 'Job is not an available draft'
      using errcode = 'P0002';
  end if;

  insert into public.payments (
    tx_hash,
    product,
    user_id,
    project_id,
    amount,
    duration_days,
    source_address,
    destination_address,
    network,
    created_at
  ) values (
    p_tx_hash,
    'job_post',
    p_user_id,
    job_project_id,
    p_amount,
    30,
    p_source_address,
    p_destination_address,
    p_network,
    activation_time
  );

  if p_featured then
    featured_expiry := job_expiry;
  end if;

  update public.jobs
    set status = 'active',
        expires_at = job_expiry,
        featured_until = featured_expiry,
        tx_hash = p_tx_hash,
        updated_at = activation_time
    where id = p_job_id;

  return jsonb_build_object(
    'expires_at', job_expiry,
    'featured_until', featured_expiry,
    'project_id', job_project_id,
    'title', job_title
  );
end;
$$;

revoke all on function public.redeem_job_payment(
  text, bigint, bigint, numeric, text, text, text, boolean
) from public, anon, authenticated;
grant execute on function public.redeem_job_payment(
  text, bigint, bigint, numeric, text, text, text, boolean
) to service_role;

commit;
