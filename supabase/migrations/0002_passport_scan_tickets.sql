create table if not exists public.passport_scan_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_token text not null unique,
  passport_id text not null references public.passports(passport_id) on delete cascade,
  purpose text not null default 'staff_bind' check (purpose in ('staff_bind')),
  contact_phone text not null,
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  consumed_by_role text,
  consumed_by_operator text,
  consumption_count integer not null default 0
);

create index if not exists passport_scan_tickets_passport_idx
on public.passport_scan_tickets(passport_id, expires_at desc);

alter table public.passport_scan_tickets enable row level security;

create or replace function public.issue_passport_scan_ticket(
  p_passport_id text,
  p_contact_phone text,
  p_purpose text default 'staff_bind'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_passport public.passports;
  v_ticket_token text;
  v_expires_at timestamptz;
begin
  select *
  into v_passport
  from public.passports
  where passport_id = p_passport_id
    and contact_phone = public.normalize_phone(p_contact_phone)
    and activated is true
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'message', '当前护照未通过客户身份核验，暂时不能生成现场授权码。');
  end if;

  v_ticket_token := 'XCT-' || upper(encode(gen_random_bytes(12), 'hex'));
  v_expires_at := now() + interval '90 seconds';

  insert into public.passport_scan_tickets (
    ticket_token,
    passport_id,
    purpose,
    contact_phone,
    expires_at
  ) values (
    v_ticket_token,
    v_passport.passport_id,
    p_purpose,
    v_passport.contact_phone,
    v_expires_at
  );

  delete from public.passport_scan_tickets
  where passport_id = v_passport.passport_id
    and expires_at < now() - interval '10 minutes';

  return jsonb_build_object(
    'ok', true,
    'ticket_token', v_ticket_token,
    'passport_id', v_passport.passport_id,
    'expires_at', extract(epoch from v_expires_at) * 1000
  );
end;
$$;

create or replace function public.resolve_passport_scan_ticket(
  p_session_token uuid,
  p_role text,
  p_ticket_token text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session record;
  v_ticket public.passport_scan_tickets;
begin
  select * into v_session from public.get_active_staff_session(p_session_token, p_role) limit 1;
  if not found then
    return jsonb_build_object('ok', false, 'message', '工作人员会话已失效，请重新登录后再扫码。');
  end if;

  select *
  into v_ticket
  from public.passport_scan_tickets
  where ticket_token = upper(trim(coalesce(p_ticket_token, '')))
    and purpose = 'staff_bind'
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'message', '未识别到有效的短时授权码，请让客户刷新当前二维码后重试。');
  end if;

  if v_ticket.expires_at <= now() then
    return jsonb_build_object('ok', false, 'message', '该授权码已过期，请让客户重新出示最新二维码。');
  end if;

  if v_ticket.consumed_at is not null then
    return jsonb_build_object('ok', false, 'message', '该授权码已被使用，请让客户刷新二维码后再次扫码。');
  end if;

  update public.passport_scan_tickets
  set
    consumed_at = now(),
    consumed_by_role = v_session.role,
    consumed_by_operator = v_session.operator_name,
    consumption_count = consumption_count + 1
  where id = v_ticket.id;

  return jsonb_build_object(
    'ok', true,
    'passport_id', v_ticket.passport_id,
    'message', '扫码授权成功，已锁定当前传人档案。'
  );
end;
$$;

grant execute on function public.issue_passport_scan_ticket(text, text, text) to anon, authenticated;
grant execute on function public.resolve_passport_scan_ticket(uuid, text, text) to anon, authenticated;
