-- Recruit Hub — ฐานข้อมูลเครื่องมือสรรหาตัวแทนใหม่ (Passive Candidate Sourcing)
-- รันครั้งเดียวใน Supabase SQL Editor แล้วสร้างผู้ดูแลคนแรกด้วยคำสั่งท้ายไฟล์
--
-- หลักความปลอดภัย: ข้อมูลผู้สมัครเป็นข้อมูลส่วนบุคคล ตารางทุกตารางปิด RLS แบบไม่มี policy
-- key สาธารณะจึงอ่าน/เขียนตารางตรง ๆ ไม่ได้เลย ทุกอย่างผ่านฟังก์ชันด้านล่างซึ่งตรวจสิทธิ์จาก session token
create extension if not exists pgcrypto with schema extensions;

-- ---------- ตาราง ----------
create table if not exists public.rc_users (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('admin', 'manager')),
  code text not null unique check (code ~ '^[A-Z0-9]{3,12}$'),      -- รหัสเข้าระบบ และรหัสแนะนำ (ref) ของผู้จัดการ
  name text not null check (char_length(name) between 1 and 80),
  phone text check (char_length(phone) <= 20),
  email text check (char_length(email) <= 120),
  line_id text check (char_length(line_id) <= 60),
  provinces jsonb not null default '[]',                           -- จังหวัดที่ดูแล
  styles jsonb not null default '[]',                              -- แนวทางการขายของทีม
  rating numeric(2,1) not null default 3 check (rating between 0 and 5),
  capacity smallint not null default 10 check (capacity between 0 and 500),  -- จำนวนลีดที่ถือพร้อมกันได้
  in_campaign boolean not null default true,                       -- เข้าร่วมแคมเปญรับลีด
  validated boolean not null default true,                         -- ผลงานผ่านเงื่อนไขแคมเปญ
  active boolean not null default true,
  pass_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.rc_sessions (
  token_hash text primary key,
  user_id uuid not null references public.rc_users (id) on delete cascade,
  expires_at timestamptz not null
);

create table if not exists public.rc_campaigns (
  id text primary key check (id ~ '^[a-z0-9-]{2,24}$'),
  name text not null check (char_length(name) between 1 and 80),
  message text check (char_length(message) <= 300),
  starts_on date,
  ends_on date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.rc_candidates (
  id uuid primary key default gen_random_uuid(),
  track_code text not null unique,
  name text not null check (char_length(name) between 2 and 80),
  phone text not null check (phone ~ '^0[0-9]{8,9}$'),
  email text check (char_length(email) <= 120),
  line_id text check (char_length(line_id) <= 60),
  age_range text check (char_length(age_range) <= 12),
  occupation text check (char_length(occupation) <= 80),
  province text check (char_length(province) <= 40),
  style text check (char_length(style) <= 20),
  work_mode text check (char_length(work_mode) <= 12),
  expectation text check (char_length(expectation) <= 500),
  ref_code text check (char_length(ref_code) <= 12),
  source text not null default 'direct' check (char_length(source) <= 24),
  campaign text check (char_length(campaign) <= 24),
  scores jsonb not null default '{}',                              -- { attitude, skill, expectation, total } เป็น %
  grade text not null default 'C' check (grade in ('A', 'B', 'C')),
  stage text not null default 'new' check (stage in
    ('new', 'qualified', 'assigned', 'contacted', 'interview', 'applied', 'agent', 'rejected', 'escalated')),
  reached smallint not null default 0,                             -- ขั้นสูงสุดที่เคยไปถึง (ใช้ทำ funnel)
  manager_id uuid references public.rc_users (id) on delete set null,
  queue jsonb not null default '[]',                               -- ลำดับผู้จัดการ [ลำดับ 1, ลำดับ 2]
  queue_pos smallint not null default 0,
  assigned_at timestamptz,
  first_assigned_at timestamptz,
  contacted_at timestamptz,
  appt_at timestamptz,
  reject_reason text check (char_length(reject_reason) <= 200),
  consent_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists rc_candidates_manager on public.rc_candidates (manager_id);
create index if not exists rc_candidates_phone on public.rc_candidates (phone);

create table if not exists public.rc_activities (
  id bigint generated always as identity primary key,
  candidate_id uuid not null references public.rc_candidates (id) on delete cascade,
  at timestamptz not null default now(),
  actor text not null,
  type text not null,
  note text check (char_length(note) <= 500)
);
create index if not exists rc_activities_cand on public.rc_activities (candidate_id);

create table if not exists public.rc_events (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  type text not null check (type in ('visit', 'prescreen_start', 'prescreen_done', 'register_open')),
  source text not null default 'direct',
  campaign text,
  ref text
);
create index if not exists rc_events_at on public.rc_events (at);

alter table public.rc_users enable row level security;
alter table public.rc_sessions enable row level security;
alter table public.rc_campaigns enable row level security;
alter table public.rc_candidates enable row level security;
alter table public.rc_activities enable row level security;
alter table public.rc_events enable row level security;
revoke all on public.rc_users, public.rc_sessions, public.rc_campaigns, public.rc_candidates,
  public.rc_activities, public.rc_events from anon, authenticated;

-- ---------- ฟังก์ชันภายใน (key สาธารณะเรียกไม่ได้) ----------
create or replace function public.rc_auth(tok text) returns public.rc_users
language plpgsql security definer set search_path = '' as $$
declare u public.rc_users;
begin
  select x.* into u from public.rc_sessions s join public.rc_users x on x.id = s.user_id
  where s.token_hash = encode(extensions.digest(coalesce(tok, ''), 'sha256'), 'hex') and s.expires_at > now() and x.active;
  if u.id is null then raise exception 'unauthorized' using errcode = '42501'; end if;
  return u;
end $$;

create or replace function public.rc_stage_rank(s text) returns smallint
language sql immutable set search_path = '' as $$
  select (case s when 'qualified' then 1 when 'assigned' then 2 when 'contacted' then 3
    when 'interview' then 4 when 'applied' then 5 when 'agent' then 6 else 0 end)::smallint
$$;

-- ส่งลีดไปยังผู้จัดการลำดับถัดไป ถ้าไม่มีแล้ว → escalated (บริษัทติดต่อผู้สมัครเอง)
create or replace function public.rc_next_manager(cid uuid, actor text, why text) returns void
language plpgsql security definer set search_path = '' as $$
declare c public.rc_candidates; nxt uuid;
begin
  select * into c from public.rc_candidates where id = cid for update;
  if c.queue_pos + 1 < jsonb_array_length(c.queue) then
    nxt := (c.queue ->> (c.queue_pos + 1))::uuid;
    if not exists (select 1 from public.rc_users u where u.id = nxt and u.active) then nxt := null; end if;
  end if;
  if nxt is not null then
    update public.rc_candidates set manager_id = nxt, queue_pos = c.queue_pos + 1, stage = 'assigned',
      assigned_at = now(), contacted_at = null, updated_at = now() where id = cid;
    insert into public.rc_activities (candidate_id, actor, type, note)
    values (cid, actor, 'reassign', why || ' → ส่งต่อผู้จัดการลำดับถัดไป: ' || (select u.name from public.rc_users u where u.id = nxt));
  else
    update public.rc_candidates set manager_id = null, stage = 'escalated', updated_at = now() where id = cid;
    insert into public.rc_activities (candidate_id, actor, type, note)
    values (cid, actor, 'escalate', why || ' → ส่งกลับให้บริษัทติดต่อผู้สมัครโดยตรง');
  end if;
end $$;

-- SLA: ผู้จัดการต้องติดต่อภายใน 5 วัน ไม่เช่นนั้นระบบส่งต่อเอง (เรียกทุกครั้งที่มีคนเปิด Portal)
create or replace function public.rc_sweep() returns void
language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  for r in select id from public.rc_candidates where stage = 'assigned' and assigned_at < now() - interval '5 days' loop
    perform public.rc_next_manager(r.id, 'ระบบ', 'ไม่มีการติดต่อภายใน 5 วัน');
  end loop;
  delete from public.rc_sessions where expires_at < now();
end $$;

-- ---------- ฝั่งผู้สมัคร (ไม่ต้องล็อกอิน) ----------
create or replace function public.rc_track(ev jsonb) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.rc_events where at > now() - interval '1 minute') > 600 then return; end if;
  insert into public.rc_events (type, source, campaign, ref)
  values (ev->>'type', left(coalesce(nullif(ev->>'source', ''), 'direct'), 24), left(nullif(ev->>'campaign', ''), 24), left(nullif(ev->>'ref', ''), 12));
exception when check_violation then null;
end $$;

-- ข้อมูลที่หน้า Landing ใช้: ชื่อผู้แนะนำ (จาก ref) และข้อความแคมเปญ
create or replace function public.rc_public(ref text, camp text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'ref_name', (select u.name from public.rc_users u where u.code = upper(ref) and u.active and u.role = 'manager'),
    'campaign', (select jsonb_build_object('id', c.id, 'name', c.name, 'message', c.message) from public.rc_campaigns c
                 where c.id = camp and c.active and (c.ends_on is null or c.ends_on >= current_date)))
$$;

create or replace function public.rc_register(c jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare ph text := regexp_replace(coalesce(c->>'phone', ''), '[^0-9]', '', 'g');
  code text; cid uuid; total int; g text; ref text := upper(nullif(c->>'ref_code', ''));
  sc jsonb := coalesce(c->'scores', '{}'::jsonb);
begin
  if coalesce((c->>'consent')::boolean, false) is not true then raise exception 'consent_required'; end if;
  if ph !~ '^0[0-9]{8,9}$' then raise exception 'bad_phone'; end if;
  if char_length(trim(coalesce(c->>'name', ''))) < 2 then raise exception 'bad_name'; end if;
  if (select count(*) from public.rc_candidates where created_at > now() - interval '1 hour') > 300 then raise exception 'busy'; end if;

  -- เบอร์เดิมที่ยังอยู่ในกระบวนการ: ไม่สร้างซ้ำ
  select x.track_code into code from public.rc_candidates x
  where x.phone = ph and x.stage <> 'rejected' and x.created_at > now() - interval '90 days' limit 1;
  if code is not null then return jsonb_build_object('track_code', code, 'dup', true); end if;

  -- คะแนนคำนวณใหม่ฝั่งเซิร์ฟเวอร์จากคะแนนรายด้าน (0–100) และตัดเกรดที่นี่ที่เดียว
  sc := jsonb_build_object(
    'attitude', least(100, greatest(0, coalesce((sc->>'attitude')::int, 0))),
    'skill', least(100, greatest(0, coalesce((sc->>'skill')::int, 0))),
    'expectation', least(100, greatest(0, coalesce((sc->>'expectation')::int, 0))));
  total := round(((sc->>'attitude')::int * 0.4 + (sc->>'skill')::int * 0.35 + (sc->>'expectation')::int * 0.25));
  sc := sc || jsonb_build_object('total', total);
  g := case when c->>'age_range' = 'u20' then 'C' when total >= 75 then 'A' when total >= 55 then 'B' else 'C' end;
  if ref is not null and not exists (select 1 from public.rc_users u where u.code = ref and u.active) then ref := null; end if;

  loop
    code := upper(substr(translate(encode(extensions.gen_random_bytes(8), 'base64'), '+/=0O1Il', ''), 1, 6));
    exit when char_length(code) = 6 and not exists (select 1 from public.rc_candidates x where x.track_code = code);
  end loop;

  insert into public.rc_candidates (track_code, name, phone, email, line_id, age_range, occupation, province, style,
    work_mode, expectation, ref_code, source, campaign, scores, grade, consent_at)
  values (code, trim(c->>'name'), ph, nullif(trim(c->>'email'), ''), nullif(trim(c->>'line_id'), ''), c->>'age_range',
    nullif(trim(c->>'occupation'), ''), c->>'province', c->>'style', c->>'work_mode', nullif(trim(c->>'expectation'), ''),
    ref, left(coalesce(nullif(c->>'source', ''), 'direct'), 24), left(nullif(c->>'campaign', ''), 24), sc, g, now())
  returning id into cid;
  insert into public.rc_activities (candidate_id, actor, type, note) values (cid, 'ผู้สมัคร', 'register', 'ลงทะเบียนผ่านหน้า Landing');
  return jsonb_build_object('track_code', code, 'dup', false);
end $$;

-- ผู้สมัครตรวจสถานะ: ต้องมีทั้งรหัสติดตามและเบอร์ 4 ตัวท้าย
create or replace function public.rc_status(p_code text, phone4 text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r jsonb;
begin
  select jsonb_build_object('name', split_part(c.name, ' ', 1), 'stage', c.stage, 'created_at', c.created_at,
    'manager', (select u.name from public.rc_users u where u.id = c.manager_id)) into r
  from public.rc_candidates c where c.track_code = upper(trim(p_code)) and right(c.phone, 4) = phone4;
  if r is null then perform pg_sleep(0.4); end if;
  return r;
end $$;

-- ---------- เข้าระบบ ----------
create or replace function public.rc_user_json(u public.rc_users) returns jsonb
language sql immutable set search_path = '' as $$ select to_jsonb(u) - 'pass_hash' $$;

create or replace function public.rc_login(p_code text, p_pass text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare u public.rc_users; tok text;
begin
  select * into u from public.rc_users x where x.code = upper(trim(p_code)) and x.active;
  if u.id is null or u.pass_hash <> extensions.crypt(p_pass, u.pass_hash) then
    perform pg_sleep(0.6);   -- หน่วงการเดารหัส
    raise exception 'bad_login' using errcode = '42501';
  end if;
  tok := encode(extensions.gen_random_bytes(24), 'hex');
  insert into public.rc_sessions (token_hash, user_id, expires_at)
  values (encode(extensions.digest(tok, 'sha256'), 'hex'), u.id, now() + interval '14 days');
  return jsonb_build_object('token', tok, 'user', public.rc_user_json(u));
end $$;

create or replace function public.rc_logout(tok text) returns void
language sql security definer set search_path = '' as $$
  delete from public.rc_sessions where token_hash = encode(extensions.digest(coalesce(tok, ''), 'sha256'), 'hex')
$$;

create or replace function public.rc_set_password(tok text, old_pass text, new_pass text) returns void
language plpgsql security definer set search_path = '' as $$
declare u public.rc_users := public.rc_auth(tok);
begin
  if u.pass_hash <> extensions.crypt(old_pass, u.pass_hash) then raise exception 'bad_login' using errcode = '42501'; end if;
  if char_length(new_pass) < 8 then raise exception 'weak_password'; end if;
  update public.rc_users set pass_hash = extensions.crypt(new_pass, extensions.gen_salt('bf', 10)) where id = u.id;
end $$;

-- ---------- โหลดข้อมูลตามบทบาท ----------
-- admin เห็นทั้งหมด · manager เห็นเฉพาะลีดที่ตัวเองถืออยู่
create or replace function public.rc_load(tok text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare u public.rc_users := public.rc_auth(tok); adm boolean;
begin
  perform public.rc_sweep();
  adm := u.role = 'admin';
  return jsonb_build_object(
    'me', public.rc_user_json(u),
    'candidates', coalesce((select jsonb_agg(to_jsonb(c) order by c.created_at desc) from public.rc_candidates c
                            where adm or c.manager_id = u.id), '[]'::jsonb),
    'users', coalesce((select jsonb_agg(public.rc_user_json(x) order by x.name) from public.rc_users x
                       where adm or x.id = u.id), '[]'::jsonb),
    'campaigns', coalesce((select jsonb_agg(to_jsonb(k) order by k.created_at desc) from public.rc_campaigns k
                           where adm or k.active), '[]'::jsonb),
    'activities', coalesce((select jsonb_agg(to_jsonb(a) order by a.at desc) from
                            (select a.* from public.rc_activities a join public.rc_candidates c on c.id = a.candidate_id
                             where adm or c.manager_id = u.id order by a.at desc limit 3000) a), '[]'::jsonb),
    'events', case when adm then coalesce((select jsonb_agg(to_jsonb(e)) from
                (select type, source, campaign, (at at time zone 'Asia/Bangkok')::date as day, count(*)::int as n
                 from public.rc_events where at > now() - interval '370 days' group by 1, 2, 3, 4) e), '[]'::jsonb)
              else '[]'::jsonb end);
end $$;

-- ---------- การทำงานกับลีด ----------
-- admin: qualify, reject, assign, reopen, agent, note และทุก action ของ manager
-- manager (เฉพาะลีดของตัวเอง): contacted, interview, applied, decline, note
create or replace function public.rc_action(tok text, cid uuid, action text, data jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare u public.rc_users := public.rc_auth(tok); c public.rc_candidates;
  adm boolean; note text := left(nullif(trim(coalesce(data->>'note', '')), ''), 500); q jsonb; first uuid;
begin
  adm := u.role = 'admin';
  select * into c from public.rc_candidates where id = cid for update;
  if c.id is null or (not adm and c.manager_id is distinct from u.id) then raise exception 'unauthorized' using errcode = '42501'; end if;
  if not adm and action not in ('contacted', 'interview', 'applied', 'decline', 'note') then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  if action = 'qualify' then
    update public.rc_candidates set stage = 'qualified', reject_reason = null where id = cid;
  elsif action = 'reject' then
    update public.rc_candidates set stage = 'rejected', manager_id = null, reject_reason = left(data->>'reason', 200) where id = cid;
    note := concat_ws(' — ', data->>'reason', note);
  elsif action = 'reopen' then
    update public.rc_candidates set stage = 'new', manager_id = null, reject_reason = null where id = cid;
  elsif action = 'assign' then
    q := coalesce(data->'queue', '[]'::jsonb);
    if jsonb_typeof(q) <> 'array' or jsonb_array_length(q) = 0 then raise exception 'empty_queue'; end if;
    first := (q->>0)::uuid;
    if not exists (select 1 from public.rc_users x where x.id = first and x.active and x.role = 'manager') then raise exception 'bad_manager'; end if;
    update public.rc_candidates set stage = 'assigned', manager_id = first, queue = q, queue_pos = 0,
      assigned_at = now(), first_assigned_at = coalesce(first_assigned_at, now()), contacted_at = null, reject_reason = null where id = cid;
    note := concat_ws(' — ', 'ส่งให้ ' || (select x.name from public.rc_users x where x.id = first), note);
  elsif action = 'contacted' then
    update public.rc_candidates set stage = 'contacted', contacted_at = coalesce(contacted_at, now()) where id = cid;
  elsif action = 'interview' then
    update public.rc_candidates set stage = 'interview', contacted_at = coalesce(contacted_at, now()),
      appt_at = nullif(data->>'appt_at', '')::timestamptz where id = cid;
  elsif action = 'applied' then
    update public.rc_candidates set stage = 'applied', contacted_at = coalesce(contacted_at, now()) where id = cid;
  elsif action = 'agent' then
    update public.rc_candidates set stage = 'agent' where id = cid;
  elsif action = 'decline' then
    insert into public.rc_activities (candidate_id, actor, type, note)
    values (cid, u.name, 'decline', concat_ws(' — ', data->>'reason', note));
    if data->>'outcome' = 'not_fit' then
      update public.rc_candidates set stage = 'rejected', manager_id = null, reject_reason = left(data->>'reason', 200), updated_at = now() where id = cid;
    else
      perform public.rc_next_manager(cid, u.name, 'ผู้จัดการส่งคืนลีด');
    end if;
    return;
  elsif action <> 'note' then
    raise exception 'bad_action';
  end if;

  update public.rc_candidates x set reached = greatest(x.reached, public.rc_stage_rank(x.stage)), updated_at = now() where x.id = cid;
  insert into public.rc_activities (candidate_id, actor, type, note) values (cid, u.name, action, note);
end $$;

-- ---------- งานของ admin ----------
create or replace function public.rc_user_save(tok text, usr jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare u public.rc_users := public.rc_auth(tok); uid uuid := nullif(usr->>'id', '')::uuid; pw text := nullif(usr->>'password', '');
begin
  if u.role <> 'admin' then raise exception 'unauthorized' using errcode = '42501'; end if;
  if pw is not null and char_length(pw) < 8 then raise exception 'weak_password'; end if;
  if uid is null then
    if pw is null then raise exception 'weak_password'; end if;
    insert into public.rc_users (role, code, name, phone, email, line_id, provinces, styles, rating, capacity, in_campaign, validated, active, pass_hash)
    values (coalesce(usr->>'role', 'manager'), upper(usr->>'code'), usr->>'name', usr->>'phone', usr->>'email', usr->>'line_id',
      coalesce(usr->'provinces', '[]'::jsonb), coalesce(usr->'styles', '[]'::jsonb), coalesce((usr->>'rating')::numeric, 3),
      coalesce((usr->>'capacity')::smallint, 10), coalesce((usr->>'in_campaign')::boolean, true),
      coalesce((usr->>'validated')::boolean, true), coalesce((usr->>'active')::boolean, true),
      extensions.crypt(pw, extensions.gen_salt('bf', 10)))
    returning id into uid;
  else
    if uid = u.id and coalesce((usr->>'active')::boolean, true) is false then raise exception 'cannot_disable_self'; end if;
    update public.rc_users x set name = usr->>'name', phone = usr->>'phone', email = usr->>'email', line_id = usr->>'line_id',
      provinces = coalesce(usr->'provinces', x.provinces), styles = coalesce(usr->'styles', x.styles),
      rating = coalesce((usr->>'rating')::numeric, x.rating), capacity = coalesce((usr->>'capacity')::smallint, x.capacity),
      in_campaign = coalesce((usr->>'in_campaign')::boolean, x.in_campaign), validated = coalesce((usr->>'validated')::boolean, x.validated),
      active = coalesce((usr->>'active')::boolean, x.active),
      pass_hash = case when pw is null then x.pass_hash else extensions.crypt(pw, extensions.gen_salt('bf', 10)) end
    where x.id = uid;
    if pw is not null or coalesce((usr->>'active')::boolean, true) is false then
      delete from public.rc_sessions s where s.user_id = uid and uid <> u.id;
    end if;
  end if;
  return uid;
end $$;

create or replace function public.rc_campaign_save(tok text, camp jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare u public.rc_users := public.rc_auth(tok);
begin
  if u.role <> 'admin' then raise exception 'unauthorized' using errcode = '42501'; end if;
  insert into public.rc_campaigns (id, name, message, starts_on, ends_on, active)
  values (camp->>'id', camp->>'name', nullif(camp->>'message', ''), nullif(camp->>'starts_on', '')::date,
    nullif(camp->>'ends_on', '')::date, coalesce((camp->>'active')::boolean, true))
  on conflict (id) do update set name = excluded.name, message = excluded.message, starts_on = excluded.starts_on,
    ends_on = excluded.ends_on, active = excluded.active;
end $$;

-- ---------- สิทธิ์เรียกฟังก์ชัน ----------
revoke execute on function public.rc_auth(text), public.rc_next_manager(uuid, text, text), public.rc_sweep(),
  public.rc_user_json(public.rc_users), public.rc_stage_rank(text) from public, anon, authenticated;
revoke execute on function public.rc_track(jsonb), public.rc_public(text, text), public.rc_register(jsonb),
  public.rc_status(text, text), public.rc_login(text, text), public.rc_logout(text), public.rc_set_password(text, text, text),
  public.rc_load(text), public.rc_action(text, uuid, text, jsonb), public.rc_user_save(text, jsonb),
  public.rc_campaign_save(text, jsonb) from public;
grant execute on function public.rc_track(jsonb), public.rc_public(text, text), public.rc_register(jsonb),
  public.rc_status(text, text), public.rc_login(text, text), public.rc_logout(text), public.rc_set_password(text, text, text),
  public.rc_load(text), public.rc_action(text, uuid, text, jsonb), public.rc_user_save(text, jsonb),
  public.rc_campaign_save(text, jsonb) to anon;

-- ---------- สร้างผู้ดูแลคนแรก (แก้ชื่อและรหัสผ่านก่อนรัน อย่าเก็บรหัสผ่านจริงไว้ในไฟล์นี้) ----------
-- insert into public.rc_users (role, code, name, pass_hash)
-- values ('admin', 'ADMIN', 'Recruiting Admin', extensions.crypt('รหัสผ่านอย่างน้อย 8 ตัว', extensions.gen_salt('bf', 10)));
--
-- ล้างข้อมูลผู้สมัครตามนโยบายเก็บรักษาข้อมูล (ตัวอย่าง: เกิน 1 ปีและไม่ได้เป็นตัวแทน):
-- delete from public.rc_candidates where created_at < now() - interval '1 year' and stage <> 'agent';
