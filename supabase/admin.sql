-- รหัสผ่านผู้จัด: ฐานข้อมูลเป็นผู้ตรวจ และงานของผู้จัด (สร้าง/ปิด/ลบโพล) ทำได้ผ่านฟังก์ชันเหล่านี้เท่านั้น
-- รันหลัง schema.sql  แล้วตั้งรหัสผ่านด้วยคำสั่งท้ายไฟล์ (อย่าเก็บรหัสผ่านจริงไว้ในไฟล์นี้)
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.gs_admin (
  id int primary key default 1 check (id = 1),
  pass_hash text not null
);
alter table public.gs_admin enable row level security;   -- ไม่มี policy = key สาธารณะอ่านไม่ได้
revoke all on public.gs_admin from anon, authenticated;

create or replace function public.gs_admin_check(p text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare ok boolean;
begin
  select a.pass_hash = extensions.crypt(p, a.pass_hash) into ok from public.gs_admin a where a.id = 1;
  if not coalesce(ok, false) then perform pg_sleep(0.5); end if;   -- หน่วงการเดารหัส
  return coalesce(ok, false);
end $$;

create or replace function public.gs_poll_save(p text, poll jsonb) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.gs_admin_check(p) then raise exception 'unauthorized' using errcode = '42501'; end if;
  insert into public.gs_polls (id, room, q, type, options, open)
  values (poll->>'id', poll->>'room', poll->>'q', poll->>'type', coalesce(poll->'options', '[]'::jsonb), coalesce((poll->>'open')::boolean, true))
  on conflict (id) do update set q = excluded.q, type = excluded.type, options = excluded.options, open = excluded.open;
end $$;

create or replace function public.gs_poll_set_open(p text, poll_id text, is_open boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.gs_admin_check(p) then raise exception 'unauthorized' using errcode = '42501'; end if;
  update public.gs_polls set open = is_open where id = poll_id;
end $$;

create or replace function public.gs_poll_delete(p text, poll_id text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.gs_admin_check(p) then raise exception 'unauthorized' using errcode = '42501'; end if;
  delete from public.gs_polls where id = poll_id;
end $$;

revoke execute on function public.gs_admin_check(text), public.gs_poll_save(text, jsonb),
  public.gs_poll_set_open(text, text, boolean), public.gs_poll_delete(text, text) from public;
grant execute on function public.gs_admin_check(text), public.gs_poll_save(text, jsonb),
  public.gs_poll_set_open(text, text, boolean), public.gs_poll_delete(text, text) to anon;

-- ผู้เล่น (key สาธารณะ) อ่านโพลได้อย่างเดียว แก้ไขตรง ๆ ไม่ได้อีกต่อไป
revoke insert, update, delete on public.gs_polls from anon;

-- ตั้งหรือเปลี่ยนรหัสผ่านผู้จัด (รันใน SQL Editor โดยแทน รหัสผ่านใหม่):
-- insert into public.gs_admin (id, pass_hash) values (1, extensions.crypt('รหัสผ่านใหม่', extensions.gen_salt('bf', 10)))
--   on conflict (id) do update set pass_hash = excluded.pass_hash;
