// หน้า Landing ของผู้สมัคร: Interest → Consideration (ประเมินตัวเอง + ลงทะเบียน) → รอผู้จัดการติดต่อ
import { CFG, $, $$, esc, STYLES, WORK_MODES, AGES, DIMS, QUESTIONS, GRADE_INFO, SLA_DAYS, scorePrescreen, provinceOptions, stageLabel, fmtDate, toast } from './logic.js';
import { api, live } from './api.js';

const app = $('#app');
const co = esc(CFG.company || 'บริษัท');

// ที่มาของผู้เข้าชม: อ่านจาก URL ครั้งแรกแล้วจำไว้ตลอดการเข้าชมครั้งนี้
const qs = new URLSearchParams(location.search);
const src = (() => {
  let s = null; try { s = JSON.parse(sessionStorage.getItem('rc_src')); } catch { /* ยังไม่มี */ }
  if (!s || qs.has('s') || qs.has('c') || qs.has('ref')) {
    s = { source: (qs.get('s') || (qs.get('ref') ? 'agent_post' : 'direct')).slice(0, 24), campaign: (qs.get('c') || '').slice(0, 24), ref: (qs.get('ref') || '').toUpperCase().slice(0, 12) };
    sessionStorage.setItem('rc_src', JSON.stringify(s));
  }
  return s;
})();
const once = type => {
  if (sessionStorage.getItem('rc_ev_' + type)) return;
  sessionStorage.setItem('rc_ev_' + type, '1');
  api.track({ type, source: src.source, campaign: src.campaign, ref: src.ref });
};
const draft = {
  get: () => { try { return JSON.parse(sessionStorage.getItem('rc_draft')) || {}; } catch { return {}; } },
  set: v => sessionStorage.setItem('rc_draft', JSON.stringify({ ...draft.get(), ...v }))
};
let info = { ref_name: null, campaign: null };

const header = () => `
<header class="lp-top">
  <a class="brand" href="#"><span class="brand-mark">${co.slice(0, 1)}</span><span>${co} <small>Agency Career</small></span></a>
  <nav><a href="#status">ตรวจสถานะ</a><a class="btn btn-accent btn-sm" href="#screen">เริ่มประเมิน</a></nav>
</header>`;
const footer = () => {
  const c = CFG.contact || {};
  return `<footer class="lp-foot">
  <div><strong>${co}</strong> · ${esc(CFG.product || '')}</div>
  <div class="muted">${[c.phone && `โทร ${esc(c.phone)}`, c.line && `LINE ${esc(c.line)}`, c.email && esc(c.email)].filter(Boolean).join(' · ')}</div>
  <div class="muted small">ตัวเลขรายได้ในหน้านี้เป็นการประมาณการจากสมมติฐาน ไม่ใช่การรับประกันรายได้ ผลตอบแทนจริงขึ้นกับผลงานและเงื่อนไขของบริษัท
  ${CFG.privacyUrl ? ` · <a href="${esc(CFG.privacyUrl)}" target="_blank" rel="noopener">นโยบายความเป็นส่วนตัว</a>` : ''}
  · <a href="portal.html">สำหรับทีม Recruiter</a></div>
</footer>`;
};
const cards = (items, cls = '') => items.map(x => `<article class="card ${cls}"><div class="card-ico" aria-hidden="true">${esc(x.icon || '')}</div><h3>${esc(x.title)}</h3><p>${esc(x.body)}</p></article>`).join('');

// ---------- หน้าแรก (Interest) ----------
function home() {
  once('visit');
  const h = CFG.hero || {}, inc = CFG.income || {};
  app.innerHTML = `${header()}
<section class="hero">
  <div class="wrap">
    ${info.ref_name ? `<p class="invite">คุณได้รับคำเชิญจาก <strong>${esc(info.ref_name)}</strong></p>` : ''}
    <p class="eyebrow">${esc(h.eyebrow || '')} · ${co}</p>
    <h1>${esc(h.title || '')}</h1>
    <p class="lead">${esc(h.sub || '')}</p>
    <div class="row"><a class="btn btn-accent btn-lg" href="#screen">ประเมินตัวเองใน 2 นาที</a><a class="btn btn-ghost btn-lg" href="#why">อาชีพนี้ให้อะไร</a></div>
    <ul class="hero-steps"><li><b>1</b> ประเมินตัวเอง</li><li><b>2</b> ลงทะเบียน</li><li><b>3</b> ผู้จัดการใกล้คุณติดต่อกลับใน ${SLA_DAYS} วัน</li></ul>
  </div>
</section>
${info.campaign?.message ? `<section class="band"><div class="wrap"><span class="tag">${esc(info.campaign.name)}</span> ${esc(info.campaign.message)}</div></section>` : ''}
<section class="sec" id="why"><div class="wrap">
  <p class="eyebrow">Why Insurance</p><h2>ทำไมคนไทยต้องการที่ปรึกษามากขึ้นทุกปี</h2>
  <div class="grid g4">${cards(CFG.whyInsurance || [])}</div>
</div></section>
<section class="sec alt"><div class="wrap">
  <p class="eyebrow">Why ${co}</p><h2>${(CFG.whyUs || []).length} เหตุผลที่ควรเริ่มกับ ${co}</h2>
  <div class="scroller">${cards(CFG.whyUs || [], 'snap')}</div>
  <a class="btn btn-accent" href="#screen">สนใจ — เริ่มประเมินตัวเอง</a>
</div></section>
<section class="sec"><div class="wrap">
  <p class="eyebrow">Career Path</p><h2>เส้นทางที่โตได้ด้วยผลงานของคุณเอง</h2>
  <ol class="path">${(CFG.careerPath || []).map((p, i) => `<li><span class="path-n">${i + 1}</span><h3>${esc(p.title)}</h3><p>${esc(p.body)}</p></li>`).join('')}</ol>
</div></section>
<section class="sec alt" id="income"><div class="wrap two">
  <div><p class="eyebrow">Income Simulator</p><h2>ลองคำนวณรายได้จากเป้าหมายของคุณ</h2>
    <p class="muted">ปรับจำนวนลูกค้าและเบี้ยเฉลี่ยเพื่อดูค่าคอมมิชชันปีแรกโดยประมาณ</p></div>
  <div class="calc card">
    <label>ลูกค้าใหม่ต่อเดือน <output id="oCases"></output><input type="range" id="iCases" min="1" max="15" value="${inc.defaultCases || 4}"></label>
    <label>เบี้ยประกันเฉลี่ยต่อราย (บาท/ปี) <output id="oPrem"></output><input type="range" id="iPrem" min="10000" max="150000" step="5000" value="${inc.defaultPremium || 30000}"></label>
    <div class="calc-out"><span>ค่าคอมมิชชันปีแรกโดยประมาณ</span><strong id="oInc"></strong><span class="muted">ต่อเดือน</span></div>
    <p class="small muted">สมมติฐาน: ค่าคอมมิชชันปีแรก ${Math.round((inc.commissionRate || 0.3) * 100)}% ของเบี้ยปีแรก ไม่รวมโบนัส ค่าคอมมิชชันปีต่ออายุ และภาษี · ไม่ใช่การรับประกันรายได้</p>
  </div>
</div></section>
<section class="sec"><div class="wrap">
  <p class="eyebrow">Success Story</p><h2>เรื่องราวจากคนที่เปลี่ยนโอกาสของตัวเอง</h2>
  <div class="grid g3">${(CFG.stories || []).map(s => `<article class="card story">
    ${s.youtube ? `<a class="vid" href="https://www.youtube.com/watch?v=${esc(s.youtube)}" target="_blank" rel="noopener" style="background-image:url(https://i.ytimg.com/vi/${esc(s.youtube)}/hqdefault.jpg)"><span class="play" aria-label="เล่นวิดีโอ">▶</span></a>` : `<div class="vid empty"><span class="play">▶</span></div>`}
    <p>“${esc(s.quote)}”</p><h3>${esc(s.name)}</h3></article>`).join('')}</div>
</div></section>
<section class="sec alt"><div class="wrap narrow">
  <p class="eyebrow">FAQ</p><h2>คำถามที่พบบ่อย</h2>
  ${(CFG.faq || []).map(f => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}
</div></section>
<section class="cta"><div class="wrap"><h2>พร้อมเปลี่ยนโอกาสของคุณหรือยัง</h2>
  <p>ตอบ ${QUESTIONS.length} คำถาม รู้ผลทันทีว่าอาชีพนี้เหมาะกับคุณแค่ไหน</p>
  <a class="btn btn-accent btn-lg" href="#screen">เริ่มประเมินตัวเอง</a></div></section>
${footer()}`;
  const baht = n => Math.round(n).toLocaleString('th-TH') + ' บาท';
  const calc = () => {
    const c = +$('#iCases').value, p = +$('#iPrem').value;
    $('#oCases').textContent = c + ' ราย'; $('#oPrem').textContent = p.toLocaleString('th-TH');
    $('#oInc').textContent = baht(c * p * (inc.commissionRate || 0.3));
  };
  $('#iCases').oninput = $('#iPrem').oninput = calc; calc();
}

// ---------- แบบประเมินตัวเอง (Consideration: Why You) ----------
function screen() {
  once('prescreen_start');
  const answers = draft.get().answers || [];
  let i = Math.min(answers.length, QUESTIONS.length - 1);
  const draw = () => {
    const q = QUESTIONS[i], dim = DIMS.find(d => d.id === q.d);
    app.innerHTML = `${header()}<section class="sec"><div class="wrap narrow">
      ${i === 0 ? `<div class="card quals"><h3>คุณสมบัติเบื้องต้น</h3><ul>${(CFG.qualifications || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
      <div class="card quiz">
        <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${QUESTIONS.length}" aria-valuenow="${i}"><i style="width:${i / QUESTIONS.length * 100}%"></i></div>
        <p class="eyebrow">ข้อ ${i + 1} จาก ${QUESTIONS.length} · ${dim.label} (${dim.en})</p>
        <h2 class="q">${esc(q.q)}</h2>
        <div class="scale" role="radiogroup" aria-label="ระดับความเห็นด้วย">${[1, 2, 3, 4, 5].map(n => `<button type="button" class="${answers[i] === n ? 'on' : ''}" data-n="${n}" role="radio" aria-checked="${answers[i] === n}">${n}</button>`).join('')}</div>
        <div class="scale-lbl"><span>ไม่ใช่ฉันเลย</span><span>ใช่ฉันมาก</span></div>
        ${i > 0 ? '<button type="button" class="btn btn-text" id="back">← ข้อก่อนหน้า</button>' : ''}
      </div></div></section>`;
    $$('.scale button').forEach(b => b.onclick = () => {
      answers[i] = +b.dataset.n; draft.set({ answers });
      if (i < QUESTIONS.length - 1) { i++; draw(); } else { once('prescreen_done'); location.hash = '#result'; }
    });
    if ($('#back')) $('#back').onclick = () => { i--; draw(); };
  };
  draw();
}

function result() {
  const answers = draft.get().answers || [];
  if (answers.filter(Boolean).length < QUESTIONS.length) return void (location.hash = '#screen');
  const s = scorePrescreen(answers), g = GRADE_INFO[s.grade];
  app.innerHTML = `${header()}<section class="sec"><div class="wrap narrow"><div class="card">
    <p class="eyebrow">ผลประเมินตัวเอง</p><h2>${g.title}</h2><p>${g.body}</p>
    <div class="bars">${DIMS.map(d => `<div class="bar-row"><span>${d.label}</span><div class="bar"><i style="width:${s[d.id]}%"></i></div><b>${s[d.id]}%</b></div>`).join('')}</div>
    <p class="small muted">ผลนี้เป็นการประเมินตัวเองเบื้องต้น ไม่ใช่ผลการคัดเลือก</p>
    <div class="row"><a class="btn btn-accent btn-lg" href="#register">ลงทะเบียนคุยกับผู้จัดการ</a><button class="btn btn-text" id="redo">ทำใหม่</button></div>
  </div></div></section>${footer()}`;
  $('#redo').onclick = () => { draft.set({ answers: [] }); location.hash = '#screen'; };
}

// ---------- ลงทะเบียน (Leave Your Profile) ----------
function register() {
  once('register_open');
  const d = draft.get(), f = d.form || {};
  const answers = d.answers || [], done = answers.filter(Boolean).length === QUESTIONS.length;
  app.innerHTML = `${header()}<section class="sec"><div class="wrap narrow">
  <form class="card form" id="reg" novalidate>
    <p class="eyebrow">Register</p><h2>บอกเราเกี่ยวกับคุณ</h2>
    ${done ? '' : '<p class="note">คุณยังไม่ได้ทำแบบประเมินตัวเอง <a href="#screen">ทำก่อน 2 นาที</a> เพื่อให้เราจับคู่ผู้จัดการได้ตรงขึ้น</p>'}
    <fieldset><legend>ข้อมูลทั่วไป</legend>
      <label>ชื่อ-นามสกุล *<input name="name" required autocomplete="name" value="${esc(f.name)}"></label>
      <div class="f2"><label>เบอร์โทรศัพท์ *<input name="phone" required inputmode="tel" autocomplete="tel" placeholder="08xxxxxxxx" value="${esc(f.phone)}"></label>
      <label>LINE ID<input name="line_id" autocomplete="off" value="${esc(f.line_id)}"></label></div>
      <div class="f2"><label>อีเมล<input name="email" type="email" autocomplete="email" value="${esc(f.email)}"></label>
      <label>ช่วงอายุ *<select name="age_range" required><option value="">เลือก</option>${AGES.map(a => `<option value="${a.id}"${f.age_range === a.id ? ' selected' : ''}>${a.label}</option>`).join('')}</select></label></div>
      <label>อาชีพปัจจุบัน<input name="occupation" value="${esc(f.occupation)}"></label>
      <label>รหัสผู้แนะนำ (ถ้ามี)<input name="ref_code" maxlength="12" value="${esc(f.ref_code ?? src.ref)}" style="text-transform:uppercase"></label>
    </fieldset>
    <fieldset><legend>เลือกแนวทางการทำงานที่สนใจ *</legend>
      <div class="pick">${STYLES.map(s => `<label class="pick-card"><input type="radio" name="style" value="${s.id}" required${f.style === s.id ? ' checked' : ''}><span class="pick-ico" aria-hidden="true">${s.icon}</span><b>${s.label}</b><small>${s.desc}</small></label>`).join('')}</div>
      <div class="seg" role="radiogroup" aria-label="รูปแบบการทำงาน">${WORK_MODES.map((m, i) => `<label><input type="radio" name="work_mode" value="${m.id}"${(f.work_mode || 'full') === m.id || (!f.work_mode && i === 0) ? ' checked' : ''}><span>${m.label}</span></label>`).join('')}</div>
    </fieldset>
    <fieldset><legend>พื้นที่และความคาดหวัง</legend>
      <label>จังหวัดที่ต้องการทำงาน *<select name="province" required><option value="">เลือกจังหวัด</option>${provinceOptions(f.province ? [f.province] : [])}</select></label>
      <label>คุณคาดหวังอะไรจากอาชีพนี้<textarea name="expectation" rows="3" maxlength="500" placeholder="เช่น รายได้เสริมเดือนละ 20,000 บาท, อยากมีเวลาให้ครอบครัว">${esc(f.expectation)}</textarea></label>
    </fieldset>
    <label class="check"><input type="checkbox" name="consent" required><span>ข้าพเจ้ายินยอมให้ ${co} เก็บและใช้ข้อมูลข้างต้นเพื่อพิจารณาและติดต่อเกี่ยวกับโอกาสเป็นตัวแทน และส่งต่อข้อมูลให้ผู้จัดการที่ได้รับมอบหมาย${CFG.privacyUrl ? ` ตาม<a href="${esc(CFG.privacyUrl)}" target="_blank" rel="noopener">นโยบายความเป็นส่วนตัว</a>` : ''} *</span></label>
    <p class="err" id="err" role="alert"></p>
    <button class="btn btn-accent btn-lg" type="submit">ส่งข้อมูล</button>
  </form></div></section>${footer()}`;
  const form = $('#reg');
  form.oninput = () => draft.set({ form: Object.fromEntries(new FormData(form)) });
  form.onsubmit = async e => {
    e.preventDefault();
    const v = Object.fromEntries(new FormData(form)), err = $('#err');
    const bad = !v.name?.trim() ? 'กรุณากรอกชื่อ-นามสกุล' : !/^0\d{8,9}$/.test((v.phone || '').replace(/\D/g, '')) ? 'เบอร์โทรศัพท์ไม่ถูกต้อง'
      : !v.age_range ? 'กรุณาเลือกช่วงอายุ' : !v.style ? 'กรุณาเลือกแนวทางการทำงาน' : !v.province ? 'กรุณาเลือกจังหวัด' : !v.consent ? 'กรุณายินยอมให้ใช้ข้อมูลก่อนส่ง' : '';
    if (bad) { err.textContent = bad; return; }
    const btn = $('button[type=submit]', form); btn.disabled = true; btn.textContent = 'กำลังส่ง…';
    try {
      const s = done ? scorePrescreen(answers, v.age_range) : { attitude: 0, skill: 0, expectation: 0 };
      const r = await api.register({ ...v, consent: true, scores: s, source: src.source, campaign: src.campaign });
      sessionStorage.setItem('rc_done', JSON.stringify({ ...r, phone4: v.phone.replace(/\D/g, '').slice(-4), name: v.name.trim().split(' ')[0] }));
      sessionStorage.removeItem('rc_draft'); location.hash = '#done';
    } catch (ex) { err.textContent = ex.message; btn.disabled = false; btn.textContent = 'ส่งข้อมูล'; }
  };
}

// ---------- How to Get Started ----------
const NEXT = [
  ['ทีม Recruiting ตรวจข้อมูล', 'ภายใน 1–2 วันทำการ'],
  ['จับคู่ผู้จัดการ', 'ตามจังหวัดและแนวทางที่คุณเลือก'],
  ['ผู้จัดการติดต่อคุณ', `ภายใน ${SLA_DAYS} วัน ทางโทรศัพท์หรือ LINE`],
  ['พูดคุยและยื่นใบสมัคร', 'นัดคุยรายละเอียด อบรม และเตรียมสอบใบอนุญาต']
];
function done() {
  let r = null; try { r = JSON.parse(sessionStorage.getItem('rc_done')); } catch { /* ไม่มี */ }
  if (!r) return void (location.hash = '');
  app.innerHTML = `${header()}<section class="sec"><div class="wrap narrow"><div class="card center">
    <div class="ok-ico" aria-hidden="true">✓</div>
    <h2>${r.dup ? 'เบอร์นี้ลงทะเบียนไว้แล้ว' : `ขอบคุณ คุณ${esc(r.name)}`}</h2>
    <p>${r.dup ? 'เรากำลังดำเนินการกับข้อมูลเดิมของคุณอยู่' : 'เราได้รับข้อมูลของคุณแล้ว'} เก็บรหัสนี้ไว้เพื่อตรวจสถานะ</p>
    <button class="code" id="copy" title="คัดลอก">${esc(r.track_code)}</button>
    <ol class="next">${NEXT.map(([a, b], i) => `<li><span class="path-n">${i + 1}</span><div><b>${a}</b><small>${b}</small></div></li>`).join('')}</ol>
    <p class="small muted">หากไม่มีผู้จัดการติดต่อภายใน 10 วัน ทีม Recruiting ของบริษัทจะติดต่อคุณโดยตรง</p>
    <a class="btn btn-ghost-dark" href="#status">ตรวจสถานะ</a>
  </div></div></section>${footer()}`;
  $('#copy').onclick = () => navigator.clipboard?.writeText(r.track_code).then(() => toast('คัดลอกรหัสแล้ว'));
}

const STATUS_TEXT = {
  new: 'ทีม Recruiting กำลังตรวจข้อมูลของคุณ', qualified: 'ผ่านการตรวจข้อมูลแล้ว กำลังจับคู่ผู้จัดการ',
  assigned: 'ส่งข้อมูลให้ผู้จัดการแล้ว รอการติดต่อ', contacted: 'ผู้จัดการติดต่อคุณแล้ว', interview: 'อยู่ในขั้นนัดพูดคุย',
  applied: 'ยื่นใบสมัครแล้ว รอการอนุมัติ', agent: 'ยินดีต้อนรับสู่ทีม', escalated: 'ทีม Recruiting ของบริษัทจะติดต่อคุณโดยตรง',
  rejected: 'ขอบคุณที่สนใจ ขณะนี้ยังไม่สามารถดำเนินการต่อได้'
};
function status() {
  let r = null; try { r = JSON.parse(sessionStorage.getItem('rc_done')); } catch { /* ไม่มี */ }
  app.innerHTML = `${header()}<section class="sec"><div class="wrap narrow"><form class="card form" id="st">
    <p class="eyebrow">Tracking</p><h2>ตรวจสถานะการสมัคร</h2>
    <div class="f2"><label>รหัสติดตาม<input name="code" required maxlength="6" value="${esc(r?.track_code)}" style="text-transform:uppercase"></label>
    <label>เบอร์โทร 4 ตัวท้าย<input name="p4" required inputmode="numeric" pattern="[0-9]{4}" maxlength="4" value="${esc(r?.phone4)}"></label></div>
    <button class="btn btn-accent" type="submit">ตรวจสถานะ</button><div id="out"></div>
  </form></div></section>${footer()}`;
  $('#st').onsubmit = async e => {
    e.preventDefault(); const v = Object.fromEntries(new FormData(e.target)), out = $('#out');
    out.innerHTML = '<p class="muted">กำลังตรวจสอบ…</p>';
    try {
      const s = await api.status(v.code, v.p4);
      out.innerHTML = s ? `<div class="status"><span class="tag">${esc(stageLabel(s.stage))}</span><h3>คุณ${esc(s.name)}</h3><p>${STATUS_TEXT[s.stage] || ''}</p>
        ${s.manager ? `<p>ผู้จัดการที่ดูแลคุณ: <b>${esc(s.manager)}</b></p>` : ''}<p class="small muted">ลงทะเบียนเมื่อ ${fmtDate(s.created_at)}</p></div>`
        : '<p class="err">ไม่พบข้อมูล กรุณาตรวจรหัสและเบอร์โทรอีกครั้ง</p>';
    } catch (ex) { out.innerHTML = `<p class="err">${esc(ex.message)}</p>`; }
  };
}

const routes = { '': home, '#why': home, '#income': home, '#screen': screen, '#result': result, '#register': register, '#done': done, '#status': status };
let lastView = null;
function route() {
  const view = routes[location.hash] || home;
  if (view === home && lastView === home) { $(location.hash || 'body')?.scrollIntoView({ behavior: 'smooth' }); return; }
  lastView = view; view();
  if (view === home && location.hash.length > 1) $(location.hash)?.scrollIntoView(); else scrollTo(0, 0);
}
addEventListener('hashchange', route);
document.title = `${CFG.product || 'Career'} · ${CFG.company || ''}`;
if (!live) document.body.insertAdjacentHTML('afterbegin', '<div class="demo-bar">โหมดสาธิต — ข้อมูลเก็บในเบราว์เซอร์เครื่องนี้เท่านั้น</div>');
route();
api.publicInfo(src.ref, src.campaign).then(r => { info = r || info; if (lastView === home && (info.ref_name || info.campaign)) { lastView = null; route(); } }).catch(() => {});
