create or replace function public.login_staff(p_role text, p_pin text, p_operator_name text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account public.staff_accounts;
  v_session public.staff_sessions;
  v_operator_name text;
begin
  select *
  into v_account
  from public.staff_accounts
  where role = p_role
    and is_active is true
    and pin_hash = extensions.crypt(trim(coalesce(p_pin, '')), pin_hash)
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'message', '工作人员 PIN 不正确。');
  end if;

  v_operator_name := coalesce(nullif(trim(coalesce(p_operator_name, '')), ''), v_account.operator_name);

  insert into public.staff_sessions (staff_account_id, role, operator_name, expires_at)
  values (v_account.id, v_account.role, v_operator_name, now() + interval '8 hours')
  returning * into v_session;

  return jsonb_build_object(
    'ok', true,
    'role', v_session.role,
    'operator_name', v_session.operator_name,
    'session_token', v_session.session_token,
    'granted_at', v_session.created_at,
    'expires_at', extract(epoch from v_session.expires_at) * 1000
  );
end;
$$;
