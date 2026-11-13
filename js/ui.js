// ชิ้นส่วน UI ที่ใช้ร่วมกันระหว่างหน้าผู้เล่น ห้องควบคุม และหน้า Live
import { esc, fmt, state, TEAMS } from './core.js';
import { teamTotals } from './sync.js';
import { GAMES } from './games.js';

export const game = id => GAMES.find(g => g.id === id);
export const roundKey = R => `${R.n}:${R.game}`;   // ชื่อแถวคะแนนของรอบนั้นในฐานข้อมูล
export const teamChip = i => { const t = TEAMS[i]; return t ? `<span class="chip" style="--c:${t.c}">${t.e} ทีม${t.n}</span>` : ''; };
export const ava = (p, cls = '') => `<span class="ava ${cls}" style="--c:${esc(p.color || '#fff')}">${esc(p.avatar || '?')}</span>`;
export const rankRow = (i, left, right, hl, color) => `<li class="rank ${hl ? 'me' : ''}" style="${color ? `--c:${color}` : ''}">
  <span class="pos">${['🥇', '🥈', '🥉'][i] || i + 1}</span><span class="who">${left}</span><b>${right}</b></li>`;

// อันดับ: mode = 'team' | 'avg' | 'solo'; field = 'total' (สะสม) หรือ 'round' (เฉพาะรอบล่าสุด)
export function boardHTML(players, teams, mode, bonus, opt = {}) {
  const f = opt.field || 'total';
  const list = f === 'round' ? players.filter(p => p.round != null).sort((a, b) => b.round - a.round) : players;
  if (!list.length) return `<p class="hint">${f === 'round' ? 'ยังไม่มีคะแนนในรอบนี้' : 'ยังไม่มีผู้เล่นในห้อง'}</p>`;
  if (mode === 'solo') return `<ol class="ranks">${list.slice(0, opt.top || 50).map((p, i) =>
    rankRow(i, `${ava(p, 'sm')}<span class="grow">${esc(p.name)}<small>${esc(p.style || '')}</small></span>${teams ? teamChip(p.team) : ''}`, fmt(p[f]), p.pid === state.pid, p.color)).join('')}</ol>`;
  const key = mode === 'avg' ? 'avg' : 'total';
  const tt = teamTotals(f === 'round' ? list.map(p => ({ ...p, total: p.round })) : list, teams, f === 'round' ? [] : bonus);
  const max = Math.max(1, ...tt.map(t => t[key]));
  return `<ol class="ranks">${tt.sort((a, b) => b[key] - a[key]).map((t, i) => {
    const T = TEAMS[t.team];
    return rankRow(i, `<span class="ava sm" style="--c:${T.c}">${T.e}</span><span class="grow">ทีม${T.n} <small>${t.members} คน${t.bonus ? ` · โบนัส ${fmt(t.bonus)}` : ''}</small>
      <span class="bar"><i style="width:${t[key] / max * 100}%"></i></span></span>`, fmt(t[key]), opt.team === t.team, T.c);
  }).join('')}</ol>`;
}
