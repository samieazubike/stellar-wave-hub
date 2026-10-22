-- Admin role changes are serialized so concurrent demotions cannot remove all admins.
begin;
create or replace function public.admin_change_user_role(actor_id bigint, target_id bigint, new_role text)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  target public.users%rowtype;
begin
  lock table public.users in share row exclusive mode;
  if not exists (select 1 from public.users where "numericId" = actor_id and role = 'admin') then
    raise exception 'Forbidden' using errcode = '42501';
  end if;
  if new_role not in ('contributor', 'maintainer', 'admin') or new_role is null then
    raise exception 'Invalid role' using errcode = '23514';
  end if;
  select * into target from public.users where "numericId" = target_id;
  if not found then raise exception 'User not found' using errcode = 'P0002'; end if;
  if target.role = 'admin' and new_role <> 'admin' then
    if actor_id = target_id then raise exception 'Cannot demote yourself' using errcode = '23514'; end if;
    if (select count(*) from public.users where role = 'admin') <= 1 then
      raise exception 'Cannot demote last admin' using errcode = '23514';
    end if;
  end if;
  update public.users set role = new_role where "numericId" = target_id;
  return jsonb_build_object('id', target."numericId", 'username', target.username,
    'email', target.email, 'role', new_role, 'created_at', target.created_at);
end;
$$;
revoke all on function public.admin_change_user_role(bigint, bigint, text) from public, anon, authenticated;
grant execute on function public.admin_change_user_role(bigint, bigint, text) to service_role;
commit;
