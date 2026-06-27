create or replace function public.check_in_family(p_phone text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_family public.families;
  v_passport public.passports;
  v_status text;
  v_message text;
  v_log_id text;
begin
  select *
  into v_family
  from public.families
  where contact_phone = public.normalize_phone(p_phone)
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'message', '该手机号不在本场家庭团报名名单中。');
  end if;

  select *
  into v_passport
  from public.passports
  where roster_family_id = v_family.id
  limit 1;

  if found then
    v_status := 'resumed';
    v_message := '识别到已有家庭账号，已直接续接原传人护照。';
  else
    v_status := 'verified';
    v_message := '前台核验通过，等待孩子激活传人护照。';
  end if;

  v_log_id := 'checkin-' || encode(extensions.gen_random_bytes(8), 'hex');

  insert into public.frontdesk_checkins (
    id,
    roster_family_id,
    family_label,
    contact_name,
    contact_phone,
    passport_id,
    status,
    message
  ) values (
    v_log_id,
    v_family.id,
    v_family.family_label,
    v_family.contact_name,
    v_family.contact_phone,
    coalesce(v_passport.passport_id, ''),
    v_status,
    v_message
  );

  return jsonb_build_object(
    'ok', true,
    'family', to_jsonb(v_family),
    'passport', to_jsonb(v_passport),
    'status', v_status,
    'message', v_message
  );
end;
$$;

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

  v_ticket_token := 'XCT-' || upper(encode(extensions.gen_random_bytes(12), 'hex'));
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

create or replace function public.upload_passport_photo(
  p_session_token uuid,
  p_passport_id text,
  p_photo jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session record;
begin
  select * into v_session from public.get_active_staff_session(p_session_token, 'photographer') limit 1;
  if not found then
    return jsonb_build_object('ok', false, 'message', '工作人员会话已失效。');
  end if;

  insert into public.passport_photos (
    id,
    passport_id,
    image_url,
    caption,
    location,
    timestamp_text,
    ai_motto,
    saved_to_poster
  ) values (
    coalesce(p_photo->>'id', 'photo-' || encode(extensions.gen_random_bytes(8), 'hex')),
    p_passport_id,
    coalesce(p_photo->>'imageUrl', ''),
    coalesce(p_photo->>'caption', ''),
    coalesce(p_photo->>'location', ''),
    coalesce(p_photo->>'timestamp', ''),
    nullif(p_photo->>'aiMotto', ''),
    coalesce((p_photo->>'savedToPoster')::boolean, false)
  );

  update public.passports
  set updated_at = now()
  where passport_id = p_passport_id;

  insert into public.staff_action_logs (staff_role, operator_name, passport_id, action_type, payload)
  values (
    v_session.role,
    v_session.operator_name,
    p_passport_id,
    'upload_photo',
    p_photo
  );

  return jsonb_build_object('ok', true);
end;
$$;
