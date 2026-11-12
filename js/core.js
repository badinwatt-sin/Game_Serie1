// ยูทิลิตี้กลาง: state, เสียง, เอฟเฟกต์, ทีม

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
export const pick = arr => arr[Math.floor(Math.random() * arr.length)];
export const shuffle = arr => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const fmt = n => Math.round(n).toLocaleString('th-TH');

export const TEAMS = [
  { n: 'เสือ', e: '🐯', c: '#ff8a3d' }, { n: 'มังกร', e: '🐲', c: '#22c55e' },
  { n: 'ฉลาม', e: '🦈', c: '#38bdf8' }, { n: 'อินทรี', e: '🦅', c: '#facc15' },
  { n: 'ยูนิคอร์น', e: '🦄', c: '#e879f9' }, { n: 'จิ้งจอก', e: '🦊', c: '#fb7185' },
  { n: 'แพนด้า', e: '🐼', c: '#cbd5e1' }, { n: 'ปลาหมึก', e: '🐙', c: '#a78bfa' },
  { n: 'สิงโต', e: '🦁', c: '#f59e0b' }, { n: 'นกฮูก', e: '🦉', c: '#2dd4bf' },
  { n: 'ผึ้ง', e: '🐝', c: '#fde047' }, { n: 'โลมา', e: '🐬', c: '#60a5fa' }
];
export const AVATARS = ['😀', '😎', '🤓', '🥳', '🤠', '🦸', '🧙', '🧑‍🚀', '🐱', '🐶', '🦊', '🐼', '🐸', '🐵', '🦄', '🐯', '🤖', '👾', '🌟', '🔥'];

// ---------- รหัสห้อง: 4 ตัวอักษรสุ่ม + 1 ตัวบอกจำนวนทีม (0 = เล่นเดี่ยว) ----------
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const TEAM_CHARS = '0123456789ABC';
export const makeRoomCode = teams => Array.from({ length: 4 }, () => pick([...CODE_CHARS])).join('') + TEAM_CHARS[clamp(teams, 0, 12)];
export const parseRoomCode = raw => {
  const code = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code.length !== 5) return null;
  const teams = TEAM_CHARS.indexOf(code[4]);
  if (teams < 0 || teams === 1) return null;
  return { code, teams };
};

// ---------- state (localStorage) ----------
const KEY = 'gs1';
const blank = () => ({ pid: (crypto.randomUUID?.() || String(Math.random()).slice(2)), player: null, room: null, scores: {}, host: null, sound: true });
export let state = blank();
try { state = { ...blank(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { /* ใช้ค่าเริ่มต้น */ }
export const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* โหมดส่วนตัว: ไม่บันทึก */ } };
save();

export const roomKey = () => state.room?.code || 'solo';
export const myScores = () => (state.scores[roomKey()] ||= {});
export const myTotal = () => Object.values(myScores()).reduce((s, g) => s + (g.best || 0), 0);

// ---------- เสียง (WebAudio สังเคราะห์สด ไม่ต้องโหลดไฟล์) ----------
let ac;
const tone = (freq, dur = 0.12, type = 'sine', vol = 0.18, when = 0) => {
  if (!state.sound) return;
  try {
    ac ||= new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === 'suspended') ac.resume();
    const t = ac.currentTime + when, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur);
  } catch { /* ไม่มีเสียงก็เล่นต่อได้ */ }
};
export const sfx = {
  tap: () => tone(520, 0.06, 'triangle', 0.12),
  good: () => { tone(660, 0.1, 'triangle'); tone(990, 0.16, 'triangle', 0.16, 0.08); },
  bad: () => { tone(200, 0.22, 'sawtooth', 0.12); navigator.vibrate?.(80); },
  tick: () => tone(880, 0.05, 'square', 0.06),
  go: () => tone(1175, 0.3, 'triangle', 0.2),
  note: i => tone([262, 330, 392, 523, 587, 659][i % 6], 0.28, 'sine', 0.22),
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.18, i * 0.11))
};

// ---------- เอฟเฟกต์ ----------
export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2200);
}

export function floatText(x, y, text, color = '#fff') {
  const f = document.createElement('div');
  f.className = 'float'; f.textContent = text; f.style.cssText = `left:${x}px;top:${y}px;color:${color}`;
  document.body.append(f);
  setTimeout(() => f.remove(), 800);
}

export function confetti(n = 120) {
  if (reducedMotion()) return;
  const cv = $('#fx'), ctx = cv.getContext('2d'), dpr = Math.min(devicePixelRatio || 1, 2);
  const W = cv.width = innerWidth * dpr, H = cv.height = innerHeight * dpr;
  const colors = ['#f472b6', '#facc15', '#34d399', '#60a5fa', '#a78bfa', '#fb923c'];
  const ps = Array.from({ length: n }, () => ({
    x: W / 2 + (Math.random() - 0.5) * W * 0.4, y: H * 0.35, vx: (Math.random() - 0.5) * 16 * dpr, vy: (-Math.random() * 14 - 4) * dpr,
    s: (Math.random() * 7 + 4) * dpr, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, c: pick(colors)
  }));
  let frame = 0;
  cancelAnimationFrame(confetti.raf);
  (function loop() {
    ctx.clearRect(0, 0, W, H);
    for (const p of ps) {
      p.vy += 0.35 * dpr; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
      ctx.globalAlpha = Math.max(0, 1 - frame / 150);
      ctx.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * 0.66); ctx.restore();
    }
    if (++frame < 150) confetti.raf = requestAnimationFrame(loop); else ctx.clearRect(0, 0, W, H);
  })();
}

export function countUp(node, to, ms = 900) {
  if (reducedMotion()) { node.textContent = fmt(to); return; }
  const t0 = performance.now();
  (function step(t) {
    const k = clamp((t - t0) / ms, 0, 1);
    node.textContent = fmt(to * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(step);
  })(t0);
}

// แยกคำไทยเป็น "ตัวอักษรที่มองเห็น" (พยัญชนะ + สระบน/ล่าง/วรรณยุกต์ รวมเป็นก้อนเดียว)
export const graphemes = s => 'Segmenter' in Intl
  ? [...new Intl.Segmenter('th', { granularity: 'grapheme' }).segment(s)].map(x => x.segment)
  : (s.match(/[\s\S][ัิ-ฺ็-๎]*/g) || []);
