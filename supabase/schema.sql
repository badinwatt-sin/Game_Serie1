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
