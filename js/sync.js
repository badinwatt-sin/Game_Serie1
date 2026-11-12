// ซิงก์คะแนนขึ้นกระดานกลาง (ไม่บังคับ) ผ่าน Supabase REST
// ถ้าไม่ได้ตั้งค่าใน config.js ทุกฟังก์ชันจะข้ามไปเฉย ๆ
import { state, myScores } from './core.js';

const cfg = window.GS_CONFIG || {};
const base = (cfg.supabaseUrl || '').replace(/\/+$/, '');
export const enabled = !!(base && cfg.supabaseKey);
const headers = { apikey: cfg.supabaseKey, Authorization: `Bearer ${cfg.supabaseKey}`, 'Content-Type': 'application/json' };

// ส่งคะแนนดีที่สุดของทุกเกมในห้องปัจจุบัน (ส่งซ้ำได้ ปลอดภัย: upsert ตาม room+pid+game)
export async function pushScores() {
  if (!enabled || !state.room || !state.player) return false;
  const rows = Object.entries(myScores()).filter(([, s]) => s.best > 0).map(([game, s]) => ({
    room: state.room.code, pid: state.pid, name: state.player.name.slice(0, 24), avatar: state.player.avatar,
    team: state.player.team ?? null, game, score: s.best, updated_at: new Date().toISOString()
  }));
  if (!rows.length) return true;
  try {
    const res = await fetch(`${base}/rest/v1/gs_scores?on_conflict=room,pid,game`, {
      method: 'POST', headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(rows)
    });
    return res.ok;
  } catch { return false; }
}

// ดึงคะแนนทั้งห้อง → { players:[{pid,name,avatar,team,total,games}], error }
export async function fetchRoom(code) {
  if (!enabled) return { players: [], error: 'off' };
  try {
    const res = await fetch(`${base}/rest/v1/gs_scores?room=eq.${encodeURIComponent(code)}&select=pid,name,avatar,team,game,score&limit=10000`, { headers });
    if (!res.ok) return { players: [], error: `HTTP ${res.status}` };
    const map = new Map();
    for (const r of await res.json()) {
      const p = map.get(r.pid) || { pid: r.pid, name: r.name, avatar: r.avatar, team: r.team, total: 0, games: 0 };
      p.total += r.score; p.games++; map.set(r.pid, p);
    }
    return { players: [...map.values()].sort((a, b) => b.total - a.total), error: null };
  } catch (e) { return { players: [], error: String(e.message || e) }; }
}

export function teamTotals(players, teamCount) {
  const t = Array.from({ length: teamCount }, (_, i) => ({ team: i, total: 0, members: 0 }));
  for (const p of players) if (t[p.team]) { t[p.team].total += p.total; t[p.team].members++; }
  for (const x of t) x.avg = x.members ? x.total / x.members : 0;
  return t;
}

// ---------- โพล / แบบสำรวจ ----------
const rest = async (path, opts = {}) => {
  if (!enabled) return { ok: false, data: null };
  try {
    const res = await fetch(`${base}/rest/v1/${path}`, { ...opts, headers: { ...headers, ...opts.headers } });
    return { ok: res.ok, data: res.ok && opts.method === undefined ? await res.json() : null };
  } catch { return { ok: false, data: null }; }
};
const upsert = { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' } };
const q = encodeURIComponent;

export const listPolls = room => rest(`gs_polls?room=eq.${q(room)}&select=id,q,type,options,open&order=created_at.asc`);
export const listVotes = room => rest(`gs_votes?room=eq.${q(room)}&select=poll_id,pid,answer&limit=20000`);
export const savePoll = poll => rest('gs_polls?on_conflict=id', { ...upsert, body: JSON.stringify(poll) });
export const setPollOpen = (id, open) => rest(`gs_polls?id=eq.${q(id)}`, { method: 'PATCH', body: JSON.stringify({ open }) });
export const deletePoll = id => rest(`gs_polls?id=eq.${q(id)}`, { method: 'DELETE' });
export const vote = (room, poll_id, answer) => rest('gs_votes?on_conflict=poll_id,pid', { ...upsert, body: JSON.stringify({ room, poll_id, pid: state.pid, answer: String(answer).slice(0, 80) }) });
