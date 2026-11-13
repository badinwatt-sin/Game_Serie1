// ชั้นเชื่อมต่อฐานข้อมูลกลาง (Supabase REST) — ห้อง, ผู้เล่น, คะแนน, โพล
// ถ้า config.js ว่าง: enabled = false และแอปจะทำงานเป็น "โหมดสาธิต" (เล่นเกมได้ ไม่มีห้อง)
import { state, myScores } from './core.js';

const cfg = window.GS_CONFIG || {};
const base = (cfg.supabaseUrl || '').replace(/\/+$/, '');
export const enabled = !!(base && cfg.supabaseKey);
const headers = { apikey: cfg.supabaseKey, Authorization: `Bearer ${cfg.supabaseKey}`, 'Content-Type': 'application/json' };
const q = encodeURIComponent;

const rest = async (path, opts = {}) => {
  if (!enabled) return { ok: false, status: 0, data: null };
  try {
    const res = await fetch(`${base}/rest/v1/${path}`, { ...opts, headers: { ...headers, ...opts.headers } });
    return { ok: res.ok, status: res.status, data: res.ok && !opts.method ? await res.json() : null };
  } catch { return { ok: false, status: 0, data: null }; }
};
const rpc = async (fn, body) => {
  if (!enabled) return { ok: false, status: 0, data: null };
  try {
    const res = await fetch(`${base}/rest/v1/rpc/${fn}`, { method: 'POST', headers, body: JSON.stringify(body) });
    return { ok: res.ok, status: res.status, data: res.ok ? await res.json().catch(() => null) : null };
  } catch { return { ok: false, status: 0, data: null }; }
};
const upsert = { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' } };

// ---------- ห้อง ----------
// คืน { ok, data: room | null } — data เป็น null เมื่อไม่มีห้องนี้ (หรือถูกปิดแล้ว)
export async function getRoom(code) {
  const r = await rest(`gs_rooms?code=eq.${q(code)}&archived=is.false&select=code,name,teams,state`);
  return { ok: r.ok, data: r.ok ? r.data[0] || null : null };
}
export const listRooms = () => rest('gs_rooms?archived=is.false&select=code,name,teams,created_at&order=created_at.desc&limit=50');
export const listPlayers = code => rest(`gs_players?room=eq.${q(code)}&active=is.true&select=pid,name,avatar,color,style,team&order=joined_at.asc&limit=2000`);
// คืน 'ok' | 'taken' | 'noroom' | 'error'
export async function join(code, player) {
  const r = await rpc('gs_join', { room_code: code, player: { ...player, pid: state.pid } });
  return r.ok ? r.data : 'error';
}

// ---------- งานของผู้สอน (แนบรหัสผ่าน ฐานข้อมูลเป็นผู้ตรวจ) ----------
export const adminCheck = p => rpc('gs_admin_check', { p });
export const saveRoom = room => rpc('gs_room_save', { p: state.adminPass, room });
export const setPlayerActive = (code, pid, active) => rpc('gs_player_active', { p: state.adminPass, room_code: code, player_id: pid, is_active: active });
export const savePoll = poll => rpc('gs_poll_save', { p: state.adminPass, poll });
export const setPollOpen = (id, open) => rpc('gs_poll_set_open', { p: state.adminPass, poll_id: id, is_open: open });
export const deletePoll = id => rpc('gs_poll_delete', { p: state.adminPass, poll_id: id });

// ---------- คะแนน ----------
// ส่งคะแนนดีที่สุดของทุกเกมในห้องปัจจุบัน (ส่งซ้ำได้: upsert ตาม room+pid+game)
export async function pushScores() {
  if (!enabled || !state.room || !state.player) return false;
  const rows = Object.entries(myScores()).filter(([, s]) => s.best > 0).map(([game, s]) => ({
    room: state.room.code, pid: state.pid, name: state.player.name.slice(0, 24), avatar: state.player.avatar,
    team: state.player.team ?? null, game, score: s.best, updated_at: new Date().toISOString()
  }));
  if (!rows.length) return true;
  return (await rest('gs_scores?on_conflict=room,pid,game', { ...upsert, body: JSON.stringify(rows) })).ok;
}

// ผู้เล่นทั้งห้องพร้อมคะแนนรวม เรียงจากมากไปน้อย → { players: [{pid,name,avatar,color,style,team,total,games}], error }
export async function fetchRoom(code) {
  const [pl, sc] = await Promise.all([listPlayers(code), rest(`gs_scores?room=eq.${q(code)}&select=pid,score&limit=20000`)]);
  if (!pl.ok || !sc.ok) return { players: [], error: 'เชื่อมต่อไม่ได้' };
  const map = new Map(pl.data.map(p => [p.pid, { ...p, total: 0, games: 0 }]));
  for (const r of sc.data) { const p = map.get(r.pid); if (p) { p.total += r.score; p.games++; } }
  return { players: [...map.values()].sort((a, b) => b.total - a.total), error: null };
}

export function teamTotals(players, teamCount, bonus = []) {
  const t = Array.from({ length: teamCount }, (_, i) => ({ team: i, total: bonus[i] || 0, members: 0, bonus: bonus[i] || 0 }));
  for (const p of players) if (t[p.team]) { t[p.team].total += p.total; t[p.team].members++; }
  for (const x of t) x.avg = x.members ? x.total / x.members : 0;
  return t;
}

// ---------- โพล ----------
export const listPolls = room => rest(`gs_polls?room=eq.${q(room)}&select=id,q,type,options,open&order=created_at.asc`);
export const listVotes = room => rest(`gs_votes?room=eq.${q(room)}&select=poll_id,pid,answer&limit=20000`);
export const vote = (room, poll_id, answer) => rest('gs_votes?on_conflict=poll_id,pid', { ...upsert, body: JSON.stringify({ room, poll_id, pid: state.pid, answer: String(answer).slice(0, 80) }) });
