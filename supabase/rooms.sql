-- ห้องกิจกรรมที่ผู้สอนควบคุม + ทะเบียนผู้เล่น (อีโมจิห้ามซ้ำในห้อง)
-- รันหลัง schema.sql และ admin.sql

create table if not exists public.gs_rooms (
  code text primary key check (char_length(code) = 5),
  name text not null check (char_length(name) between 1 and 60),
  teams smallint not null default 0 check (teams between 0 and 12),
  -- state: { open: ["quiz", ...], msg: "ข้อความถึงผู้เล่น", board: true/false, bonus: [คะแนนโบนัสรายทีม] }
  state jsonb not null default '{}',
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.gs_players (
  room text not null check (char_length(room) = 5),
  pid text not null check (char_length(pid) <= 40),
  name text not null check (char_length(name) between 1 and 24),
  avatar text not null check (char_length(avatar) between 1 and 16),
  color text not null check (char_length(color) <= 9),
  style text check (char_length(style) <= 24),
  team smallint check (team between 0 and 11),
  active boolean not null default true,
  joined_at timestamptz not null default now(),
  primary key (room, pid)
);
create index if not exists gs_players_room on public.gs_players (room);

alter table public.gs_rooms enable row level security;
alter table public.gs_players enable row level security;
create policy "gs rooms read" on public.gs_rooms for select to anon using (true);
create policy "gs players read" on public.gs_players for select to anon using (true);
grant select on public.gs_rooms, public.gs_players to anon;

-- ผู้เล่นเข้าห้อง / แก้ตัวตน: คืน 'ok' | 'taken' (อีโมจิมีคนใช้แล้ว) | 'noroom'
create or replace function public.gs_join(room_code text, player jsonb) returns text
language plpgsql security definer set search_path = '' as $$
declare av text := player->>'avatar'; me text := player->>'pid';
begin
  perform pg_advisory_xact_lock(hashtext('gs:' || room_code));   -- กันสองคนกดอีโมจิเดียวกันพร้อมกัน
  if not exists (select 1 from public.gs_rooms r where r.code = room_code and not r.archived) then return 'noroom'; end if;
  if exists (select 1 from public.gs_players x where x.room = room_code and x.active and x.avatar = av and x.pid <> me)
     and (select count(distinct x.avatar) from public.gs_players x where x.room = room_code and x.active) < 150 then
    return 'taken';
  end if;
  insert into public.gs_players (room, pid, name, avatar, color, style, team)
  values (room_code, me, player->>'name', av, player->>'color', player->>'style', (player->>'team')::smallint)
  on conflict (room, pid) do update set name = excluded.name, avatar = excluded.avatar, color = excluded.color,
    style = excluded.style, team = excluded.team, active = true;
  return 'ok';
end $$;

-- งานของผู้สอน (ต้องแนบรหัสผ่าน)
create or replace function public.gs_room_save(p text, room jsonb) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.gs_admin_check(p) then raise exception 'unauthorized' using errcode = '42501'; end if;
  insert into public.gs_rooms (code, name, teams, state, archived)
  values (room->>'code', room->>'name', coalesce((room->>'teams')::smallint, 0), coalesce(room->'state', '{}'::jsonb), coalesce((room->>'archived')::boolean, false))
  on conflict (code) do update set name = excluded.name, state = excluded.state, archived = excluded.archived;
end $$;

create or replace function public.gs_player_active(p text, room_code text, player_id text, is_active boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.gs_admin_check(p) then raise exception 'unauthorized' using errcode = '42501'; end if;
  update public.gs_players set active = is_active where room = room_code and pid = player_id;
end $$;

grant execute on function public.gs_join(text, jsonb), public.gs_room_save(text, jsonb),
  public.gs_player_active(text, text, text, boolean) to anon;

-- ---------- รอบการแข่งที่ผู้สอนปล่อยพร้อมกัน ----------
-- done = false: คะแนนระหว่างเล่น (ใช้แสดงการแข่งสดบนหน้า Live), true: ส่งผลรอบนั้นแล้ว
alter table public.gs_scores add column if not exists done boolean not null default true;

-- เวลาเซิร์ฟเวอร์ (มิลลิวินาที) ให้ทุกเครื่องนับถอยหลังตรงกัน แม้นาฬิกาเครื่องจะไม่ตรง
create or replace function public.gs_now() returns bigint
language sql stable set search_path = '' as $$
  select (extract(epoch from clock_timestamp()) * 1000)::bigint
$$;
grant execute on function public.gs_now() to anon;
