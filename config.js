// การเชื่อมต่อกระดานคะแนนสดและโพล (Supabase)
// key นี้เป็น publishable key ที่ออกแบบให้อยู่ในหน้าเว็บได้ สิทธิ์ถูกจำกัดด้วย RLS ให้ใช้ได้เฉพาะตาราง gs_*
// เว้นว่างทั้งสองค่าเพื่อปิดโหมดสด (เกมยังเล่นได้ คะแนนเก็บในเครื่องผู้เล่น) — ดู docs/SETUP.md
window.GS_CONFIG = {
  supabaseUrl: 'https://lrqwtmejmevkbuwsofww.supabase.co',
  supabaseKey: 'sb_publishable_-h42aX6dpNFVkwt48tJZYA_EQmoOwDp'
};
