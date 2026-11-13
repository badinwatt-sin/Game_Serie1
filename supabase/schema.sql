-- กระดานคะแนนสดของ Game Serie 1 (ไม่บังคับ) — รันครั้งเดียวใน Supabase SQL Editor
create table if not exists public.gs_scores (
  room text not null check (char_length(room) = 5),
  pid text not null check (char_length(pid) <= 40),
  name text not null check (char_length(name) <= 24),
  avatar text check (char_length(avatar) <= 16),
  team smallint check (team between 0 and 11),
  game text not null check (char_length(game) <= 16),
  score integer not null check (score between 0 and 5000),
  updated_at timestamptz not null default now(),
  primary key (room, pid, game)
);
alter table public.gs_scores enable row level security;

-- เกมปาร์ตี้ไม่มีระบบล็อกอิน: ใครมี publishable key ก็อ่าน/ส่งคะแนนได้
-- (เหมาะกับกิจกรรมสนุก ๆ ไม่เหมาะกับการแข่งขันชิงรางวัลมูลค่าสูง)
create policy "gs read" on public.gs_scores for select to anon using (true);
create policy "gs insert" on public.gs_scores for insert to anon with check (true);
create policy "gs update" on public.gs_scores for update to anon using (true) with check (true);

-- ล้างข้อมูลหลังจบงาน:  delete from public.gs_scores where room = 'ABCD4';

-- ---------- โพล / แบบสำรวจ ----------
create table if not exists public.gs_polls (
  id text primary key check (char_length(id) <= 40),
  room text not null check (char_length(room) = 5),
  q text not null check (char_length(q) between 1 and 200),
  type text not null check (type in ('choice', 'rating', 'text')),
  options jsonb not null default '[]',
  open boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists gs_polls_room on public.gs_polls (room);

create table if not exists public.gs_votes (
  poll_id text not null references public.gs_polls (id) on delete cascade,
  room text not null check (char_length(room) = 5),
  pid text not null check (char_length(pid) <= 40),
  answer text not null check (char_length(answer) between 1 and 80),
  created_at timestamptz not null default now(),
  primary key (poll_id, pid)
);
create index if not exists gs_votes_room on public.gs_votes (room);

alter table public.gs_polls enable row level security;
alter table public.gs_votes enable row level security;
create policy "gs polls read" on public.gs_polls for select to anon using (true);
create policy "gs polls insert" on public.gs_polls for insert to anon with check (true);
create policy "gs polls update" on public.gs_polls for update to anon using (true) with check (true);
create policy "gs polls delete" on public.gs_polls for delete to anon using (true);
create policy "gs votes read" on public.gs_votes for select to anon using (true);
create policy "gs votes insert" on public.gs_votes for insert to anon with check (true);
create policy "gs votes update" on public.gs_votes for update to anon using (true) with check (true);

-- สิทธิ์ของ key สาธารณะ (บางโปรเจกต์ไม่ได้ให้สิทธิ์ anon อัตโนมัติ จึงระบุให้ชัด)
grant select, insert, update on public.gs_scores, public.gs_votes to anon;
grant select, insert, update, delete on public.gs_polls to anon;
