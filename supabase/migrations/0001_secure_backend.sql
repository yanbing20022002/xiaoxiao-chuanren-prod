create extension if not exists pgcrypto;

create or replace function public.normalize_phone(input text)
returns text
language sql
immutable
as $$
  select right(regexp_replace(coalesce(input, ''), '\D', '', 'g'), 11);
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.staff_accounts (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('npc', 'photographer', 'admin')),
  operator_name text not null,
  pin_hash text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists staff_accounts_role_idx on public.staff_accounts(role);

create table if not exists public.staff_sessions (
  id uuid primary key default gen_random_uuid(),
  staff_account_id uuid not null references public.staff_accounts(id) on delete cascade,
  role text not null check (role in ('npc', 'photographer', 'admin')),
  operator_name text not null,
  session_token uuid not null unique default gen_random_uuid(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index if not exists staff_sessions_token_idx on public.staff_sessions(session_token);

create table if not exists public.families (
  id text primary key,
  family_label text not null,
  contact_name text not null,
  contact_phone text not null unique,
  note text not null default '',
  imported_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.passports (
  passport_id text primary key,
  roster_family_id text not null unique references public.families(id) on delete cascade,
  family_label text not null default '',
  contact_name text not null default '',
  contact_phone text not null default '',
  child_name text not null default '',
  family_name text not null default '',
  custom_motto text not null default '',
  avatar_style text not null default '汉服青衣',
  activated boolean not null default false,
  score_history jsonb not null default '{}'::jsonb,
  npc_lit_levels text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.passport_photos (
  id text primary key,
  passport_id text not null references public.passports(passport_id) on delete cascade,
  image_url text not null,
  caption text not null,
  location text not null,
  timestamp_text text not null,
  ai_motto text,
  saved_to_poster boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists passport_photos_passport_idx on public.passport_photos(passport_id, created_at desc);

create table if not exists public.frontdesk_checkins (
  id text primary key,
  roster_family_id text not null references public.families(id) on delete cascade,
  family_label text not null,
  contact_name text not null,
  contact_phone text not null,
  passport_id text not null default '',
  status text not null check (status in ('verified', 'resumed')),
  message text not null,
  checked_in_at timestamptz not null default now()
);

create index if not exists frontdesk_checkins_family_idx on public.frontdesk_checkins(roster_family_id, checked_in_at desc);

create table if not exists public.staff_action_logs (
  id uuid primary key default gen_random_uuid(),
  staff_role text not null,
  operator_name text not null,
  passport_id text,
  action_type text not null check (action_type in ('score_level', 'upload_photo', 'import_roster')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

drop trigger if exists set_families_updated_at on public.families;
create trigger set_families_updated_at
before update on public.families
for each row
execute function public.set_updated_at();

drop trigger if exists set_passports_updated_at on public.passports;
create trigger set_passports_updated_at
before update on public.passports
for each row
execute function public.set_updated_at();

alter table public.staff_accounts enable row level security;
alter table public.staff_sessions enable row level security;
alter table public.families enable row level security;
alter table public.passports enable row level security;
alter table public.passport_photos enable row level security;
alter table public.frontdesk_checkins enable row level security;
alter table public.staff_action_logs enable row level security;

create or replace function public.get_active_staff_session(p_session_token uuid, p_role text default null)
returns table (
  staff_account_id uuid,
  role text,
  operator_name text,
  expires_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    s.staff_account_id,
    s.role,
    s.operator_name,
    s.expires_at
  from public.staff_sessions s
  join public.staff_accounts a on a.id = s.staff_account_id
  where s.session_token = p_session_token
    and s.revoked_at is null
    and s.expires_at > now()
    and a.is_active is true
    and (p_role is null or s.role = p_role or s.role = 'admin')
  limit 1;
$$;

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
    and pin_hash = crypt(trim(coalesce(p_pin, '')), pin_hash)
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

create or replace function public.validate_staff_session(p_session_token uuid, p_role text default null)
returns jsonb
language sql
security definer
set search_path = public
as $$
  with active_session as (
    select * from public.get_active_staff_session(p_session_token, p_role)
  )
  select case
    when exists(select 1 from active_session) then
      (
        select jsonb_build_object(
          'ok', true,
          'role', role,
          'operator_name', operator_name,
          'expires_at', extract(epoch from expires_at) * 1000
        )
        from active_session
        limit 1
      )
    else jsonb_build_object('ok', false, 'message', '工作人员会话已失效，请重新登录。')
  end;
$$;

create or replace function public.logout_staff(p_session_token uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.staff_sessions
  set revoked_at = now()
  where session_token = p_session_token
    and revoked_at is null;

  return true;
end;
$$;

create or replace function public.import_family_roster(p_session_token uuid, p_records jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session record;
  v_count integer := 0;
begin
  select * into v_session from public.get_active_staff_session(p_session_token, 'npc') limit 1;
  if not found then
    return jsonb_build_object('ok', false, 'message', '当前工作人员会话无效，不能导入名单。');
  end if;

  insert into public.families (id, family_label, contact_name, contact_phone, note, imported_at)
  select
    rec.id,
    rec.family_label,
    rec.contact_name,
    public.normalize_phone(rec.contact_phone),
    coalesce(rec.note, ''),
    coalesce(nullif(rec.imported_at, '')::timestamptz, now())
  from jsonb_to_recordset(p_records) as rec(
    id text,
    family_label text,
    contact_name text,
    contact_phone text,
    note text,
    imported_at text
  )
  on conflict (id) do update
  set
    family_label = excluded.family_label,
    contact_name = excluded.contact_name,
    contact_phone = excluded.contact_phone,
    note = excluded.note,
    imported_at = excluded.imported_at,
    updated_at = now();

  get diagnostics v_count = row_count;

  insert into public.staff_action_logs (staff_role, operator_name, action_type, payload)
  values (
    v_session.role,
    v_session.operator_name,
    'import_roster',
    jsonb_build_object('count', v_count)
  );

  return jsonb_build_object('ok', true, 'count', v_count);
end;
$$;

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

  v_log_id := 'checkin-' || encode(gen_random_bytes(8), 'hex');

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

create or replace function public.upsert_customer_passport(
  p_roster_family_id text,
  p_contact_phone text,
  p_passport_id text,
  p_child_name text,
  p_family_name text,
  p_custom_motto text,
  p_avatar_style text,
  p_activated boolean,
  p_score_history jsonb,
  p_npc_lit_levels text[]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_family public.families;
  v_passport public.passports;
begin
  select *
  into v_family
  from public.families
  where id = p_roster_family_id
    and contact_phone = public.normalize_phone(p_contact_phone)
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'message', '家庭验团会话无效，请重新核验手机号。');
  end if;

  insert into public.passports (
    passport_id,
    roster_family_id,
    family_label,
    contact_name,
    contact_phone,
    child_name,
    family_name,
    custom_motto,
    avatar_style,
    activated,
    score_history,
    npc_lit_levels
  ) values (
    p_passport_id,
    v_family.id,
    v_family.family_label,
    v_family.contact_name,
    v_family.contact_phone,
    coalesce(p_child_name, ''),
    coalesce(p_family_name, ''),
    coalesce(p_custom_motto, ''),
    coalesce(nullif(p_avatar_style, ''), '汉服青衣'),
    coalesce(p_activated, false),
    coalesce(p_score_history, '{}'::jsonb),
    coalesce(p_npc_lit_levels, '{}'::text[])
  )
  on conflict (passport_id) do update
  set
    family_label = excluded.family_label,
    contact_name = excluded.contact_name,
    contact_phone = excluded.contact_phone,
    child_name = excluded.child_name,
    family_name = excluded.family_name,
    custom_motto = excluded.custom_motto,
    avatar_style = excluded.avatar_style,
    activated = excluded.activated,
    score_history = excluded.score_history,
    npc_lit_levels = excluded.npc_lit_levels,
    updated_at = now()
  returning * into v_passport;

  return jsonb_build_object('ok', true, 'passport', to_jsonb(v_passport));
end;
$$;

create or replace function public.get_customer_passport_state(p_passport_id text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  with target_passport as (
    select * from public.passports where passport_id = p_passport_id limit 1
  ),
  target_photos as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', id,
          'imageUrl', image_url,
          'caption', caption,
          'location', location,
          'timestamp', timestamp_text,
          'aiMotto', ai_motto,
          'savedToPoster', saved_to_poster
        )
        order by created_at desc
      ),
      '[]'::jsonb
    ) as photos
    from public.passport_photos
    where passport_id = p_passport_id
  )
  select case
    when exists(select 1 from target_passport) then
      jsonb_build_object(
        'ok', true,
        'passport', (select to_jsonb(target_passport) from target_passport),
        'photos', (select photos from target_photos)
      )
    else jsonb_build_object('ok', false, 'message', '未找到该传人档案。')
  end;
$$;

create or replace function public.get_staff_dashboard_snapshot(p_session_token uuid, p_role text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session record;
begin
  select * into v_session from public.get_active_staff_session(p_session_token, p_role) limit 1;
  if not found then
    return jsonb_build_object('ok', false, 'message', '工作人员会话已失效。');
  end if;

  return jsonb_build_object(
    'ok', true,
    'family_roster',
    (
      select coalesce(jsonb_agg(to_jsonb(f) order by f.imported_at desc), '[]'::jsonb)
      from public.families f
    ),
    'frontdesk_checkins',
    (
      select coalesce(jsonb_agg(to_jsonb(c) order by c.checked_in_at desc), '[]'::jsonb)
      from public.frontdesk_checkins c
      limit 100
    ),
    'recent_passports',
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'passport', to_jsonb(p),
            'photos', coalesce(
              (
                select jsonb_agg(
                  jsonb_build_object(
                    'id', ph.id,
                    'imageUrl', ph.image_url,
                    'caption', ph.caption,
                    'location', ph.location,
                    'timestamp', ph.timestamp_text,
                    'aiMotto', ph.ai_motto,
                    'savedToPoster', ph.saved_to_poster
                  )
                  order by ph.created_at desc
                )
                from public.passport_photos ph
                where ph.passport_id = p.passport_id
              ),
              '[]'::jsonb
            ),
            'updatedAt', extract(epoch from p.updated_at) * 1000
          )
          order by p.updated_at desc
        ),
        '[]'::jsonb
      )
      from (
        select * from public.passports order by updated_at desc limit 12
      ) p
    )
  );
end;
$$;

create or replace function public.get_staff_passport_state(p_session_token uuid, p_role text, p_passport_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session record;
  v_payload jsonb;
begin
  select * into v_session from public.get_active_staff_session(p_session_token, p_role) limit 1;
  if not found then
    return jsonb_build_object('ok', false, 'message', '工作人员会话已失效。');
  end if;

  select public.get_customer_passport_state(p_passport_id) into v_payload;
  return v_payload;
end;
$$;

create or replace function public.award_passport_level(
  p_session_token uuid,
  p_passport_id text,
  p_level_id text,
  p_stars integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session record;
  v_passport public.passports;
begin
  select * into v_session from public.get_active_staff_session(p_session_token, 'npc') limit 1;
  if not found then
    return jsonb_build_object('ok', false, 'message', '工作人员会话已失效。');
  end if;

  update public.passports
  set
    score_history = coalesce(score_history, '{}'::jsonb) || jsonb_build_object(p_level_id, greatest(0, least(p_stars, 5))),
    npc_lit_levels = (
      select array_agg(distinct level_item order by level_item)
      from unnest(array_append(coalesce(npc_lit_levels, '{}'::text[]), p_level_id)) as level_item
    ),
    updated_at = now()
  where passport_id = p_passport_id
  returning * into v_passport;

  if not found then
    return jsonb_build_object('ok', false, 'message', '未找到该传人档案。');
  end if;

  insert into public.staff_action_logs (staff_role, operator_name, passport_id, action_type, payload)
  values (
    v_session.role,
    v_session.operator_name,
    p_passport_id,
    'score_level',
    jsonb_build_object('level_id', p_level_id, 'stars', p_stars)
  );

  return jsonb_build_object('ok', true, 'passport', to_jsonb(v_passport));
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
    coalesce(p_photo->>'id', 'photo-' || encode(gen_random_bytes(8), 'hex')),
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

grant execute on function public.login_staff(text, text, text) to anon, authenticated;
grant execute on function public.validate_staff_session(uuid, text) to anon, authenticated;
grant execute on function public.logout_staff(uuid) to anon, authenticated;
grant execute on function public.import_family_roster(uuid, jsonb) to anon, authenticated;
grant execute on function public.check_in_family(text) to anon, authenticated;
grant execute on function public.upsert_customer_passport(text, text, text, text, text, text, text, boolean, jsonb, text[]) to anon, authenticated;
grant execute on function public.get_customer_passport_state(text) to anon, authenticated;
grant execute on function public.get_staff_dashboard_snapshot(uuid, text) to anon, authenticated;
grant execute on function public.get_staff_passport_state(uuid, text, text) to anon, authenticated;
grant execute on function public.award_passport_level(uuid, text, text, integer) to anon, authenticated;
grant execute on function public.upload_passport_photo(uuid, text, jsonb) to anon, authenticated;

insert into public.staff_accounts (role, operator_name, pin_hash)
values
  ('npc', '默认 NPC', crypt('9527', gen_salt('bf'))),
  ('photographer', '默认摄影师', crypt('6688', gen_salt('bf')))
on conflict (role) do update
set
  operator_name = excluded.operator_name,
  pin_hash = excluded.pin_hash,
  is_active = true;
