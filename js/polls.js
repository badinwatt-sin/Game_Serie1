// โพล / แบบสำรวจ: ผู้จัดตั้งคำถาม ผู้เล่นตอบจากมือถือ ผลขึ้นสดทุกจอ (ต้องเปิดกระดานสด)
import { $, $$, esc, fmt, state, save, sfx, toast, myScores } from './core.js';
import * as sync from './sync.js';
import { I } from './icons.js';

export const POLL_POINTS = 50;
const TYPE_NAME = { choice: 'ตัวเลือก', rating: 'ให้คะแนน 1–5', text: 'คำตอบสั้น' };
const PRESETS = [
  { t: 'พลังงานตอนนี้', q: 'ตอนนี้พลังงานของคุณอยู่ระดับไหน?', type: 'rating' },
  { t: 'ความคาดหวัง', q: 'คาดหวังอะไรจากการอบรมวันนี้มากที่สุด?', type: 'choice', options: ['ความรู้ใหม่', 'เทคนิคที่นำไปใช้ได้จริง', 'รู้จักเพื่อนร่วมงานมากขึ้น', 'แรงบันดาลใจ'] },
  { t: 'เรียนรู้ใน 1 คำ', q: 'สิ่งที่ได้เรียนรู้วันนี้ ใน 1 คำ', type: 'text' },
  { t: 'ความพึงพอใจ', q: 'ความพึงพอใจโดยรวมต่อการอบรมครั้งนี้', type: 'rating' },
  { t: 'แนะนำต่อ', q: 'จะแนะนำหลักสูตรนี้ให้เพื่อนร่วมงานหรือไม่?', type: 'choice', options: ['แนะนำแน่นอน', 'อาจจะแนะนำ', 'ยังไม่แน่ใจ'] }
];

// อัปเดตเฉพาะการ์ดที่เนื้อหาเปลี่ยน — ฟอร์มที่กำลังพิมพ์อยู่จะไม่ถูกรีเซ็ตตอน polling
function patch(box, items) {
  const seen = new Set();
  items.forEach((it, i) => {
    seen.add(it.id);
    let el = [...box.children].find(x => x.dataset.k === it.id);
    if (!el) { el = document.createElement('div'); el.dataset.k = it.id; el.className = 'pop'; }
    if (box.children[i] !== el) box.insertBefore(el, box.children[i] || null);
    if (el._h !== it.html) { el._h = it.html; el.innerHTML = it.html; }
  });
  [...box.children].forEach(el => seen.has(el.dataset.k) || el.remove());
}

export function resultHTML(poll, votes, mine) {
  const vs = votes.filter(v => v.poll_id === poll.id), n = vs.length;
  const row = (label, c, me) => `<li class="${me ? 'me' : ''}"><span class="pr-l">${label}</span>
    <span class="pr-bar"><i style="width:${n ? c / n * 100 : 0}%"></i></span><b>${c}</b></li>`;
  let body;
  if (poll.type === 'choice') {
    body = `<ul class="pr">${poll.options.map((o, i) => row(esc(o), vs.filter(v => +v.answer === i).length, mine !== undefined && +mine === i)).join('')}</ul>`;
  } else if (poll.type === 'rating') {
    const avg = n ? vs.reduce((s, v) => s + +v.answer, 0) / n : 0;
    body = `<div class="pr-avg"><b>${n ? avg.toFixed(1) : '–'}</b><span>${I.star} เฉลี่ยจาก 5</span></div>
      <ul class="pr">${[5, 4, 3, 2, 1].map(k => row(`${k} ดาว`, vs.filter(v => +v.answer === k).length, +mine === k)).join('')}</ul>`;
  } else {
    const m = new Map();
    for (const v of vs) { const k = v.answer.trim().toLowerCase(); if (k) m.set(k, (m.get(k) || 0) + 1); }
    const top = [...m].sort((a, b) => b[1] - a[1]).slice(0, 40), max = top[0]?.[1] || 1;
    body = `<div class="words">${top.map(([w, c]) => `<span style="--s:${(c / max).toFixed(2)}">${esc(w)}${c > 1 ? `<sup>${c}</sup>` : ''}</span>`).join('') || '<small>ยังไม่มีคำตอบ</small>'}</div>`;
  }
  return `${body}<small class="pr-n">${fmt(n)} คำตอบ</small>`;
}

// ---------- ฝั่งผู้เล่น ----------
export function mountPlayerPolls(box, onCount = () => {}) {
  const room = state.room.code;
  const mine = () => ((state.voted ||= {})[room] ||= {});
  let polls = [], votes = [], stop = false;
  box.innerHTML = `<div class="pl"></div>`;
  const list = $('.pl', box);

  const draw = () => {
    // แสดงเฉพาะโพลที่ผู้สอนเปิดอยู่ (ที่ตอบแล้วจะเห็นผลรวม) — ปิดโพลเมื่อไร หายจากจอผู้เล่นทันที
    const my = mine(), show = polls.filter(p => p.open).reverse();
    onCount(show.length);
    patch(list, show.map(p => {
      const a = my[p.id];
      let inner;
      if (a !== undefined) inner = `<span class="tag ok">ตอบแล้ว +${POLL_POINTS}</span>${resultHTML(p, votes, a)}`;
      else if (p.type === 'choice') inner = `<div class="p-opts">${p.options.map((o, i) => `<button class="p-opt" data-id="${p.id}" data-v="${i}">${esc(o)}</button>`).join('')}</div>`;
      else if (p.type === 'rating') inner = `<div class="p-stars" role="group" aria-label="ให้คะแนน">${[1, 2, 3, 4, 5].map(k => `<button data-id="${p.id}" data-v="${k}" aria-label="${k} ดาว">${I.star}<span>${k}</span></button>`).join('')}</div>`;
      else inner = `<form class="p-text" data-id="${p.id}"><input class="inp" maxlength="40" placeholder="พิมพ์คำตอบสั้น ๆ" aria-label="คำตอบ" required><button class="btn primary sm">ส่ง</button></form>`;
      return { id: p.id, html: `<article class="card poll"><small class="kicker">คำถามจากผู้สอน</small><h2>${esc(p.q)}</h2>${inner}</article>` };
    }));
  };
  const submit = async (id, answer) => {
    const my = mine();
    if (my[id] !== undefined) return;
    my[id] = answer;
    const n = Object.keys(my).length, s = (myScores().poll ||= { best: 0, plays: 0 });
    s.best = n * POLL_POINTS; s.plays = n;
    votes.push({ poll_id: id, pid: state.pid, answer: String(answer) });
    save(); sfx.good(); toast(`ขอบคุณที่ร่วมตอบ +${POLL_POINTS} แต้ม`); draw();
    const r = await sync.vote(room, id, answer);
    if (!r.ok) toast('ส่งคำตอบไม่สำเร็จ ตรวจสอบอินเทอร์เน็ต');
    sync.pushScores();
  };
  list.addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (b) submit(b.dataset.id, +b.dataset.v); });
  list.addEventListener('submit', e => { e.preventDefault(); const v = $('input', e.target).value.trim(); if (v) submit(e.target.dataset.id, v); });

  const load = async () => {
    const [p, v] = await Promise.all([sync.listPolls(room), sync.listVotes(room)]);
    if (stop) return;
    if (!p.ok) return;
    polls = p.data;
    if (v.ok) { const sent = new Set(v.data.map(x => x.poll_id + x.pid)); votes = [...v.data, ...votes.filter(x => x.pid === state.pid && !sent.has(x.poll_id + x.pid))]; }
    draw();
  };
  load();
  const iv = setInterval(load, 4000);
  return () => { stop = true; clearInterval(iv); };
}

// ---------- ฝั่งผู้จัด ----------
export function mountHostPolls(box, room) {
  let polls = [], votes = [], stop = false, type = 'choice', first = true;
  box.innerHTML = `<details class="card pform" open><summary>ตั้งคำถามใหม่</summary>
    <form class="stack" id="pf">
      <div class="presets"><small>แม่แบบ:</small>${PRESETS.map((p, i) => `<button type="button" class="pill" data-p="${i}">${p.t}</button>`).join('')}</div>
      <label class="lbl" for="pq">คำถาม</label>
      <input id="pq" class="inp" maxlength="200" placeholder="เช่น วันนี้อยากเรียนรู้เรื่องอะไร?" required>
      <div class="seg" role="radiogroup" aria-label="รูปแบบคำตอบ">${Object.entries(TYPE_NAME).map(([k, v]) => `<button type="button" role="radio" data-ty="${k}" aria-checked="${k === type}">${v}</button>`).join('')}</div>
      <div id="pow" class="stack"><label class="lbl" for="po">ตัวเลือก (บรรทัดละ 1 ข้อ, 2–6 ข้อ)</label>
        <textarea id="po" class="inp" rows="4" placeholder="ตัวเลือกที่ 1&#10;ตัวเลือกที่ 2"></textarea></div>
      <p class="err" id="pe" role="alert"></p>
      <button class="btn primary">เปิดโพลนี้</button>
    </form></details>
    <div class="pl"></div><p class="hint">กำลังโหลด…</p>`;
  const list = $('.pl', box), hint = $('.hint', box);
  const setType = t => { type = t; $$('[data-ty]', box).forEach(b => b.setAttribute('aria-checked', b.dataset.ty === t)); $('#pow', box).hidden = t !== 'choice'; };
  $$('[data-ty]', box).forEach(b => b.onclick = () => setType(b.dataset.ty));
  $$('[data-p]', box).forEach(b => b.onclick = () => { const p = PRESETS[b.dataset.p]; $('#pq', box).value = p.q; $('#po', box).value = (p.options || []).join('\n'); setType(p.type); });

  const draw = () => {
    hint.textContent = polls.length ? '' : 'ยังไม่มีโพล ลองเลือกแม่แบบด้านบนแล้วกด "เปิดโพลนี้"';
    patch(list, [...polls].reverse().map(p => ({
      id: p.id, html: `<article class="card poll ${p.open ? '' : 'closed'}">
        <div class="p-head"><span class="tag ${p.open ? 'ok' : ''}">${p.open ? 'เปิดรับคำตอบ' : 'ปิดแล้ว'}</span><span class="tag">${TYPE_NAME[p.type]}</span></div>
        <h2>${esc(p.q)}</h2>${resultHTML(p, votes)}
        <div class="row-btns"><button class="btn ghost sm" data-act="toggle" data-id="${p.id}">${p.open ? 'ปิดรับคำตอบ' : 'เปิดอีกครั้ง'}</button>
          <button class="btn danger sm" data-act="del" data-id="${p.id}">ลบ</button></div></article>`
    })));
  };
  const load = async () => {
    const [p, v] = await Promise.all([sync.listPolls(room), sync.listVotes(room)]);
    if (stop) return;
    if (!p.ok) { hint.textContent = 'เชื่อมต่อไม่ได้ กำลังลองใหม่… (ตรวจว่ารัน supabase/schema.sql เวอร์ชันล่าสุดแล้ว)'; return; }
    polls = p.data; if (v.ok) votes = v.data;
    // มีโพลอยู่แล้ว: พับฟอร์มเก็บ ให้ผลโหวตเด่นบนจอ
    if (first) { first = false; if (polls.length) $('details', box).open = false; }
    draw();
  };
  $('#pf', box).onsubmit = async e => {
    e.preventDefault();
    const q = $('#pq', box).value.trim(), err = $('#pe', box);
    const options = type === 'choice' ? $('#po', box).value.split('\n').map(x => x.trim().slice(0, 60)).filter(Boolean) : [];
    if (type === 'choice' && (options.length < 2 || options.length > 6)) return err.textContent = 'ใส่ตัวเลือก 2–6 ข้อ บรรทัดละ 1 ข้อ';
    err.textContent = '';
    const r = await sync.savePoll({ id: crypto.randomUUID?.() || String(Date.now()), room, q, type, options, open: true });
    if (!r.ok) return err.textContent = r.status ? 'สร้างโพลไม่สำเร็จ รหัสผ่านผู้จัดอาจถูกเปลี่ยน ลองออกจากระบบแล้วเข้าใหม่' : 'สร้างโพลไม่สำเร็จ ตรวจสอบการเชื่อมต่อ';
    e.target.reset(); setType('choice'); $('details', box).open = false; sfx.good(); toast('เปิดโพลแล้ว ขึ้นบนจอผู้เล่นทันที'); load();
  };
  list.addEventListener('click', async e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const p = polls.find(x => x.id === b.dataset.id); if (!p) return;
    if (b.dataset.act === 'toggle') await sync.setPollOpen(p.id, !p.open);
    else if (confirm('ลบโพลนี้พร้อมคำตอบทั้งหมด?')) await sync.deletePoll(p.id); else return;
    load();
  });
  setType(type); load();
  const iv = setInterval(load, 4000);
  return () => { stop = true; clearInterval(iv); };
}
