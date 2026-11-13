// ชั้นข้อมูล: Supabase (ใช้งานจริง) หรือโหมดสาธิตใน localStorage เมื่อ config.js ยังไม่ได้ใส่ค่า
// ทั้งสองแบบมีหน้าตาเดียวกัน และโหมดสาธิตเลียนแบบกติกาใน supabase/recruit.sql
import { CFG, RANK, SLA_DAYS, DAY, STYLES, SOURCES, scorePrescreen } from './logic.js';

const base = (CFG.supabaseUrl || '').replace(/\/+$/, '');
export const live = !!(base && CFG.supabaseKey);
const SKEY = live ? 'rc_session' : 'rc_demo_session';
const ERR = {
  bad_login: 'รหัสผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', unauthorized: 'ไม่มีสิทธิ์ทำรายการนี้ หรือเซสชันหมดอายุ',
  bad_phone: 'เบอร์โทรศัพท์ไม่ถูกต้อง', bad_name: 'กรุณากรอกชื่อ-นามสกุล', consent_required: 'กรุณายินยอมให้ใช้ข้อมูลก่อนส่ง',
  weak_password: 'รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร', busy: 'ระบบมีผู้ใช้งานมาก กรุณาลองใหม่ภายหลัง',
  empty_queue: 'กรุณาเลือกผู้จัดการ', bad_manager: 'ผู้จัดการคนนี้ไม่พร้อมรับลีด', cannot_disable_self: 'ปิดบัญชีของตัวเองไม่ได้',
  duplicate: 'รหัสนี้ถูกใช้แล้ว'
};
const fail = code => { const e = new Error(ERR[code] || code || 'เกิดข้อผิดพลาด'); e.code = code; return e; };

export const session = {
  get: () => { try { return JSON.parse(localStorage.getItem(SKEY)); } catch { return null; } },
  set: s => s ? localStorage.setItem(SKEY, JSON.stringify(s)) : localStorage.removeItem(SKEY)
};
const tok = () => session.get()?.token || '';

// ---------- Supabase ----------
async function rpc(fn, body) {
  let res;
  try {
    res = await fetch(`${base}/rest/v1/rpc/${fn}`, {
      method: 'POST', body: JSON.stringify(body),
      headers: { apikey: CFG.supabaseKey, Authorization: `Bearer ${CFG.supabaseKey}`, 'Content-Type': 'application/json' }
    });
  } catch { throw fail('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ต'); }
  const text = await res.text(); let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* ไม่ใช่ JSON */ }
  if (!res.ok) throw fail(data?.code === '23505' ? 'duplicate' : data?.message);
  return data;
}
const remote = {
  track: ev => rpc('rc_track', { ev }).catch(() => {}),
  publicInfo: (ref, camp) => rpc('rc_public', { ref: ref || '', camp: camp || '' }),
  register: c => rpc('rc_register', { c }),
  status: (code, phone4) => rpc('rc_status', { p_code: code, phone4 }),
  login: async (code, pass) => { const s = await rpc('rc_login', { p_code: code, p_pass: pass }); session.set(s); return s.user; },
  logout: async () => { await rpc('rc_logout', { tok: tok() }).catch(() => {}); session.set(null); },
  load: () => rpc('rc_load', { tok: tok() }),
  action: (cid, action, data = {}) => rpc('rc_action', { tok: tok(), cid, action, data }),
  saveUser: usr => rpc('rc_user_save', { tok: tok(), usr }),
  saveCampaign: camp => rpc('rc_campaign_save', { tok: tok(), camp }),
  setPassword: (old_pass, new_pass) => rpc('rc_set_password', { tok: tok(), old_pass, new_pass })
};

// ---------- โหมดสาธิต ----------
const DKEY = 'rc_demo_v2';
const uid = () => crypto.randomUUID();
const iso = daysAgo => new Date(Date.now() - daysAgo * DAY).toISOString();
function seed() {
  const mk = (code, name, provinces, styles, rating, extra = {}) => ({
    id: uid(), role: 'manager', code, name, phone: '0800000000', email: '', line_id: '', provinces, styles, rating,
    capacity: 8, in_campaign: true, validated: true, active: true, created_at: iso(120), ...extra
  });
  const users = [
    { id: uid(), role: 'admin', code: 'ADMIN', name: 'ทีม Recruiting', provinces: [], styles: [], rating: 0, capacity: 0, in_campaign: false, validated: true, active: true, created_at: iso(200) },
    mk('M101', 'ผจก. อรทัย (ตัวอย่าง)', ['กรุงเทพมหานคร', 'นนทบุรี', 'ปทุมธานี'], ['online', 'wealth'], 4.8),
    mk('M102', 'ผจก. ธนากร (ตัวอย่าง)', ['กรุงเทพมหานคร', 'สมุทรปราการ'], ['corporate', 'warm'], 4.2),
    mk('M103', 'ผจก. พิมพ์ชนก (ตัวอย่าง)', ['เชียงใหม่', 'ลำพูน', 'ลำปาง'], ['warm', 'online'], 4.5),
    mk('M104', 'ผจก. วีรยุทธ (ตัวอย่าง)', ['ขอนแก่น', 'อุดรธานี', 'มหาสารคาม'], ['warm', 'corporate'], 3.9),
    mk('M105', 'ผจก. สุภาวดี (ตัวอย่าง)', ['ชลบุรี', 'ระยอง'], ['wealth', 'corporate'], 4.6),
    mk('M106', 'ผจก. กิตติ (ตัวอย่าง)', ['สงขลา', 'ภูเก็ต', 'สุราษฎร์ธานี'], ['warm'], 3.4, { validated: false })
  ];
  const campaigns = [
    { id: 'change-q4', name: "Let's Change Your Chance Q4", message: 'เปิดรับที่ปรึกษารุ่นใหม่ทั่วประเทศ อบรมฟรี มีพี่เลี้ยงดูแล', starts_on: iso(40).slice(0, 10), ends_on: iso(-50).slice(0, 10), active: true, created_at: iso(40) },
    { id: 'career-day', name: 'Career Day ภูมิภาค', message: 'พบผู้จัดการตัวจริงในงาน Career Day ใกล้บ้านคุณ', starts_on: iso(20).slice(0, 10), ends_on: iso(-20).slice(0, 10), active: true, created_at: iso(20) }
  ];
  const mgrs = users.filter(u => u.role === 'manager');
  const provs = ['กรุงเทพมหานคร', 'กรุงเทพมหานคร', 'นนทบุรี', 'เชียงใหม่', 'ขอนแก่น', 'ชลบุรี', 'สงขลา', 'นครราชสีมา', 'ภูเก็ต', 'ระยอง', 'อุดรธานี', 'ลำปาง'];
  const first = ['กมล', 'ชนิดา', 'ณัฐพล', 'ปวีณา', 'ธีรภัทร', 'สุนิสา', 'วรเมธ', 'อารียา', 'พงศกร', 'มนัสนันท์', 'จิรายุ', 'รัตนา', 'ศุภชัย', 'เบญจมาศ', 'ภาณุ', 'ดารุณี', 'อนุชา', 'กัญญา', 'ธนพล', 'วิไล', 'เอกชัย', 'นภัส', 'สิทธิ', 'ลลิตา', 'ปกรณ์', 'ชุติมา', 'ยศพล', 'อัญชลี'];
  const plan = ['new', 'new', 'new', 'new', 'qualified', 'qualified', 'assigned', 'assigned', 'assigned', 'assigned', 'contacted', 'contacted', 'contacted',
    'interview', 'interview', 'applied', 'applied', 'agent', 'agent', 'agent', 'rejected', 'rejected', 'escalated', 'new', 'assigned', 'contacted', 'interview', 'new'];
  const occ = ['พนักงานบริษัท', 'ค้าขายออนไลน์', 'ฟรีแลนซ์', 'พนักงานธนาคาร', 'เจ้าของกิจการ', 'นักศึกษาจบใหม่', 'แม่บ้าน', 'พนักงานขาย'];
  const srcs = ['facebook_ads', 'facebook_ads', 'facebook_ads', 'agent_post', 'agent_post', 'line', 'youtube', 'job_board', 'print_qr', 'event', 'tiktok', 'direct'];
  let seedN = 7; const rnd = () => (seedN = (seedN * 9301 + 49297) % 233280) / 233280;
  const candidates = [], activities = []; let aid = 1;
  plan.forEach((stage, i) => {
    const answers = Array.from({ length: 9 }, () => 2 + Math.floor(rnd() * 4));
    const age = ['20-29', '30-39', '30-39', '40-49', '20-29', '50+'][i % 6];
    const sc = scorePrescreen(answers, age), created = 1 + Math.floor(rnd() * 34);
    const province = provs[i % provs.length], style = STYLES[i % 4].id;
    const c = {
      id: uid(), track_code: 'DM' + String(1000 + i), name: `${first[i]} ตัวอย่าง`, phone: '08' + String(10000000 + i * 137).slice(0, 8),
      email: '', line_id: 'demo' + i, age_range: age, occupation: occ[i % occ.length], province, style, work_mode: i % 3 ? 'full' : 'part',
      expectation: ['อยากมีรายได้เสริม', 'อยากเปลี่ยนสายงาน', 'อยากมีเวลาให้ครอบครัว', 'อยากสร้างทีมของตัวเอง'][i % 4],
      ref_code: srcs[i % srcs.length] === 'agent_post' ? mgrs[i % 5].code : null, source: srcs[i % srcs.length], campaign: i % 4 === 3 ? 'career-day' : 'change-q4',
      scores: { attitude: sc.attitude, skill: sc.skill, expectation: sc.expectation, total: sc.total }, grade: sc.grade,
      stage, reached: RANK[stage] ?? (stage === 'escalated' ? 2 : 0), manager_id: null, queue: [], queue_pos: 0, assigned_at: null,
      first_assigned_at: null, contacted_at: null, appt_at: null, reject_reason: stage === 'rejected' ? 'ติดต่อไม่ได้' : null,
      consent_at: iso(created), created_at: iso(created), updated_at: iso(Math.max(0, created - 2))
    };
    const log = (d, actor, type, note) => activities.push({ id: aid++, candidate_id: c.id, at: iso(d), actor, type, note });
    log(created, 'ผู้สมัคร', 'register', 'ลงทะเบียนผ่านหน้า Landing');
    if ((RANK[stage] ?? 0) >= 2) {
      const m = mgrs.find(x => x.provinces.includes(province)) || mgrs[i % 5], m2 = mgrs.find(x => x !== m);
      const since = stage === 'assigned' ? [0.5, 2, 4.2, 4.8, 1][i % 5] : Math.max(1, created - 3);
      Object.assign(c, { manager_id: m.id, queue: [m.id, m2.id], assigned_at: iso(since), first_assigned_at: iso(since) });
      log(since, 'ทีม Recruiting', 'assign', 'ส่งให้ ' + m.name);
      if (RANK[stage] >= 3) { c.contacted_at = iso(Math.max(0.3, since - 1.5)); log(since - 1.5, m.name, 'contacted', 'โทรคุยเบื้องต้นแล้ว สนใจนัดคุยต่อ'); }
      if (stage === 'interview') c.appt_at = iso(-2);
    }
    candidates.push(c);
  });
  const events = [];
  for (let d = 0; d < 35; d++) for (const s of SOURCES) {
    const w = { facebook_ads: 34, agent_post: 16, line: 9, youtube: 7, tiktok: 8, job_board: 6, print_qr: 3, event: 3, direct: 5 }[s.id];
    const v = Math.round(w * (0.6 + rnd() * 0.8)), day = iso(d).slice(0, 10);
    events.push({ type: 'visit', source: s.id, campaign: 'change-q4', day, n: v },
      { type: 'prescreen_start', source: s.id, campaign: 'change-q4', day, n: Math.round(v * 0.32) },
      { type: 'prescreen_done', source: s.id, campaign: 'change-q4', day, n: Math.round(v * 0.21) });
  }
  return { users, campaigns, candidates, activities, events, pass: {} };
}
const db = {
  get() { try { const d = JSON.parse(localStorage.getItem(DKEY)); if (d?.users) return d; } catch { /* สร้างใหม่ */ } const d = seed(); this.put(d); return d; },
  put: d => localStorage.setItem(DKEY, JSON.stringify(d))
};
const me = d => { const u = d.users.find(x => x.id === tok() && x.active); if (!u) throw fail('unauthorized'); return u; };
const act = (d, cid, actor, type, note) => d.activities.unshift({ id: Date.now() + Math.random(), candidate_id: cid, at: new Date().toISOString(), actor, type, note: note || null });
function nextManager(d, c, actor, why) {
  const nxt = d.users.find(u => u.id === c.queue[c.queue_pos + 1] && u.active);
  if (nxt) {
    Object.assign(c, { manager_id: nxt.id, queue_pos: c.queue_pos + 1, stage: 'assigned', assigned_at: new Date().toISOString(), contacted_at: null });
    act(d, c.id, actor, 'reassign', `${why} → ส่งต่อผู้จัดการลำดับถัดไป: ${nxt.name}`);
  } else {
    Object.assign(c, { manager_id: null, stage: 'escalated' });
    act(d, c.id, actor, 'escalate', `${why} → ส่งกลับให้บริษัทติดต่อผู้สมัครโดยตรง`);
  }
}
const sweep = d => d.candidates.filter(c => c.stage === 'assigned' && Date.now() - new Date(c.assigned_at) > SLA_DAYS * DAY)
  .forEach(c => nextManager(d, c, 'ระบบ', `ไม่มีการติดต่อภายใน ${SLA_DAYS} วัน`));

const local = {
  async track(ev) {
    const d = db.get(), day = new Date().toISOString().slice(0, 10), source = ev.source || 'direct';
    const row = d.events.find(e => e.type === ev.type && e.source === source && e.campaign === (ev.campaign || null) && e.day === day);
    if (row) row.n++; else d.events.push({ type: ev.type, source, campaign: ev.campaign || null, day, n: 1 });
    db.put(d);
  },
  async publicInfo(ref, camp) {
    const d = db.get(), c = d.campaigns.find(x => x.id === camp && x.active);
    return { ref_name: d.users.find(u => u.code === (ref || '').toUpperCase() && u.active && u.role === 'manager')?.name || null, campaign: c ? { id: c.id, name: c.name, message: c.message } : null };
  },
  async register(c) {
    const d = db.get(), phone = (c.phone || '').replace(/\D/g, '');
    if (!c.consent) throw fail('consent_required');
    if (!/^0\d{8,9}$/.test(phone)) throw fail('bad_phone');
    if ((c.name || '').trim().length < 2) throw fail('bad_name');
    const dup = d.candidates.find(x => x.phone === phone && x.stage !== 'rejected');
    if (dup) return { track_code: dup.track_code, dup: true };
    const s = c.scores || {}, total = Math.round((s.attitude || 0) * 0.4 + (s.skill || 0) * 0.35 + (s.expectation || 0) * 0.25);
    const ref = (c.ref_code || '').toUpperCase(), now = new Date().toISOString();
    const row = {
      id: uid(), track_code: Array.from({ length: 6 }, () => 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 31)]).join(''),
      name: c.name.trim(), phone, email: c.email || null, line_id: c.line_id || null, age_range: c.age_range, occupation: c.occupation || null,
      province: c.province, style: c.style, work_mode: c.work_mode, expectation: c.expectation || null,
      ref_code: d.users.some(u => u.code === ref && u.active) ? ref : null, source: c.source || 'direct', campaign: c.campaign || null,
      scores: { attitude: s.attitude || 0, skill: s.skill || 0, expectation: s.expectation || 0, total },
      grade: c.age_range === 'u20' ? 'C' : total >= 75 ? 'A' : total >= 55 ? 'B' : 'C', stage: 'new', reached: 0, manager_id: null, queue: [], queue_pos: 0,
      assigned_at: null, first_assigned_at: null, contacted_at: null, appt_at: null, reject_reason: null, consent_at: now, created_at: now, updated_at: now
    };
    d.candidates.unshift(row); act(d, row.id, 'ผู้สมัคร', 'register', 'ลงทะเบียนผ่านหน้า Landing'); db.put(d);
    return { track_code: row.track_code, dup: false };
  },
  async status(code, phone4) {
    const d = db.get(), c = d.candidates.find(x => x.track_code === code.trim().toUpperCase() && x.phone.endsWith(phone4));
    return c ? { name: c.name.split(' ')[0], stage: c.stage, created_at: c.created_at, manager: d.users.find(u => u.id === c.manager_id)?.name || null } : null;
  },
  async login(code, pass) {
    const d = db.get(), u = d.users.find(x => x.code === code.trim().toUpperCase() && x.active);
    if (!u || (d.pass[u.id] ?? 'demo1234') !== pass) throw fail('bad_login');
    session.set({ token: u.id, user: u }); return u;
  },
  async logout() { session.set(null); },
  async load() {
    const d = db.get(), u = me(d), adm = u.role === 'admin';
    sweep(d); db.put(d);
    const cands = d.candidates.filter(c => adm || c.manager_id === u.id), ids = new Set(cands.map(c => c.id));
    return structuredClone({
      me: u, candidates: cands, users: d.users.filter(x => adm || x.id === u.id), campaigns: d.campaigns.filter(c => adm || c.active),
      activities: d.activities.filter(a => ids.has(a.candidate_id)), events: adm ? d.events : []
    });
  },
  async action(cid, action, data = {}) {
    const d = db.get(), u = me(d), adm = u.role === 'admin', c = d.candidates.find(x => x.id === cid);
    if (!c || (!adm && c.manager_id !== u.id)) throw fail('unauthorized');
    if (!adm && !['contacted', 'interview', 'applied', 'decline', 'note'].includes(action)) throw fail('unauthorized');
    const now = new Date().toISOString(); let note = (data.note || '').trim() || null;
    const join = (...p) => p.filter(Boolean).join(' — ') || null;
    if (action === 'qualify') Object.assign(c, { stage: 'qualified', reject_reason: null });
    else if (action === 'reject') { Object.assign(c, { stage: 'rejected', manager_id: null, reject_reason: data.reason }); note = join(data.reason, note); }
    else if (action === 'reopen') Object.assign(c, { stage: 'new', manager_id: null, reject_reason: null });
    else if (action === 'assign') {
      const first = d.users.find(x => x.id === data.queue?.[0] && x.active && x.role === 'manager');
      if (!first) throw fail('bad_manager');
      Object.assign(c, { stage: 'assigned', manager_id: first.id, queue: data.queue, queue_pos: 0, assigned_at: now, first_assigned_at: c.first_assigned_at || now, contacted_at: null, reject_reason: null });
      note = join('ส่งให้ ' + first.name, note);
    } else if (action === 'contacted') Object.assign(c, { stage: 'contacted', contacted_at: c.contacted_at || now });
    else if (action === 'interview') Object.assign(c, { stage: 'interview', contacted_at: c.contacted_at || now, appt_at: data.appt_at || null });
    else if (action === 'applied') Object.assign(c, { stage: 'applied', contacted_at: c.contacted_at || now });
    else if (action === 'agent') c.stage = 'agent';
    else if (action === 'decline') {
      act(d, cid, u.name, 'decline', join(data.reason, note));
      if (data.outcome === 'not_fit') Object.assign(c, { stage: 'rejected', manager_id: null, reject_reason: data.reason });
      else nextManager(d, c, u.name, 'ผู้จัดการส่งคืนลีด');
      c.updated_at = now; db.put(d); return;
    } else if (action !== 'note') throw fail('bad_action');
    c.reached = Math.max(c.reached, RANK[c.stage] ?? 0); c.updated_at = now;
    act(d, cid, u.name, action, note); db.put(d);
  },
  async saveUser(usr) {
    const d = db.get(); if (me(d).role !== 'admin') throw fail('unauthorized');
    const { password, ...f } = usr; f.code = (f.code || '').toUpperCase();
    if (password && password.length < 8) throw fail('weak_password');
    if (d.users.some(x => x.code === f.code && x.id !== f.id)) throw fail('duplicate');
    if (f.id) Object.assign(d.users.find(x => x.id === f.id), f);
    else { if (!password) throw fail('weak_password'); f.id = uid(); f.created_at = new Date().toISOString(); d.users.push({ role: 'manager', ...f }); }
    if (password) d.pass[f.id] = password;
    db.put(d); return f.id;
  },
  async saveCampaign(camp) {
    const d = db.get(); if (me(d).role !== 'admin') throw fail('unauthorized');
    const ex = d.campaigns.find(c => c.id === camp.id);
    if (ex) Object.assign(ex, camp); else d.campaigns.unshift({ ...camp, created_at: new Date().toISOString() });
    db.put(d);
  },
  async setPassword(oldPass, newPass) {
    const d = db.get(), u = me(d);
    if ((d.pass[u.id] ?? 'demo1234') !== oldPass) throw fail('bad_login');
    if (newPass.length < 8) throw fail('weak_password');
    d.pass[u.id] = newPass; db.put(d);
  }
};
export const resetDemo = () => { localStorage.removeItem(DKEY); session.set(null); };
export const api = live ? remote : local;
