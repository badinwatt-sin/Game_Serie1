// Portal ของทีม Recruiter: Admin (Recruiting Specialist) และ Manager (ผู้จัดการที่รับลีด)
import {
  CFG, $, $$, esc, STAGES, SOURCES, STYLES, WORK_MODES, AGES, DIMS, SLA_DAYS, QUEUE_SIZE, OPEN_STAGES, DAY,
  stageLabel, sourceLabel, styleLabel, provinceOptions, matchManagers, fmtDate, ago, slaLeft, landingUrl, qrSvg, toast, copy
} from './logic.js';
import { api, live, session, resetDemo } from './api.js';

const app = $('#app');
let D = null;                       // { me, candidates, users, campaigns, activities, events }
let view = 'leads';
const F = { stage: 'all', q: '', grade: '', source: '', days: 30, kit: { campaign: '', source: 'facebook_ads', ref: '' } };
const isAdmin = () => D?.me.role === 'admin';
const userName = id => D.users.find(u => u.id === id)?.name || '-';
const label = (list, id) => list.find(x => x.id === id)?.label || id || '-';
const pct = (a, b) => b ? Math.round(a / b * 100) + '%' : '–';
const num = n => Number(n || 0).toLocaleString('th-TH');

// ---------- เข้าระบบ ----------
function loginView(msg = '') {
  app.innerHTML = `<div class="login"><form class="card form" id="login">
    <div class="brand"><span class="brand-mark">R</span><span>Recruit Hub <small>${esc(CFG.company || '')}</small></span></div>
    <h1>เข้าสู่ระบบทีม Recruiter</h1>
    <label>รหัสผู้ใช้<input name="code" required autocomplete="username" autocapitalize="characters" placeholder="เช่น ADMIN หรือรหัสผู้จัดการ"></label>
    <label>รหัสผ่าน<input name="pass" type="password" required autocomplete="current-password"></label>
    <p class="err" role="alert">${esc(msg)}</p>
    <button class="btn btn-primary btn-lg" type="submit">เข้าสู่ระบบ</button>
    ${live ? '' : `<div class="demo-box"><b>โหมดสาธิต</b> — ข้อมูลตัวอย่างเก็บในเบราว์เซอร์นี้เท่านั้น รหัสผ่านทุกบัญชี <code>demo1234</code>
      <div class="row"><button type="button" class="btn btn-sm" data-demo="ADMIN">เข้าเป็น Admin</button><button type="button" class="btn btn-sm" data-demo="M101">เข้าเป็น Manager</button>
      <button type="button" class="btn btn-sm btn-text" id="reset">ล้างข้อมูลตัวอย่าง</button></div></div>`}
    <a class="small muted" href="index.html">← หน้า Landing ของผู้สมัคร</a>
  </form></div>`;
  const go = async (code, pass) => {
    try { await api.login(code, pass); await boot(); } catch (e) { loginView(e.message); }
  };
  $('#login').onsubmit = e => { e.preventDefault(); const v = new FormData(e.target); go(v.get('code'), v.get('pass')); };
  $$('[data-demo]').forEach(b => b.onclick = () => go(b.dataset.demo, 'demo1234'));
  if ($('#reset')) $('#reset').onclick = () => { resetDemo(); toast('ล้างข้อมูลตัวอย่างแล้ว'); };
}

async function boot() {
  if (!session.get()) return loginView();
  try { D = await api.load(); } catch (e) { session.set(null); return loginView(e.code === 'unauthorized' ? 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' : e.message); }
  view = isAdmin() ? 'dash' : 'leads';
  shell();
}
async function refresh() {
  try { D = await api.load(); } catch (e) { if (e.code === 'unauthorized') { session.set(null); return loginView('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่'); } toast(e.message); }
  render();
}
// ทำรายการแล้วโหลดข้อมูลใหม่ · คืน true เมื่อสำเร็จ
async function run(fn, okMsg) {
  try { await fn(); if (okMsg) toast(okMsg); await refresh(); return true; } catch (e) { toast(e.message); return false; }
}

// ---------- โครงหน้า ----------
const NAV = [
  { id: 'dash', label: 'ภาพรวม', icon: '◔', admin: true },
  { id: 'leads', label: 'ลีด', icon: '☰' },
  { id: 'kit', label: 'แคมเปญ & ลิงก์', icon: '⌁' },
  { id: 'managers', label: 'ผู้จัดการ', icon: '☺', admin: true },
  { id: 'flow', label: 'Flow', icon: '⇣' }
];
function shell() {
  const nav = NAV.filter(n => !n.admin || isAdmin());
  app.innerHTML = `<div class="shell">
  <aside class="side">
    <div class="brand"><span class="brand-mark">R</span><span>Recruit Hub <small>${esc(CFG.company || '')}</small></span></div>
    <nav>${nav.map(n => `<button data-nav="${n.id}"><span aria-hidden="true">${n.icon}</span>${n.id === 'leads' && !isAdmin() ? 'ลีดของฉัน' : n.label}</button>`).join('')}</nav>
    <div class="side-foot">
      <div><b>${esc(D.me.name)}</b><small>${isAdmin() ? 'Recruiting Admin' : 'Manager · ' + esc(D.me.code)}</small></div>
      <button class="btn btn-sm btn-text" data-act="password">เปลี่ยนรหัสผ่าน</button>
      <button class="btn btn-sm btn-text" data-act="logout">ออกจากระบบ</button>
    </div>
  </aside>
  <main class="main">${live ? '' : '<div class="demo-bar">โหมดสาธิต — ข้อมูลตัวอย่าง เก็บในเบราว์เซอร์เครื่องนี้เท่านั้น</div>'}<div id="view"></div></main>
  </div><dialog id="dlg"></dialog>`;
  render();
}
function render() {
  $$('[data-nav]').forEach(b => b.classList.toggle('on', b.dataset.nav === view));
  ({ dash, leads, kit, managers, flow })[view]();
  if ($('#dlg').open && openId) detail(openId);
}
const head = (title, sub, actions = '') => `<header class="vhead"><div><h1>${title}</h1>${sub ? `<p class="muted">${sub}</p>` : ''}</div><div class="row">${actions}</div></header>`;

// ---------- ภาพรวม ----------
function dash() {
  const since = Date.now() - F.days * DAY, sinceDay = new Date(since).toISOString().slice(0, 10);
  const cs = D.candidates.filter(c => new Date(c.created_at) >= since), ev = D.events.filter(e => e.day >= sinceDay);
  const evn = (type, source) => ev.filter(e => e.type === type && (!source || e.source === source)).reduce((s, e) => s + e.n, 0);
  const reach = (k, list = cs) => list.filter(c => c.reached >= k).length;
  const funnel = [['เข้าชม Landing', evn('visit'), 'Visitor'], ['ทำแบบประเมินจบ', evn('prescreen_done'), 'Prospect'], ['ลงทะเบียน (Lead)', cs.length, 'Prospect'],
    ['Qualified Lead', reach(1), 'Candidate'], ['ส่งให้ผู้จัดการ', reach(2), 'Candidate'], ['ติดต่อแล้ว', reach(3), 'Candidate'],
    ['สัมภาษณ์', reach(4), 'Candidate'], ['ยื่นใบสมัคร', reach(5), 'Candidate'], ['ตัวแทนใหม่', reach(6), 'New Agent']];
  const max = Math.max(1, ...funnel.map(f => f[1]));
  const waiting = D.candidates.filter(c => c.stage === 'new').length, toMatch = D.candidates.filter(c => c.stage === 'qualified').length;
  const esc8 = D.candidates.filter(c => c.stage === 'escalated').length;
  const hot = D.candidates.filter(c => { const l = slaLeft(c); return l != null && l <= 1; }).length;
  const firstContact = D.candidates.filter(c => c.contacted_at && c.first_assigned_at).map(c => (new Date(c.contacted_at) - new Date(c.first_assigned_at)) / DAY).filter(d => d >= 0);
  const avg = firstContact.length ? (firstContact.reduce((a, b) => a + b, 0) / firstContact.length).toFixed(1) + ' วัน' : '–';
  const tile = (n, lbl, sub, cls = '', go = '') => `<button class="tile ${cls}" ${go ? `data-go="${go}"` : 'disabled'}><strong>${n}</strong><span>${lbl}</span><small>${sub}</small></button>`;
  const srcRows = SOURCES.map(s => {
    const l = cs.filter(c => c.source === s.id); return { s, v: evn('visit', s.id), l: l.length, q: reach(1, l), a: reach(6, l) };
  }).filter(r => r.v || r.l).sort((a, b) => b.q - a.q || b.l - a.l);
  const mgr = D.users.filter(u => u.role === 'manager' && u.active).map(u => {
    const mine = D.candidates.filter(c => c.manager_id === u.id);
    return { u, open: mine.filter(c => OPEN_STAGES.includes(c.stage)).length, wait: mine.filter(c => c.stage === 'assigned').length, contacted: mine.filter(c => c.reached >= 3).length, agent: mine.filter(c => c.stage === 'agent').length };
  }).sort((a, b) => b.contacted - a.contacted);
  $('#view').innerHTML = head('ภาพรวมการสรรหา', 'ติดตามตั้งแต่คนเห็นโฆษณา จนเป็นตัวแทนใหม่',
    `<select id="days" aria-label="ช่วงเวลา">${[[7, '7 วัน'], [30, '30 วัน'], [90, '90 วัน'], [365, '1 ปี']].map(([d, t]) => `<option value="${d}"${F.days === d ? ' selected' : ''}>${t}ล่าสุด</option>`).join('')}</select>`) + `
  <section class="tiles">
    ${tile(num(waiting), 'รอประเมิน', 'ลีดใหม่ที่ยังไม่ได้ตรวจ', waiting ? 'warn' : '', 'new')}
    ${tile(num(toMatch), 'รอจับคู่ผู้จัดการ', 'Qualified แล้ว ยังไม่ได้ส่ง', toMatch ? 'warn' : '', 'qualified')}
    ${tile(num(hot), 'SLA เหลือไม่ถึง 1 วัน', `ผู้จัดการต้องติดต่อใน ${SLA_DAYS} วัน`, hot ? 'bad' : '', 'assigned')}
    ${tile(num(esc8), 'บริษัทต้องติดต่อเอง', 'ไม่มีผู้จัดการรับ', esc8 ? 'bad' : '', 'escalated')}
    ${tile(num(cs.length), 'ลีดใหม่', `ใน ${F.days} วัน`)}
    ${tile(num(reach(1)), 'Qualified Leads', `${pct(reach(1), cs.length)} ของลีด`)}
    ${tile(avg, 'เวลาติดต่อครั้งแรก', 'เฉลี่ยหลังส่งให้ผู้จัดการ')}
    ${tile(num(reach(6)), 'ตัวแทนใหม่', `${pct(reach(6), cs.length)} ของลีด`)}
  </section>
  <section class="panel"><h2>Funnel: Visitor → Prospect → Candidate → New Agent</h2>
    <div class="funnel">${funnel.map(([l, n, who], i) => `<div class="fn-row"><span class="fn-l">${l}<small>${who}</small></span>
      <div class="fn-bar"><i style="width:${Math.max(n ? 1.5 : 0, n / max * 100)}%"></i><b>${num(n)}</b></div>
      <span class="fn-c">${i ? pct(n, funnel[i - 1][1]) : ''}</span></div>`).join('')}</div>
    <p class="small muted">% คืออัตราผ่านจากขั้นก่อนหน้า · ยอดเข้าชมและแบบประเมินนับจากเหตุการณ์บนหน้า Landing</p></section>
  <section class="panel"><h2>ช่องทางไหนสร้าง Qualified Lead ได้ดี</h2>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>ช่องทาง</th><th class="r">เข้าชม</th><th class="r">ลีด</th><th class="r">เข้าชม→ลีด</th><th class="r">Qualified</th><th class="r">อัตรา Qualified</th><th class="r">ตัวแทนใหม่</th></tr></thead>
    <tbody>${srcRows.map(r => `<tr><td>${esc(r.s.label)}</td><td class="r">${num(r.v)}</td><td class="r">${num(r.l)}</td><td class="r">${pct(r.l, r.v)}</td><td class="r"><b>${num(r.q)}</b></td><td class="r">${pct(r.q, r.l)}</td><td class="r">${num(r.a)}</td></tr>`).join('') || '<tr><td colspan="7" class="empty">ยังไม่มีข้อมูลในช่วงนี้</td></tr>'}</tbody></table></div></section>
  <section class="panel"><h2>ผู้จัดการที่รับลีด</h2>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>ผู้จัดการ</th><th class="r">Rating</th><th class="r">ถืออยู่ / รับได้</th><th class="r">ยังไม่ติดต่อ</th><th class="r">ติดต่อแล้ว</th><th class="r">ตัวแทนใหม่</th></tr></thead>
    <tbody>${mgr.map(m => `<tr><td>${esc(m.u.name)}${m.u.in_campaign ? '' : ' <span class="tag mute">นอกแคมเปญ</span>'}</td><td class="r">${Number(m.u.rating).toFixed(1)}</td><td class="r">${m.open} / ${m.u.capacity}</td><td class="r">${m.wait ? `<b class="t-bad">${m.wait}</b>` : 0}</td><td class="r">${m.contacted}</td><td class="r">${m.agent}</td></tr>`).join('') || '<tr><td colspan="6" class="empty">ยังไม่มีผู้จัดการ</td></tr>'}</tbody></table></div></section>`;
  $('#days').onchange = e => { F.days = +e.target.value; dash(); };
  $$('[data-go]').forEach(b => b.onclick = () => { F.stage = b.dataset.go; view = 'leads'; render(); });
}

// ---------- รายการลีด ----------
const gradeTag = g => `<span class="grade g${esc(g)}" title="เกรดจากแบบประเมิน">${esc(g)}</span>`;
function slaTag(c) {
  const l = slaLeft(c); if (l == null) return '';
  return `<span class="tag ${l <= 1 ? 'bad' : l <= 2.5 ? 'warn' : 'mute'}">${l <= 0 ? 'เกินกำหนด' : l < 1 ? `เหลือ ${Math.max(1, Math.round(l * 24))} ชม.` : `เหลือ ${Math.ceil(l)} วัน`}</span>`;
}
function leads() {
  const adm = isAdmin(), q = F.q.trim().toLowerCase();
  const stages = adm ? STAGES : STAGES.filter(s => ['assigned', 'contacted', 'interview', 'applied', 'agent'].includes(s.id));
  const list = D.candidates.filter(c => (F.stage === 'all' || c.stage === F.stage) && (!F.grade || c.grade === F.grade) && (!F.source || c.source === F.source)
    && (!q || [c.name, c.phone, c.province, c.track_code].some(x => (x || '').toLowerCase().includes(q))))
    .sort((a, b) => (slaLeft(a) ?? 99) - (slaLeft(b) ?? 99) || new Date(b.created_at) - new Date(a.created_at));
  const cnt = id => D.candidates.filter(c => c.stage === id).length;
  $('#view').innerHTML = head(adm ? 'ลีดทั้งหมด' : 'ลีดของฉัน', adm ? 'ประเมิน จับคู่ และติดตามผู้สมัครทุกคน' : `ติดต่อผู้สมัครภายใน ${SLA_DAYS} วัน ก่อนระบบส่งต่อให้ผู้จัดการคนถัดไป`,
    adm ? '<button class="btn btn-sm" data-act="csv">ส่งออก CSV</button>' : '') + `
  <div class="chips" role="tablist"><button class="${F.stage === 'all' ? 'on' : ''}" data-stage="all">ทั้งหมด <b>${D.candidates.length}</b></button>
    ${stages.map(s => `<button class="${F.stage === s.id ? 'on' : ''}" data-stage="${s.id}">${s.label} <b>${cnt(s.id)}</b></button>`).join('')}</div>
  <div class="filters"><input type="search" id="q" placeholder="ค้นหาชื่อ เบอร์ จังหวัด รหัสติดตาม" value="${esc(F.q)}" aria-label="ค้นหา">
    <select id="fg" aria-label="เกรด"><option value="">ทุกเกรด</option>${['A', 'B', 'C'].map(g => `<option${F.grade === g ? ' selected' : ''}>${g}</option>`).join('')}</select>
    ${adm ? `<select id="fs" aria-label="ช่องทาง"><option value="">ทุกช่องทาง</option>${SOURCES.map(s => `<option value="${s.id}"${F.source === s.id ? ' selected' : ''}>${s.label}</option>`).join('')}</select>` : ''}</div>
  <div class="tbl-wrap"><table class="tbl leads"><thead><tr><th>ผู้สมัคร</th><th>เกรด</th><th>แนวทาง</th>${adm ? '<th>ที่มา</th>' : ''}<th>ขั้น</th>${adm ? '<th>ผู้จัดการ</th>' : ''}<th>ลงทะเบียน</th></tr></thead>
  <tbody>${list.map(c => `<tr tabindex="0" data-open="${c.id}">
    <td><b>${esc(c.name)}</b><small>${esc(c.province || '-')} · ${label(AGES, c.age_range)}</small></td>
    <td>${gradeTag(c.grade)} <small class="inl">${c.scores?.total ?? 0}%</small></td>
    <td>${esc(styleLabel(c.style))}<small>${label(WORK_MODES, c.work_mode)}</small></td>
    ${adm ? `<td>${esc(sourceLabel(c.source))}${c.ref_code ? `<small>แนะนำโดย ${esc(c.ref_code)}</small>` : ''}</td>` : ''}
    <td><span class="tag st-${c.stage}">${stageLabel(c.stage)}</span> ${slaTag(c)}</td>
    ${adm ? `<td>${c.manager_id ? esc(userName(c.manager_id)) : '<span class="muted">-</span>'}</td>` : ''}
    <td>${ago(c.created_at)}</td></tr>`).join('') || `<tr><td colspan="7" class="empty">${D.candidates.length ? 'ไม่พบลีดตามตัวกรองนี้' : adm ? 'ยังไม่มีลีด — เริ่มจากสร้างลิงก์แคมเปญในเมนู “แคมเปญ & ลิงก์”' : 'ยังไม่มีลีดที่ส่งให้คุณ แชร์ลิงก์ส่วนตัวของคุณจากเมนู “แคมเปญ & ลิงก์”'}</td></tr>`}</tbody></table></div>`;
  $$('[data-stage]').forEach(b => b.onclick = () => { F.stage = b.dataset.stage; leads(); });
  $('#q').oninput = e => { F.q = e.target.value; leads(); const i = $('#q'); i.focus(); i.setSelectionRange(F.q.length, F.q.length); };
  $('#fg').onchange = e => { F.grade = e.target.value; leads(); };
  if ($('#fs')) $('#fs').onchange = e => { F.source = e.target.value; leads(); };
  $$('[data-open]').forEach(r => { r.onclick = () => detail(r.dataset.open); r.onkeydown = e => { if (e.key === 'Enter') detail(r.dataset.open); }; });
}
function exportCsv() {
  const cols = ['track_code', 'created_at', 'name', 'phone', 'email', 'line_id', 'age_range', 'occupation', 'province', 'style', 'work_mode', 'source', 'campaign', 'ref_code', 'grade', 'stage', 'expectation'];
  // ป้องกันสูตรแฝงเมื่อเปิดใน Excel: ค่าที่ขึ้นต้นด้วย = + - @ จะถูกนำหน้าด้วย '
  const cell = v => { let s = String(v ?? ''); if (/^[=+\-@]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"`; };
  const rows = D.candidates.map(c => [...cols.map(k => c[k]), c.scores?.total, userName(c.manager_id)].map(cell).join(','));
  const blob = new Blob(['﻿' + [...cols, 'score', 'manager'].join(',') + '\n' + rows.join('\n')], { type: 'text/csv' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `leads-${new Date().toISOString().slice(0, 10)}.csv` });
  a.click(); URL.revokeObjectURL(a.href);
}

// ---------- รายละเอียดลีด ----------
let openId = null, askMode = null;
const REJECT_REASONS = ['ติดต่อไม่ได้', 'ผู้สมัครไม่สนใจแล้ว', 'คุณสมบัติไม่ตรง', 'ข้อมูลซ้ำหรือไม่ถูกต้อง', 'อื่น ๆ'];
const ACT_LABEL = { register: 'ลงทะเบียน', qualify: 'ผ่านการประเมิน', reject: 'ไม่ผ่าน', reopen: 'เปิดพิจารณาใหม่', assign: 'ส่งให้ผู้จัดการ', reassign: 'ส่งต่อผู้จัดการ', escalate: 'ส่งกลับบริษัท', contacted: 'ติดต่อแล้ว', interview: 'นัดสัมภาษณ์', applied: 'ยื่นใบสมัคร', agent: 'อนุมัติเป็นตัวแทนใหม่', decline: 'ผู้จัดการไม่ดำเนินการต่อ', note: 'บันทึก' };
function matchList(c) {
  const ms = matchManagers(c, D.users, D.candidates);
  if (!ms.length) return '<p class="empty">ยังไม่มีผู้จัดการในระบบ เพิ่มได้ที่เมนู “ผู้จัดการ”</p>';
  return `<ol class="match">${ms.slice(0, 6).map((m, i) => `<li class="${m.eligible ? '' : 'off'}">
    <div><b>${esc(m.user.name)}</b> ${i === 0 && m.eligible ? '<span class="tag ok">แนะนำ</span>' : ''}
      <small>${esc(m.eligible ? m.reasons.join(' · ') || 'ไม่ตรงพื้นที่หรือแนวทาง' : m.blocks.join(' · '))}</small>
      <small>Rating ${Number(m.user.rating).toFixed(1)} · ถือลีด ${m.open}/${m.user.capacity}</small></div>
    <span class="score" title="คะแนนความเหมาะสม">${m.score}</span>
    <button class="btn btn-sm btn-primary" data-assign="${m.user.id}" ${m.eligible ? '' : 'disabled'}>ส่งให้</button></li>`).join('')}</ol>
  <p class="small muted">คะแนน = พื้นที่ 40 + แนวทางการขาย 25 + Rating 20 + ภาระงาน 15 · ระบบตั้งผู้จัดการอันดับถัดไปเป็นลำดับ 2 ให้อัตโนมัติ ถ้าลำดับ 1 ไม่ติดต่อใน ${SLA_DAYS} วัน</p>`;
}
function actions(c) {
  const adm = isAdmin(), s = c.stage, b = (act, text, cls = '') => `<button class="btn ${cls}" data-do="${act}">${text}</button>`;
  if (askMode === 'reject' || askMode === 'decline') return `<form class="ask" id="ask">
    <b>${askMode === 'reject' ? 'เหตุผลที่ไม่ผ่าน' : 'แบบฟอร์มผลการพิจารณา'}</b>
    ${askMode === 'decline' ? `<div class="seg"><label><input type="radio" name="outcome" value="return" checked><span>ส่งคืนลีด (ให้คนอื่นดูแล)</span></label><label><input type="radio" name="outcome" value="not_fit"><span>ผู้สมัครไม่ไปต่อ</span></label></div>` : ''}
    <select name="reason" required>${REJECT_REASONS.map(r => `<option>${r}</option>`).join('')}</select>
    <input name="note" placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)" maxlength="300">
    <div class="row"><button class="btn btn-primary" type="submit">ยืนยัน</button><button class="btn btn-text" type="button" data-do="cancel">ยกเลิก</button></div></form>`;
  if (askMode === 'interview') return `<form class="ask" id="ask"><b>นัดสัมภาษณ์</b><input type="datetime-local" name="appt_at" required>
    <input name="note" placeholder="สถานที่ / ช่องทาง" maxlength="300"><div class="row"><button class="btn btn-primary" type="submit">บันทึกนัด</button><button class="btn btn-text" type="button" data-do="cancel">ยกเลิก</button></div></form>`;
  if (askMode === 'match') return matchList(c) + b('cancel', 'ยกเลิก', 'btn-text');
  const progress = { assigned: b('contacted', 'บันทึกว่าติดต่อแล้ว', 'btn-primary'), contacted: b('ask:interview', 'นัดสัมภาษณ์', 'btn-primary') + b('applied', 'ยื่นใบสมัคร'), interview: b('applied', 'ยื่นใบสมัคร — ส่งให้ Admin', 'btn-primary') }[s] || '';
  if (!adm) return progress ? progress + b('ask:decline', s === 'assigned' ? 'ส่งคืนลีด' : 'ไม่ไปต่อ', 'btn-text') : `<p class="muted">${s === 'applied' ? 'ส่งให้ Admin แล้ว รอการอนุมัติ' : 'ไม่มีรายการที่ต้องทำ'}</p>`;
  if (s === 'new') return b('qualify', 'ผ่าน — เป็น Qualified Lead', 'btn-primary') + b('ask:reject', 'ไม่ผ่าน', 'btn-text');
  if (s === 'qualified') return `<h3>จับคู่ผู้จัดการ</h3>${matchList(c)}${b('ask:reject', 'ไม่ผ่าน', 'btn-text')}`;
  if (s === 'escalated') return `<p class="note">ไม่มีผู้จัดการรับลีดนี้ ทีม Recruiting ควรติดต่อผู้สมัครโดยตรง หรือจับคู่ใหม่</p>${b('contacted', 'บริษัทติดต่อแล้ว', 'btn-primary')}${b('ask:match', 'จับคู่ผู้จัดการใหม่')}${b('ask:reject', 'ไม่ผ่าน', 'btn-text')}`;
  if (s === 'applied') return b('agent', 'อนุมัติเป็นตัวแทนใหม่', 'btn-primary') + b('ask:reject', 'ไม่ผ่าน', 'btn-text');
  if (s === 'rejected') return b('reopen', 'เปิดพิจารณาใหม่');
  if (s === 'agent') return '<p class="muted">เป็นตัวแทนใหม่แล้ว 🎉</p>';
  return progress + b('ask:match', c.manager_id ? 'เปลี่ยนผู้จัดการ' : 'จับคู่ผู้จัดการ') + b('ask:reject', 'ไม่ผ่าน', 'btn-text');
}
function detail(id) {
  const c = D.candidates.find(x => x.id === id), dlg = $('#dlg');
  if (!c) { dlg.close(); openId = null; return; }
  if (openId !== id) askMode = null;
  openId = id;
  const m = D.users.find(u => u.id === c.manager_id), acts = D.activities.filter(a => a.candidate_id === id);
  const tel = c.phone.replace(/\D/g, ''), fact = (k, v) => `<div><dt>${k}</dt><dd>${v}</dd></div>`;
  const sms = m?.phone && isAdmin() && c.stage === 'assigned' ? `sms:${m.phone}?&body=${encodeURIComponent(`[Recruit Hub] มีผู้สมัครใหม่ส่งให้คุณ: ${c.name} (${c.province}) กรุณาติดต่อภายใน ${SLA_DAYS} วัน ดูรายละเอียดที่ ${new URL('portal.html', location.href)}`)}` : '';
  dlg.innerHTML = `<div class="dt">
    <header class="dt-head"><div><h2>${esc(c.name)} ${gradeTag(c.grade)}</h2>
      <p><span class="tag st-${c.stage}">${stageLabel(c.stage)}</span> ${slaTag(c)} <span class="muted">รหัส ${esc(c.track_code)}</span></p></div>
      <button class="btn btn-text" data-do="close" aria-label="ปิด">✕</button></header>
    <div class="row contact"><a class="btn btn-sm" href="tel:${tel}">โทร ${esc(c.phone)}</a>
      ${c.line_id ? `<a class="btn btn-sm" href="https://line.me/ti/p/~${encodeURIComponent(c.line_id)}" target="_blank" rel="noopener">LINE ${esc(c.line_id)}</a>` : ''}
      ${c.email ? `<a class="btn btn-sm" href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : ''}</div>
    <dl class="facts">${fact('จังหวัด', esc(c.province || '-'))}${fact('แนวทาง', esc(styleLabel(c.style)) + ' · ' + label(WORK_MODES, c.work_mode))}${fact('ช่วงอายุ', label(AGES, c.age_range))}
      ${fact('อาชีพปัจจุบัน', esc(c.occupation || '-'))}${fact('ที่มา', esc(sourceLabel(c.source)) + (c.campaign ? ` · ${esc(c.campaign)}` : ''))}${fact('ผู้แนะนำ', esc(c.ref_code || '-'))}
      ${fact('ผู้จัดการ', m ? esc(m.name) + (c.queue?.length > 1 ? ` <small>(ลำดับ ${c.queue_pos + 1}/${c.queue.length})</small>` : '') : '-')}${fact('ลงทะเบียน', fmtDate(c.created_at, true))}${c.appt_at ? fact('นัดสัมภาษณ์', fmtDate(c.appt_at, true)) : ''}</dl>
    ${c.expectation ? `<blockquote>“${esc(c.expectation)}”</blockquote>` : ''}
    <div class="bars sm">${DIMS.map(d => `<div class="bar-row"><span>${d.label}</span><div class="bar"><i style="width:${c.scores?.[d.id] || 0}%"></i></div><b>${c.scores?.[d.id] ?? 0}%</b></div>`).join('')}</div>
    ${c.reject_reason ? `<p class="note">เหตุผล: ${esc(c.reject_reason)}</p>` : ''}
    <section class="dt-act"><div class="acts">${actions(c)}</div>${sms ? `<a class="btn btn-sm" href="${esc(sms)}">แจ้งผู้จัดการทาง SMS</a>` : ''}</section>
    <form class="note-form" id="note"><input name="note" placeholder="เพิ่มบันทึกการติดตาม" maxlength="500" required><button class="btn btn-sm" type="submit">บันทึก</button></form>
    <ul class="timeline">${acts.map(a => `<li><b>${ACT_LABEL[a.type] || esc(a.type)}</b> <span class="muted">${esc(a.actor)} · ${fmtDate(a.at, true)}</span>${a.note ? `<p>${esc(a.note)}</p>` : ''}</li>`).join('')}</ul>
  </div>`;
  if (!dlg.open) dlg.showModal();
  const act = (action, data, msg) => { askMode = null; return run(() => api.action(id, action, data), msg); };
  $$('[data-do]', dlg).forEach(b => b.onclick = () => {
    const d = b.dataset.do;
    if (d === 'close') { dlg.close(); openId = null; askMode = null; }
    else if (d === 'cancel') { askMode = null; detail(id); }
    else if (d.startsWith('ask:')) { askMode = d.slice(4); detail(id); }
    else act(d, {}, 'บันทึกแล้ว');
  });
  $$('[data-assign]', dlg).forEach(b => b.onclick = () => {
    const second = matchManagers(c, D.users, D.candidates).filter(x => x.eligible && x.user.id !== b.dataset.assign).slice(0, QUEUE_SIZE - 1).map(x => x.user.id);
    act('assign', { queue: [b.dataset.assign, ...second] }, 'ส่งลีดให้ผู้จัดการแล้ว');
  });
  if ($('#ask', dlg)) $('#ask', dlg).onsubmit = e => {
    e.preventDefault(); const v = Object.fromEntries(new FormData(e.target)), mode = askMode;
    if (mode === 'interview') v.appt_at = new Date(v.appt_at).toISOString();
    act(mode, v, 'บันทึกแล้ว');
  };
  $('#note', dlg).onsubmit = e => { e.preventDefault(); act('note', { note: new FormData(e.target).get('note') }, 'เพิ่มบันทึกแล้ว'); };
  dlg.oncancel = () => { openId = null; askMode = null; };
}

// ---------- แคมเปญ & ลิงก์ (Awareness toolkit) ----------
const CAPTIONS = [
  ['โพสต์เปิดประเด็น', (l, c) => `เคยคิดไหมว่า ถ้าได้กำหนดรายได้และเวลาทำงานเอง ชีวิตจะเปลี่ยนไปแค่ไหน\n\n${c ? c + '\n\n' : ''}ลองทำแบบประเมิน 2 นาที ดูว่าอาชีพที่ปรึกษาการเงินเหมาะกับคุณหรือไม่ ไม่มีค่าใช้จ่าย ไม่ผูกมัด\n👉 ${l}`],
  ['เล่าเรื่องของตัวเอง', l => `ก่อนมาทำอาชีพนี้ ผม/ดิฉันก็เคยลังเลเหมือนกัน\nสิ่งที่ช่วยให้ตัดสินใจได้คือการได้ลองประเมินตัวเองและคุยกับคนที่ทำจริง\n\nถ้าคุณกำลังมองหาโอกาสใหม่ เริ่มจากแบบประเมินสั้น ๆ นี้ได้เลย แล้วมาคุยกัน\n${l}`],
  ['ข้อความสั้นสำหรับ LINE', l => `ชวนลองทำแบบประเมิน 2 นาที ว่าคุณเหมาะกับอาชีพที่ปรึกษาการเงินแค่ไหน รู้ผลทันที 🙂\n${l}`]
];
function kit() {
  const adm = isAdmin(), k = F.kit, camps = D.campaigns.filter(c => c.active);
  if (!adm) k.ref = D.me.code;
  if (k.campaign && !camps.some(c => c.id === k.campaign)) k.campaign = '';
  if (!k.campaign && camps[0]) k.campaign = camps[0].id;
  const camp = camps.find(c => c.id === k.campaign), url = landingUrl(k);
  $('#view').innerHTML = head('แคมเปญ & ลิงก์', 'สร้างลิงก์ติดตามที่มา QR และข้อความพร้อมโพสต์ สำหรับทุกช่องทาง', adm ? '<button class="btn btn-sm btn-primary" data-camp="">+ แคมเปญใหม่</button>' : '') + `
  ${adm ? `<section class="panel"><h2>แคมเปญ</h2><div class="tbl-wrap"><table class="tbl"><thead><tr><th>แคมเปญ</th><th>ช่วงเวลา</th><th class="r">ลีด</th><th class="r">Qualified</th><th></th></tr></thead><tbody>
    ${D.campaigns.map(c => { const l = D.candidates.filter(x => x.campaign === c.id); return `<tr><td><b>${esc(c.name)}</b> ${c.active ? '' : '<span class="tag mute">ปิด</span>'}<small>${esc(c.message || '')}</small></td>
      <td>${c.starts_on ? fmtDate(c.starts_on) : '-'} – ${c.ends_on ? fmtDate(c.ends_on) : '-'}</td><td class="r">${l.length}</td><td class="r">${l.filter(x => x.reached >= 1).length}</td>
      <td class="r"><button class="btn btn-sm" data-camp="${esc(c.id)}">แก้ไข</button></td></tr>`; }).join('') || '<tr><td colspan="5" class="empty">ยังไม่มีแคมเปญ กด “+ แคมเปญใหม่” เพื่อเริ่ม</td></tr>'}</tbody></table></div></section>` : ''}
  <section class="panel kit"><h2>สร้างลิงก์สำหรับเผยแพร่</h2>
    <div class="kit-grid"><div class="form">
      <label>แคมเปญ<select id="kc"><option value="">ไม่ระบุ</option>${camps.map(c => `<option value="${esc(c.id)}"${k.campaign === c.id ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>
      <label>ช่องทางที่จะเผยแพร่<select id="ks">${SOURCES.filter(s => s.id !== 'direct').map(s => `<option value="${s.id}"${k.source === s.id ? ' selected' : ''}>${s.label} — ${s.hint}</option>`).join('')}</select></label>
      ${adm ? `<label>ผู้แนะนำ (ลีดจากลิงก์นี้จะเสนอผู้จัดการคนนี้เป็นลำดับแรก)<select id="kr"><option value="">ไม่ระบุ — ลิงก์กลางของบริษัท</option>${D.users.filter(u => u.role === 'manager' && u.active).map(u => `<option value="${esc(u.code)}"${k.ref === u.code ? ' selected' : ''}>${esc(u.name)} (${esc(u.code)})</option>`).join('')}</select></label>`
        : `<p class="note">ลิงก์นี้มีรหัสแนะนำของคุณ <b>${esc(D.me.code)}</b> ผู้สมัครที่เข้ามาจะถูกเสนอให้คุณเป็นลำดับแรก</p>`}
      <label>ลิงก์<input readonly id="url" value="${esc(url)}"></label>
      <div class="row"><button class="btn btn-primary" data-copy="url">คัดลอกลิงก์</button><a class="btn" href="${esc(url)}" target="_blank" rel="noopener">เปิดดูหน้า Landing</a></div>
    </div><div class="qr"><div id="qr">${qrSvg(url, 200)}</div><button class="btn btn-sm" id="qrdl">ดาวน์โหลด QR</button><small class="muted">สำหรับสิ่งพิมพ์ บูธ และสไลด์</small></div></div>
    <h3>ข้อความพร้อมโพสต์</h3>
    <div class="grid g3">${CAPTIONS.map(([t, fn], i) => `<article class="card cap"><h4>${t}</h4><pre id="cap${i}">${esc(fn(url, camp?.message))}</pre><button class="btn btn-sm" data-copy="cap${i}">คัดลอกข้อความ</button></article>`).join('')}</div>
    <p class="small muted">ก่อนเผยแพร่ ตรวจข้อความให้เป็นไปตามแนวปฏิบัติด้านการโฆษณาของบริษัทและ คปภ. และหลีกเลี่ยงการรับประกันรายได้</p>
  </section>`;
  const set = (id, key) => { if ($(id)) $(id).onchange = e => { k[key] = e.target.value; kit(); }; };
  set('#kc', 'campaign'); set('#ks', 'source'); set('#kr', 'ref');
  $$('[data-copy]').forEach(b => b.onclick = () => { const el = $('#' + b.dataset.copy); copy(el.value ?? el.textContent); });
  $('#qrdl').onclick = () => {
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([qrSvg(url, 1000)], { type: 'image/svg+xml' })), download: `qr-${k.source}${k.ref ? '-' + k.ref : ''}.svg` });
    a.click(); URL.revokeObjectURL(a.href);
  };
  $$('[data-camp]').forEach(b => b.onclick = () => campForm(D.campaigns.find(c => c.id === b.dataset.camp)));
}
function campForm(c) {
  const dlg = $('#dlg'); openId = null;
  dlg.innerHTML = `<form class="dt form" id="cf"><header class="dt-head"><h2>${c ? 'แก้ไขแคมเปญ' : 'แคมเปญใหม่'}</h2><button type="button" class="btn btn-text" id="x" aria-label="ปิด">✕</button></header>
    <label>ชื่อแคมเปญ *<input name="name" required maxlength="80" value="${esc(c?.name)}"></label>
    <label>รหัสในลิงก์ * <small class="muted">ตัวพิมพ์เล็ก ตัวเลข และ - เท่านั้น เปลี่ยนภายหลังไม่ได้</small><input name="id" required pattern="[a-z0-9\\-]{2,24}" value="${esc(c?.id)}" ${c ? 'readonly' : ''} placeholder="เช่น q1-2027"></label>
    <label>ข้อความแคมเปญ (แสดงบนหน้า Landing)<textarea name="message" rows="2" maxlength="300">${esc(c?.message)}</textarea></label>
    <div class="f2"><label>เริ่ม<input type="date" name="starts_on" value="${esc(c?.starts_on || '')}"></label><label>สิ้นสุด<input type="date" name="ends_on" value="${esc(c?.ends_on || '')}"></label></div>
    <label class="check"><input type="checkbox" name="active" ${!c || c.active ? 'checked' : ''}><span>เปิดใช้งาน</span></label>
    <button class="btn btn-primary" type="submit">บันทึก</button></form>`;
  dlg.showModal(); $('#x').onclick = () => dlg.close();
  $('#cf').onsubmit = async e => {
    e.preventDefault(); const v = Object.fromEntries(new FormData(e.target)); v.active = !!v.active;
    if (await run(() => api.saveCampaign(v), 'บันทึกแคมเปญแล้ว')) dlg.close();
  };
}

// ---------- ผู้จัดการ ----------
function managers() {
  const ms = D.users.filter(u => u.role === 'manager'), admins = D.users.filter(u => u.role === 'admin');
  const row = u => { const open = D.candidates.filter(c => c.manager_id === u.id && OPEN_STAGES.includes(c.stage)).length;
    return `<tr><td><b>${esc(u.name)}</b> ${u.active ? '' : '<span class="tag mute">ปิดบัญชี</span>'}<small>${esc(u.code)} · ${esc(u.phone || 'ไม่มีเบอร์')}</small></td>
    <td>${(u.provinces || []).map(esc).join(', ') || '-'}</td><td>${(u.styles || []).map(s => esc(styleLabel(s))).join(', ') || '-'}</td>
    <td class="r">${Number(u.rating).toFixed(1)}</td><td class="r">${open} / ${u.capacity}</td>
    <td>${u.in_campaign ? '<span class="tag ok">ในแคมเปญ</span>' : '<span class="tag mute">นอกแคมเปญ</span>'} ${u.validated ? '' : '<span class="tag warn">ผลงานไม่ผ่าน</span>'}</td>
    <td class="r"><button class="btn btn-sm" data-user="${u.id}">แก้ไข</button></td></tr>`; };
  $('#view').innerHTML = head('ผู้จัดการ', 'ผู้ที่รับลีด และเกณฑ์ที่ใช้จับคู่: พื้นที่ แนวทางการขาย Rating และเงื่อนไขแคมเปญ',
    '<button class="btn btn-sm" data-user="" data-role="admin">+ ผู้ดูแล</button><button class="btn btn-sm btn-primary" data-user="" data-role="manager">+ ผู้จัดการ</button>') + `
  <div class="tbl-wrap"><table class="tbl"><thead><tr><th>ผู้จัดการ</th><th>จังหวัดที่ดูแล</th><th>แนวทางของทีม</th><th class="r">Rating</th><th class="r">ถือลีด</th><th>สถานะ</th><th></th></tr></thead>
  <tbody>${ms.map(row).join('') || '<tr><td colspan="7" class="empty">ยังไม่มีผู้จัดการ กด “+ ผู้จัดการ” เพื่อเพิ่มคนแรก</td></tr>'}</tbody></table></div>
  <section class="panel"><h2>ผู้ดูแลระบบ</h2><ul class="plain">${admins.map(u => `<li><b>${esc(u.name)}</b> <span class="muted">${esc(u.code)}</span> ${u.active ? '' : '<span class="tag mute">ปิดบัญชี</span>'} <button class="btn btn-sm btn-text" data-user="${u.id}">แก้ไข</button></li>`).join('')}</ul></section>`;
  $$('[data-user]').forEach(b => b.onclick = () => userForm(D.users.find(u => u.id === b.dataset.user), b.dataset.role));
}
function userForm(u, role) {
  const dlg = $('#dlg'); openId = null; role = u?.role || role || 'manager'; const mgr = role === 'manager';
  dlg.innerHTML = `<form class="dt form" id="uf"><header class="dt-head"><h2>${u ? 'แก้ไข' : 'เพิ่ม'}${mgr ? 'ผู้จัดการ' : 'ผู้ดูแล'}</h2><button type="button" class="btn btn-text" id="x" aria-label="ปิด">✕</button></header>
    <div class="f2"><label>ชื่อที่แสดง *<input name="name" required maxlength="80" value="${esc(u?.name)}"></label>
    <label>รหัสผู้ใช้ * <small class="muted">${mgr ? 'ใช้เข้าระบบและเป็นรหัสแนะนำ' : 'ใช้เข้าระบบ'}</small><input name="code" required pattern="[A-Za-z0-9]{3,12}" value="${esc(u?.code)}" ${u ? 'readonly' : ''} style="text-transform:uppercase"></label></div>
    <div class="f2"><label>เบอร์โทร<input name="phone" inputmode="tel" value="${esc(u?.phone)}"></label><label>LINE ID<input name="line_id" value="${esc(u?.line_id)}"></label></div>
    <label>อีเมล<input name="email" type="email" value="${esc(u?.email)}"></label>
    ${mgr ? `<label>จังหวัดที่ดูแล <small class="muted">เลือกได้หลายจังหวัด (กด Ctrl/⌘ ค้าง)</small><select name="provinces" multiple size="6">${provinceOptions(u?.provinces || [])}</select></label>
    <fieldset><legend>แนวทางการขายของทีม</legend><div class="checks">${STYLES.map(s => `<label class="check"><input type="checkbox" name="styles" value="${s.id}"${(u?.styles || []).includes(s.id) ? ' checked' : ''}><span>${s.label}</span></label>`).join('')}</div></fieldset>
    <div class="f2"><label>Rating (0–5)<input name="rating" type="number" min="0" max="5" step="0.1" value="${u?.rating ?? 3}"></label><label>รับลีดพร้อมกันได้<input name="capacity" type="number" min="0" max="500" value="${u?.capacity ?? 10}"></label></div>
    <label class="check"><input type="checkbox" name="in_campaign" ${!u || u.in_campaign ? 'checked' : ''}><span>เข้าร่วมแคมเปญรับลีด</span></label>
    <label class="check"><input type="checkbox" name="validated" ${!u || u.validated ? 'checked' : ''}><span>ผลงานผ่านเงื่อนไขแคมเปญ</span></label>` : ''}
    <label class="check"><input type="checkbox" name="active" ${!u || u.active ? 'checked' : ''}><span>เปิดใช้งานบัญชี</span></label>
    <label>${u ? 'ตั้งรหัสผ่านใหม่ (เว้นว่าง = ไม่เปลี่ยน)' : 'รหัสผ่านเริ่มต้น *'}<input name="password" type="password" minlength="8" autocomplete="new-password" ${u ? '' : 'required'}></label>
    <button class="btn btn-primary" type="submit">บันทึก</button></form>`;
  dlg.showModal(); $('#x').onclick = () => dlg.close();
  $('#uf').onsubmit = async e => {
    e.preventDefault(); const fd = new FormData(e.target), v = Object.fromEntries(fd);
    Object.assign(v, { id: u?.id || '', role, code: v.code.toUpperCase(), active: !!v.active });
    if (mgr) Object.assign(v, { provinces: fd.getAll('provinces'), styles: fd.getAll('styles'), rating: +v.rating, capacity: +v.capacity, in_campaign: !!v.in_campaign, validated: !!v.validated });
    if (await run(() => api.saveUser(v), 'บันทึกแล้ว')) dlg.close();
  };
}
function passwordForm() {
  const dlg = $('#dlg'); openId = null;
  dlg.innerHTML = `<form class="dt form" id="pf"><header class="dt-head"><h2>เปลี่ยนรหัสผ่าน</h2><button type="button" class="btn btn-text" id="x" aria-label="ปิด">✕</button></header>
    <label>รหัสผ่านปัจจุบัน<input name="old" type="password" required autocomplete="current-password"></label>
    <label>รหัสผ่านใหม่ (อย่างน้อย 8 ตัว)<input name="neu" type="password" required minlength="8" autocomplete="new-password"></label>
    <button class="btn btn-primary" type="submit">บันทึก</button></form>`;
  dlg.showModal(); $('#x').onclick = () => dlg.close();
  $('#pf').onsubmit = async e => { e.preventDefault(); const v = new FormData(e.target); if (await run(() => api.setPassword(v.get('old'), v.get('neu')), 'เปลี่ยนรหัสผ่านแล้ว')) dlg.close(); };
}

// ---------- Flow: แต่ละขั้นใช้เครื่องมืออะไร ใครรับผิดชอบ วัดผลด้วยอะไร ----------
const FLOW = [
  ['Awareness', 'Visitor', 'สร้างการรับรู้ผ่านโฆษณาและโพสต์ของตัวแทน', 'แคมเปญ & ลิงก์: ลิงก์ติดตามที่มา, QR, ข้อความพร้อมโพสต์, รหัสแนะนำรายผู้จัดการ', 'Recruiting + Manager', 'ยอดเข้าชมแยกช่องทาง'],
  ['Interest', 'Prospect', 'หน้า Landing เล่าว่าทำไมต้องประกัน ทำไมต้องบริษัทเรา', 'Landing: Why Insurance, 5 เหตุผล, Career Path, เครื่องคำนวณรายได้, Success Story, FAQ', 'Recruiting', 'อัตราเริ่มทำแบบประเมิน'],
  ['Consideration', 'Prospect', 'ผู้สนใจประเมินตัวเองและฝากข้อมูล', 'แบบประเมิน Attitude · Skill · Expectation, ฟอร์มลงทะเบียน (แนวทาง, จังหวัด, ความคาดหวัง, PDPA), รหัสติดตามสถานะ', 'ผู้สมัคร', 'จำนวนลีด, เกรด A/B/C'],
  ['Selection', 'Candidate', 'Admin ประเมิน แล้วจับคู่ผู้จัดการที่เหมาะที่สุด', `ลีด: ประเมิน Qualified, คะแนนจับคู่ (พื้นที่ · แนวทาง · Rating · ภาระงาน), SLA ${SLA_DAYS} วัน ส่งต่ออัตโนมัติ, บริษัทติดต่อเองเมื่อครบ ${SLA_DAYS * QUEUE_SIZE} วัน`, 'Recruiting Admin', 'Qualified Lead, เวลาติดต่อครั้งแรก'],
  ['Application', 'New Agent', 'ผู้จัดการติดต่อ สัมภาษณ์ และส่งผลการพิจารณา', 'ลีดของฉัน: โทร/LINE, บันทึกการติดตาม, นัดสัมภาษณ์, แบบฟอร์มผลการพิจารณา, Admin อนุมัติ', 'Manager → Admin', 'อัตราติดต่อ, สัมภาษณ์, ตัวแทนใหม่']
];
function flow() {
  $('#view').innerHTML = head('Flow การสรรหา', 'Candidate Journey 5 ขั้น และเครื่องมือที่รองรับแต่ละขั้น') + `
  <ol class="flow">${FLOW.map(([st, who, goal, tools, owner, kpi], i) => `<li><div class="flow-h"><span class="path-n">${i + 1}</span><div><h2>${st}</h2><span class="tag">${who}</span></div></div>
    <p>${goal}</p><dl><div><dt>เครื่องมือ</dt><dd>${tools}</dd></div><div><dt>ผู้รับผิดชอบ</dt><dd>${owner}</dd></div><div><dt>ตัวชี้วัด</dt><dd>${kpi}</dd></div></dl></li>`).join('')}</ol>
  <section class="panel"><h2>กติกาการส่งลีด</h2><ul class="plain rules">
    <li>ลีดใหม่ทุกคนต้องผ่านการประเมินของ Admin ก่อนส่งให้ผู้จัดการ</li>
    <li>ผู้จัดการที่ถูกเสนอ ต้องอยู่ในแคมเปญ ผลงานผ่านเงื่อนไข และยังรับลีดไหว</li>
    <li>ผู้สมัครที่มาจากลิงก์ของผู้จัดการคนใด คนนั้นได้สิทธิ์ลำดับแรก</li>
    <li>ผู้จัดการลำดับ 1 ไม่บันทึกการติดต่อใน ${SLA_DAYS} วัน → ระบบส่งให้ลำดับ 2 เอง</li>
    <li>ครบ ${SLA_DAYS * QUEUE_SIZE} วันยังไม่มีใครติดต่อ → ลีดกลับมาที่ทีม Recruiting เพื่อให้บริษัทติดต่อโดยตรง</li></ul></section>`;
}

app.addEventListener('click', e => {
  const t = e.target.closest('[data-nav],[data-act]'); if (!t) return;
  if (t.dataset.nav) { view = t.dataset.nav; render(); scrollTo(0, 0); }
  else if (t.dataset.act === 'logout') api.logout().then(() => loginView());
  else if (t.dataset.act === 'password') passwordForm();
  else if (t.dataset.act === 'csv') exportCsv();
});
boot();
