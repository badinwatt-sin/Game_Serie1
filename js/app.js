// หน้าจอทั้งหมด
// ผู้เล่น: เข้าห้อง → สร้างตัวตน → "เวที" หน้าเดียวที่เปลี่ยนตามคำสั่งผู้สอน
// ผู้สอน: ล็อกอิน → เลือก/สร้างห้อง → ห้องควบคุม (เปิดเกม, ข้อความ, อันดับ, โพล, ผู้เล่น)
import { $, $$, esc, fmt, clamp, state, save, sfx, toast, floatText, confetti, countUp, TEAMS, EMOJI_GROUPS, ALL_EMOJIS,
  COLORS, STYLES, makeRoomCode, parseRoomCode, myScores, myTotal, pick, reducedMotion } from './core.js';
import { GAMES } from './games.js';
import * as sync from './sync.js';
import { I } from './icons.js';
import { mountPlayerPolls, mountHostPolls, POLL_POINTS } from './polls.js';

const app = $('#app');
let leave = null;        // ฟังก์ชันเก็บกวาดของหน้าปัจจุบัน (หยุด timer / polling)
let room = null;         // สถานะห้องล่าสุดที่ผู้เล่นได้รับจากผู้สอน
let pendingCode = null;  // รหัสห้องจากลิงก์/QR

const starsOf = (g, score) => g.stars.filter(t => score >= t).length;
const starStr = n => '★'.repeat(n) + '☆'.repeat(3 - n);
const teamChip = i => { const t = TEAMS[i]; return t ? `<span class="chip" style="--c:${t.c}">${t.e} ทีม${t.n}</span>` : ''; };
const ava = (p, cls = '') => `<span class="ava ${cls}" style="--c:${esc(p.color || '#fff')}">${esc(p.avatar || '?')}</span>`;
const openIds = r => (r?.state?.open || []).filter(id => GAMES.some(g => g.id === id));
const rankRow = (i, left, right, hl, color) => `<li class="rank ${hl ? 'me' : ''}" style="${color ? `--c:${color}` : ''}">
  <span class="pos">${['🥇', '🥈', '🥉'][i] || i + 1}</span><span class="who">${left}</span><b>${right}</b></li>`;

// ---------- router ----------
function render() {
  if (!document.startViewTransition || reducedMotion()) return draw();
  const vt = document.startViewTransition(draw);
  for (const k of ['ready', 'finished', 'updateCallbackDone']) vt[k]?.catch(() => {}); // transition ที่ถูกข้ามไม่ใช่ข้อผิดพลาด
}
function draw() {
  leave?.(); leave = null;
  document.body.style.removeProperty('--bg');
  const [name = '', arg] = location.hash.replace(/^#\/?/, '').split('/');
  document.body.classList.toggle('wide', name === 'host');
  window.scrollTo(0, 0);
  if (name === 'host') return host();
  if (!state.player || (sync.enabled && !state.room)) return join();
  ({ '': stage, join, me, play }[name] || stage)(arg);
}
const go = hash => { if (location.hash === hash) render(); else location.hash = hash; };
addEventListener('hashchange', render);

// ================= ผู้เล่น =================

// ---------- เข้าห้อง ----------
function join() {
  const known = state.player && (state.room || !sync.enabled);
  if (sync.enabled && !known) return askCode();
  identity(state.room, !!known);
}

function askCode() {
  app.innerHTML = `<section class="screen center">
    <div class="logo"><span>GAME</span><b>SERIE<i>1</i></b></div>
    <form class="card stack" id="jf">
      <label class="lbl" for="rc">รหัสห้อง 5 ตัว จากจอของผู้สอน</label>
      <input id="rc" class="inp code-inp" maxlength="5" autocapitalize="characters" autocomplete="off" spellcheck="false" placeholder="ABCD4" value="${pendingCode || ''}" required>
      <p class="err" id="er" role="alert"></p>
      <button class="btn primary">ต่อไป</button>
    </form>
    <a class="link" href="#/host">สำหรับผู้สอน</a>
  </section>`;
  const er = $('#er');
  const submit = async () => {
    const v = parseRoomCode($('#rc').value);
    if (!v) return er.textContent = 'รหัสห้องไม่ถูกต้อง ลองตรวจอีกครั้ง';
    er.textContent = 'กำลังค้นหาห้อง…';
    const r = await sync.getRoom(v.code);
    if (!$('#jf')) return;
    if (!r.ok) return er.textContent = 'เชื่อมต่อไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่';
    if (!r.data) return er.textContent = 'ไม่พบห้องนี้ ตรวจรหัสกับผู้สอนอีกครั้ง';
    identity({ code: r.data.code, name: r.data.name, teams: r.data.teams }, false);
  };
  $('#jf').onsubmit = e => { e.preventDefault(); submit(); };
  if (pendingCode) submit();
}

// ---------- สร้างตัวตน ----------
function identity(rm, editing) {
  leave?.(); leave = null;
  // เข้าห้องใหม่ด้วยเครื่องเดิม: จำชื่อและตัวตนเดิมไว้ให้ แต่ต้องเลือกทีมใหม่
  const p = { name: '', avatar: null, color: pick(COLORS), style: STYLES[0], team: null, ...(state.player || {}) };
  if (!editing || !rm?.teams) p.team = null;
  let taken = new Set(), counts = [], group = 0, picked = !!p.avatar;
  app.innerHTML = `<section class="screen idn">
    <header><small>${rm ? esc(rm.name) : 'โหมดสาธิต'}</small><h1 class="h1">${editing ? 'แก้ไขตัวตน' : 'สร้างตัวตนของคุณ'}</h1></header>
    <div class="pcard" id="pv" aria-live="polite"></div>
    <form class="card stack" id="f">
      <label class="lbl" for="nm">ชื่อเล่น</label>
      <input id="nm" class="inp" maxlength="16" autocomplete="nickname" placeholder="เช่น ต้น, มิ้นท์" value="${esc(p.name)}" required>
      <span class="lbl" id="el">ตัวละคร ${rm ? '<small>ห้ามซ้ำกับเพื่อนในห้อง</small>' : ''}</span>
      <div class="seg" id="eg">${EMOJI_GROUPS.map((g, i) => `<button type="button" data-g="${i}">${g.n}</button>`).join('')}</div>
      <div class="emojis" id="em" role="radiogroup" aria-labelledby="el"></div>
      <span class="lbl" id="cl">สีประจำตัว</span>
      <div class="swatches" role="radiogroup" aria-labelledby="cl">${COLORS.map(c => `<button type="button" role="radio" data-c="${c}" style="--c:${c}" aria-label="สี ${c}"></button>`).join('')}</div>
      <span class="lbl" id="sl">สไตล์ของฉัน</span>
      <div class="chips" role="radiogroup" aria-labelledby="sl">${STYLES.map(s => `<button type="button" role="radio" data-s="${s}">${s}</button>`).join('')}</div>
      ${rm?.teams ? `<span class="lbl" id="tl">ทีมของคุณ</span><div class="teams" id="tm" role="radiogroup" aria-labelledby="tl"></div>` : ''}
      <p class="err" id="er" role="alert"></p>
      <button class="btn primary">${editing ? 'บันทึก' : 'เข้าร่วมเลย'}</button>
      ${editing ? '<a class="btn ghost" href="#/">ยกเลิก</a>' : ''}
    </form>
  </section>`;
  const paint = () => {
    $('#pv').innerHTML = `${ava(p, 'big')}<span><b>${esc(p.name || 'ชื่อของคุณ')}</b><small>${esc(p.style || '')}</small>${teamChip(p.team)}</span>`;
    $$('#eg button').forEach(b => b.setAttribute('aria-selected', +b.dataset.g === group));
    $('#em').innerHTML = EMOJI_GROUPS[group].e.map(e => {
      const t = taken.has(e);
      return `<button type="button" role="radio" class="em" data-e="${e}" aria-checked="${e === p.avatar}" ${t ? 'disabled aria-label="มีคนเลือกแล้ว"' : ''}>${e}</button>`;
    }).join('');
    $$('[data-c]').forEach(b => b.setAttribute('aria-checked', b.dataset.c === p.color));
    $$('[data-s]').forEach(b => b.setAttribute('aria-checked', b.dataset.s === p.style));
    if (rm?.teams) $('#tm').innerHTML = TEAMS.slice(0, rm.teams).map((t, i) =>
      `<button type="button" class="team" role="radio" aria-checked="${i === p.team}" data-t="${i}" style="--c:${t.c}"><span>${t.e}</span>${t.n}<small>${counts[i] || 0} คน</small></button>`).join('');
  };
  // ตัวละครที่เพื่อนเลือกไปแล้ว + จำนวนคนต่อทีม (อัปเดตเองระหว่างที่เลือกอยู่)
  const refresh = async () => {
    if (rm && sync.enabled) {
      const r = await sync.listPlayers(rm.code);
      if (!$('#f')) return;
      if (r.ok) {
        const others = r.data.filter(x => x.pid !== state.pid);
        taken = new Set(others.map(x => x.avatar)); counts = [];
        for (const x of others) if (x.team != null) counts[x.team] = (counts[x.team] || 0) + 1;
        if (taken.size >= ALL_EMOJIS.length) taken = new Set(); // ห้องใหญ่กว่าจำนวนตัวละคร: ยอมให้ซ้ำ
      }
    }
    if (!p.avatar || (taken.has(p.avatar) && !picked)) {
      p.avatar = pick(ALL_EMOJIS.filter(e => !taken.has(e)));
      group = EMOJI_GROUPS.findIndex(g => g.e.includes(p.avatar));
    } else if (taken.has(p.avatar)) { p.avatar = null; $('#er').textContent = 'ตัวละครที่เลือกไว้มีเพื่อนเลือกไปแล้ว เลือกตัวใหม่นะ'; }
    paint();
  };
  if (p.avatar) group = Math.max(0, EMOJI_GROUPS.findIndex(g => g.e.includes(p.avatar)));
  paint(); refresh();
  const iv = setInterval(refresh, 5000);
  leave = () => clearInterval(iv);

  $('#nm').oninput = e => { p.name = e.target.value.trim(); paint(); };
  $('#f').onclick = e => {
    const b = e.target.closest('button[type=button]'); if (!b || b.disabled) return;
    const d = b.dataset;
    if (d.g) group = +d.g; else if (d.e) { p.avatar = d.e; picked = true; } else if (d.c) p.color = d.c; else if (d.s) p.style = d.s; else if (d.t) p.team = +d.t; else return;
    sfx.tap(); $('#er').textContent = ''; paint();
  };
  $('#f').onsubmit = async e => {
    e.preventDefault();
    const er = $('#er'), btn = $('.btn.primary', e.target);
    p.name = $('#nm').value.trim();
    if (!p.name) return;
    if (!p.avatar) return er.textContent = 'เลือกตัวละครก่อนนะ';
    if (rm?.teams && p.team == null) return er.textContent = 'เลือกทีมก่อนนะ';
    if (rm && sync.enabled) {
      btn.disabled = true; er.textContent = 'กำลังเข้าห้อง…';
      const res = await sync.join(rm.code, p);
      btn.disabled = false;
      if (res !== 'ok') {
        er.textContent = res === 'taken' ? 'ตัวละครนี้เพิ่งมีเพื่อนเลือกไป เลือกตัวใหม่นะ' : res === 'noroom' ? 'ห้องนี้ปิดไปแล้ว' : 'เชื่อมต่อไม่ได้ ลองใหม่อีกครั้ง';
        if (res === 'taken') { picked = true; refresh(); }
        return;
      }
    }
    state.player = p; state.room = rm ? { code: rm.code, name: rm.name, teams: rm.teams } : null;
    pendingCode = null; save(); sync.pushScores(); sfx.good();
    go('#/');
  };
}

// ---------- เวที: หน้าเดียวของผู้เล่น เปลี่ยนตามคำสั่งผู้สอน ----------
function boardHTML(players, teams, mode, bonus, mine) {
  if (!players.length) return `<p class="hint">ยังไม่มีผู้เล่นในห้อง</p>`;
  if (mode === 'solo') return `<ol class="ranks">${players.slice(0, mine?.top || 50).map((p, i) =>
    rankRow(i, `${ava(p, 'sm')}<span class="grow">${esc(p.name)}<small>${esc(p.style || '')}</small></span>${teams ? teamChip(p.team) : ''}`, fmt(p.total), p.pid === state.pid, p.color)).join('')}</ol>`;
  const key = mode === 'avg' ? 'avg' : 'total', tt = sync.teamTotals(players, teams, bonus), max = Math.max(1, ...tt.map(t => t[key]));
  return `<ol class="ranks">${tt.sort((a, b) => b[key] - a[key]).map((t, i) => {
    const T = TEAMS[t.team];
    return rankRow(i, `<span class="ava sm" style="--c:${T.c}">${T.e}</span><span class="grow">ทีม${T.n} <small>${t.members} คน${t.bonus ? ` · โบนัส ${fmt(t.bonus)}` : ''}</small>
      <span class="bar"><i style="width:${t[key] / max * 100}%"></i></span></span>`, fmt(t[key]), mine?.team === t.team, T.c);
  }).join('')}</ol>`;
}

function stage() {
  const p = state.player, live = sync.enabled, rm = state.room;
  if (!live) room = { state: { open: GAMES.map(g => g.id) } };
  app.innerHTML = `<section class="screen">
    <header class="hero">
      <a class="me" href="#/me" aria-label="ตัวตนและคะแนนของฉัน">${ava(p)}<span><b>${esc(p.name)}</b><small>${esc(p.style || '')} ${rm ? teamChip(p.team) : ''}</small></span></a>
      <a class="score-pill" href="#/me"><small>คะแนน</small><b id="tot">0</b></a>
    </header>
    <div id="f-msg"></div><div id="f-polls"></div><div id="f-games"></div><div id="f-board"></div><div id="f-wait"></div>
  </section>`;
  countUp($('#tot'), myTotal(), 600);
  const cache = {}, set = (id, html) => { if (cache[id] !== html) { cache[id] = html; $('#' + id).innerHTML = html; } };
  let pollCount = 0, roster = null, stop = false;
  const sc = myScores();

  const paint = () => {
    const st = room?.state || {}, open = openIds(room);
    set('f-msg', st.msg ? `<div class="announce pop"><small>ข้อความจากผู้สอน</small><p>${esc(st.msg)}</p></div>` : '');
    set('f-games', open.length ? `<h2 class="h">${!live ? 'เลือกเกม' : open.length === 1 ? 'ผู้สอนเปิดเกมนี้ให้เล่น' : 'เกมที่เปิดให้เล่นตอนนี้'}</h2>
      <div class="games ${open.length === 1 ? 'one' : ''}">${open.map((id, i) => {
        const g = GAMES.find(x => x.id === id), best = sc[id]?.best || 0;
        return `<a class="game" href="#/play/${g.id}" style="--a:${g.grad[0]};--i:${i}">
          <span class="g-ico">${g.icon}</span><span class="g-tag">${g.skill}</span><b>${g.name}</b><small>${g.desc}</small>
          <span class="g-best">${best ? `<span class="stars">${starStr(starsOf(g, best))}</span> ${fmt(best)}` : 'แตะเพื่อเล่น'}</span></a>`;
      }).join('')}</div>` : '');
    set('f-board', st.board && roster ? `<h2 class="h">อันดับตอนนี้</h2>
      ${rm.teams ? boardHTML(roster, rm.teams, 'team', st.bonus, { team: p.team }) : ''}
      ${boardHTML(roster, rm.teams, 'solo', null, { top: rm.teams ? 5 : 10 })}
      ${(() => { const k = roster.findIndex(x => x.pid === state.pid); return k >= (rm.teams ? 5 : 10) ? `<p class="hint">คุณอยู่อันดับ ${k + 1} จาก ${roster.length} คน</p>` : ''; })()}` : '');
    const idle = live && !!room && !open.length && !pollCount && !st.board;
    set('f-wait', !room ? `<p class="hint">กำลังเชื่อมต่อห้อง…</p>` : idle ? `<div class="waiting">
      <div class="dots" aria-hidden="true"><i></i><i></i><i></i></div>
      <h2>รอผู้สอนเริ่มกิจกรรม</h2><p>วางมือถือไว้ใกล้ ๆ จอนี้จะเปลี่ยนเอง</p>
      ${roster ? `<div class="crowd">${roster.slice(0, 40).map(x => ava(x, 'sm')).join('')}</div><small>อยู่ในห้อง "${esc(rm.name)}" แล้ว ${roster.length} คน</small>` : ''}
    </div>` : '');
  };

  const tick = async () => {
    if (document.hidden) return;
    const r = await sync.getRoom(rm.code);
    if (stop) return;
    if (r.ok && !r.data) { state.room = null; room = null; save(); toast('ผู้สอนปิดห้องนี้แล้ว'); return go('#/'); }
    if (r.ok) room = r.data;
    // ดึงรายชื่อเฉพาะตอนที่ต้องใช้ (ตอนรอ หรือผู้สอนสั่งโชว์อันดับ) เพื่อลดภาระเครือข่าย
    if (room && (room.state?.board || (!openIds(room).length && !pollCount))) {
      const b = await sync.fetchRoom(rm.code);
      if (stop) return;
      if (!b.error) roster = b.players;
    }
    paint();
  };
  paint();
  if (!live) return;
  const stopPolls = mountPlayerPolls($('#f-polls'), n => { pollCount = n; paint(); });
  tick();
  const iv = setInterval(tick, 4000);
  leave = () => { stop = true; clearInterval(iv); stopPolls(); };
}

// ---------- ตัวตนและคะแนนของฉัน ----------
function me() {
  const p = state.player, sc = myScores(), rm = state.room;
  app.innerHTML = `<section class="screen">
    <a class="back" href="#/">← กลับ</a>
    <div class="pcard">${ava(p, 'big')}<span><b>${esc(p.name)}</b><small>${esc(p.style || '')}</small>${rm ? teamChip(p.team) : ''}</span></div>
    <div class="total"><div><small>คะแนนสะสม${rm ? ` · ห้อง ${esc(rm.name)}` : ''}</small><b>${fmt(myTotal())}</b></div></div>
    <ul class="ranks">${GAMES.filter(g => sc[g.id]?.best).map(g => {
      const b = sc[g.id].best;
      return `<li class="rank" style="--c:${g.grad[0]};--a:#fff"><span class="pos ico">${g.icon}</span><span class="who"><span class="grow">${g.name}<small class="stars">${starStr(starsOf(g, b))}</small></span></span><b>${fmt(b)}</b></li>`;
    }).join('')}${sc.poll?.best ? `<li class="rank" style="--c:#17124a;--a:#fff"><span class="pos ico">${I.poll}</span><span class="who"><span class="grow">ร่วมตอบคำถาม<small>${sc.poll.plays} ข้อ × ${POLL_POINTS} แต้ม</small></span></span><b>${fmt(sc.poll.best)}</b></li>` : ''}</ul>
    ${myTotal() ? '' : '<p class="hint">ยังไม่มีคะแนน เล่นเกมหรือตอบคำถามเพื่อเก็บแต้ม</p>'}
    <a class="btn ghost" href="#/join">แก้ไขตัวตน</a>
    <button class="btn ghost" id="snd">${state.sound ? I.host : I.mute} เสียง: ${state.sound ? 'เปิด' : 'ปิด'}</button>
    ${rm ? '<button class="btn danger" id="lv">ออกจากห้อง</button>' : ''}
  </section>`;
  $('#snd').onclick = () => { state.sound = !state.sound; save(); sfx.tap(); me(); };
  if (rm) $('#lv').onclick = () => { if (confirm('ออกจากห้องนี้?')) { state.room = null; room = null; save(); go('#/'); } };
}

// ---------- ตัวครอบเกม (HUD / นับถอยหลัง / สรุปผล) ----------
function play(id) {
  const g = GAMES.find(x => x.id === id);
  if (!g) return go('#/');
  if (sync.enabled && !openIds(room).includes(id)) { if (room) toast('ผู้สอนยังไม่ได้เปิดเกมนี้'); return go('#/'); }
  const timeouts = new Set(), intervals = new Set();
  let alive = true, score = 0, tick = null, tEnd = 0, tLeft = 0;
  const stopAll = () => { alive = false; timeouts.forEach(clearTimeout); intervals.forEach(clearInterval); clearInterval(tick); };
  leave = stopAll;

  document.body.style.setProperty('--bg', g.grad[0]);
  app.innerHTML = `<section class="screen play" style="--a:${g.grad[0]}">
    <header class="hud">
      <a class="icon-btn" href="#/" aria-label="ออกจากเกม">${I.close}</a>
      <div class="hud-t"><b>${g.name}</b><small id="info"></small></div>
      <div class="hud-s"><small>คะแนน</small><b id="sc">0</b></div>
    </header>
    <div class="tbar" role="timer" aria-label="เวลา"><i id="tb"></i></div>
    <div class="stage" id="stage"></div>
  </section>`;
  const stage = $('#stage'), scEl = $('#sc'), tb = $('#tb');

  const api = {
    stage,
    get score() { return score; },
    info: t => { $('#info').textContent = t; },
    add(n, ev) {
      if (!alive || !n) return;
      score = Math.max(0, score + n); scEl.textContent = fmt(score);
      scEl.classList.remove('bump'); void scEl.offsetWidth; scEl.classList.add('bump');
      n > 0 ? sfx.good() : sfx.bad();
      const r = stage.getBoundingClientRect();
      floatText(ev?.clientX ?? r.left + r.width / 2, ev?.clientY ?? r.top + r.height / 3, (n > 0 ? '+' : '') + n, n > 0 ? '#fde047' : '#fb7185');
    },
    miss() { sfx.bad(); stage.classList.remove('shake'); void stage.offsetWidth; stage.classList.add('shake'); },
    after(ms, fn) { const t = setTimeout(() => { timeouts.delete(t); if (alive) fn(); }, ms); timeouts.add(t); return t; },
    every(ms, fn) { const t = setInterval(() => alive && fn(), ms); intervals.add(t); return t; },
    timer(sec, onEnd) {
      clearInterval(tick); tEnd = performance.now() + sec * 1000; tLeft = sec;
      let lastS = sec;
      const upd = () => {
        tLeft = Math.max(0, (tEnd - performance.now()) / 1000);
        tb.style.transform = `scaleX(${tLeft / sec})`; tb.classList.toggle('low', tLeft <= 5);
        const s = Math.ceil(tLeft);
        if (s !== lastS && s <= 3 && s > 0) sfx.tick();
        lastS = s;
        if (tLeft <= 0) { clearInterval(tick); if (alive) onEnd(); }
      };
      upd(); tick = setInterval(upd, 100);
    },
    stopTimer() { clearInterval(tick); tLeft = Math.max(0, (tEnd - performance.now()) / 1000); },
    timeLeft: () => tLeft,
    end() { if (alive) { stopAll(); finish(); } }
  };

  const best = myScores()[g.id]?.best || 0;
  stage.innerHTML = `<div class="intro card pop">
    <div class="intro-ico">${g.icon}</div><h1>${g.name}</h1><p>${g.how}</p>
    <div class="goal">${g.stars.map((s, i) => `<span><span class="stars">${'★'.repeat(i + 1)}</span> ${fmt(s)}+</span>`).join('')}</div>
    ${best ? `<small>สถิติของคุณ: ${fmt(best)}</small>` : ''}
    <button class="btn primary" id="go">เริ่มเลย!</button></div>`;
  $('#go').onclick = () => {
    let n = 3;
    const show = () => { stage.innerHTML = `<div class="count pop" aria-live="assertive">${n || 'GO!'}</div>`; n ? sfx.tick() : sfx.go(); };
    show();
    const iv = api.every(650, () => { n--; if (n >= 0) show(); if (n < 0) { clearInterval(iv); stage.innerHTML = ''; g.start(api); } });
  };

  function finish() {
    const all = myScores(), s = (all[g.id] ||= { best: 0, plays: 0 });
    const isBest = score > s.best, st = starsOf(g, score);
    s.plays++; s.last = score; if (isBest) s.best = score;
    save(); sync.pushScores();
    const t = state.room ? TEAMS[state.player.team] : null;
    stage.innerHTML = `<div class="result card pop">
      <small>${st === 3 ? 'สุดยอด!' : st === 2 ? 'เก่งมาก!' : st === 1 ? 'ดีเลย!' : 'ลองอีกครั้งนะ'}</small>
      <div class="r-stars" aria-label="${st} ดาว">${[0, 1, 2].map(i => `<span class="${i < st ? 'on' : ''}" style="--d:${i}">★</span>`).join('')}</div>
      <b class="r-score" id="rs">0</b>
      ${isBest ? `<span class="badge">สถิติใหม่!</span>` : `<small>สถิติของคุณ ${fmt(s.best)}</small>`}
      <p class="r-total">คะแนนสะสมรวม <b>${fmt(myTotal())}</b>${t ? ` · ให้ทีม${t.n} ${t.e}` : ''}</p>
      <div class="stack">
        <button class="btn primary" id="again">เล่นอีกครั้ง</button>
        <a class="btn ghost" href="#/">กลับ</a>
      </div></div>`;
    countUp($('#rs'), score);
    $('#again').onclick = () => render();
    if (st >= 2 || isBest) { sfx.win(); confetti(); }
  }
}

// ================= ผู้สอน =================
let hostView = 'ctl';

function hostLogin() {
  app.innerHTML = `<section class="screen center">
    <form class="card stack" id="lf">
      <h1 class="h1">สำหรับผู้สอน</h1>
      <p>ใส่รหัสผ่านเพื่อเข้าห้องควบคุมกิจกรรม</p>
      <label class="lbl" for="pw">รหัสผ่าน</label>
      <input id="pw" class="inp" type="password" autocomplete="current-password" required>
      <p class="err" id="le" role="alert"></p>
      <button class="btn primary">เข้าสู่ระบบ</button>
    </form>
    <a class="link" href="#/">กลับไปหน้าผู้เล่น</a>
  </section>`;
  $('#lf').onsubmit = async e => {
    e.preventDefault();
    const btn = $('.btn', e.target), pw = $('#pw').value;
    btn.disabled = true; $('#le').textContent = 'กำลังตรวจสอบ…';
    const r = await sync.adminCheck(pw);
    btn.disabled = false;
    if (r.ok && r.data === true) { state.adminPass = pw; save(); return host(); }
    $('#le').textContent = r.ok ? 'รหัสผ่านไม่ถูกต้อง' : r.status ? 'ตรวจรหัสผ่านไม่สำเร็จ (ฐานข้อมูลอาจยังไม่ได้ติดตั้ง supabase/admin.sql)' : 'เชื่อมต่อไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่';
  };
}
const logout = () => { state.adminPass = null; state.hostCode = null; save(); host(); };

function host() {
  leave?.(); leave = null;
  if (!sync.enabled) {
    app.innerHTML = `<section class="screen center"><div class="card stack"><h1 class="h1">ยังไม่ได้เชื่อมฐานข้อมูล</h1>
      <p>ห้องควบคุมของผู้สอนต้องใช้ฐานข้อมูลกลาง ดูขั้นตอนใน docs/SETUP.md</p><a class="btn primary" href="#/">กลับ</a></div></section>`;
    return;
  }
  if (!state.adminPass) return hostLogin();
  state.hostCode ? hostRoom() : hostRooms();
}

// ---------- เลือกห้อง / สร้างห้อง ----------
function hostRooms() {
  app.innerHTML = `<section class="screen host-rooms">
    <h1 class="h1">ห้องกิจกรรม</h1>
    <div id="rl" class="stack"><p class="hint">กำลังโหลด…</p></div>
    <form class="card stack" id="hf">
      <h2>สร้างห้องใหม่</h2>
      <label class="lbl" for="en">ชื่อกิจกรรม</label>
      <input id="en" class="inp" maxlength="40" placeholder="เช่น Team Building 2026" required>
      <label class="lbl" for="sz">จำนวนผู้เข้าร่วมโดยประมาณ: <b id="szv">30</b> คน</label>
      <input id="sz" type="range" min="2" max="150" value="30">
      <span class="lbl" id="ml">รูปแบบการแข่ง</span>
      <div class="seg" role="radiogroup" aria-labelledby="ml"><button type="button" role="radio" data-m="team" aria-checked="true">ทีม</button><button type="button" role="radio" data-m="solo" aria-checked="false">เดี่ยว</button></div>
      <div id="tc" class="stack">
        <span class="lbl">จำนวนทีม</span>
        <div class="stepper"><button type="button" class="icon-btn" data-d="-1" aria-label="ลดทีม">−</button><b id="tn">6</b><button type="button" class="icon-btn" data-d="1" aria-label="เพิ่มทีม">+</button></div>
        <small id="per"></small>
      </div>
      <p class="err" id="he" role="alert"></p>
      <button class="btn primary">สร้างห้อง</button>
    </form>
    <button class="btn danger" id="lo">ออกจากระบบผู้สอน</button>
  </section>`;
  $('#lo').onclick = logout;
  sync.listRooms().then(r => {
    const box = $('#rl'); if (!box) return;
    box.innerHTML = !r.ok ? '<p class="hint">โหลดรายการห้องไม่ได้</p>' : !r.data.length ? '<p class="hint">ยังไม่มีห้อง สร้างห้องแรกด้านล่าง</p>'
      : r.data.map(x => `<button class="room-row" data-code="${x.code}"><span><b>${esc(x.name)}</b><small>${x.teams ? `${x.teams} ทีม` : 'เดี่ยว'} · สร้างเมื่อ ${new Date(x.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</small></span><i>${x.code}</i></button>`).join('');
    $$('.room-row', box).forEach(b => b.onclick = () => { state.hostCode = b.dataset.code; save(); host(); });
  });
  let mode = 'team', teams = 6, touched = false;
  const upd = () => {
    const n = +$('#sz').value;
    if (!touched) teams = clamp(Math.round(n / 5), 2, 12);
    $('#szv').textContent = n; $('#tn').textContent = teams;
    $('#per').textContent = `ประมาณ ${Math.max(1, Math.round(n / teams))} คนต่อทีม`;
    $('#tc').hidden = mode !== 'team';
  };
  $('#sz').oninput = upd;
  $$('[data-d]').forEach(b => b.onclick = () => { touched = true; teams = clamp(teams + +b.dataset.d, 2, 12); upd(); });
  $$('[data-m]').forEach(b => b.onclick = () => { mode = b.dataset.m; $$('[data-m]').forEach(x => x.setAttribute('aria-checked', x === b)); upd(); });
  $('#hf').onsubmit = async e => {
    e.preventDefault();
    const t = mode === 'team' ? teams : 0, code = makeRoomCode(t);
    const r = await sync.saveRoom({ code, name: $('#en').value.trim(), teams: t, state: { open: [], msg: '', board: false, bonus: Array(t).fill(0) } });
    if (!r.ok) return $('#he').textContent = r.status === 403 || r.status === 401 ? 'รหัสผ่านผู้สอนไม่ถูกต้องแล้ว กรุณาออกจากระบบและเข้าใหม่' : 'สร้างห้องไม่สำเร็จ ลองใหม่อีกครั้ง';
    state.hostCode = code; hostView = 'ctl'; save(); host();
  };
  upd();
}

// ---------- ห้องควบคุม ----------
async function hostRoom() {
  const code = state.hostCode;
  app.innerHTML = `<section class="screen center"><p class="hint">กำลังเปิดห้อง…</p></section>`;
  const got = await sync.getRoom(code);
  if (state.hostCode !== code || !location.hash.startsWith('#/host')) return;
  if (!got.ok) { app.innerHTML = `<section class="screen center"><div class="card stack"><p>เชื่อมต่อไม่ได้</p><button class="btn primary" id="rt">ลองใหม่</button></div></section>`; $('#rt').onclick = host; return; }
  if (!got.data) { state.hostCode = null; save(); return host(); }
  const H = got.data;
  H.state = { open: [], msg: '', board: false, bonus: Array(H.teams).fill(0), ...H.state };
  let players = [], scoreTab = H.teams ? 'team' : 'solo', stop = false, stopPolls = null;
  const commit = async () => { const r = await sync.saveRoom(H); if (!r.ok) toast('บันทึกไม่สำเร็จ ตรวจสอบการเชื่อมต่อ'); return r.ok; };

  const url = `${location.origin}${location.pathname}?room=${code}`;
  let qr = '';
  try { const q = window.qrcode(0, 'M'); q.addData(url); q.make(); qr = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); } catch { /* ไม่มี QR ก็ยังใช้รหัสได้ */ }
  const tabs = [['ctl', 'ควบคุม'], ['score', 'คะแนน'], ['poll', 'โพล'], ['people', 'ผู้เล่น']];
  app.innerHTML = `<section class="screen host">
    <div class="host-join card center-t">
      <small>${esc(H.name)}</small>
      <h1 class="h1">สแกนเพื่อเข้าเล่น</h1>
      <div class="qr">${qr}</div>
      <div class="code">${code}</div>
      <p class="pcount"><b id="pc">0</b> คนในห้อง</p>
      <div class="row-btns"><button class="btn ghost sm" id="cp">คัดลอกลิงก์</button><button class="btn ghost sm" id="bk">ห้องอื่น</button></div>
      <button class="btn danger" id="cl">ปิดห้องนี้ถาวร</button>
    </div>
    <div class="host-board">
      <div class="seg big" role="tablist">${tabs.map(([k, t]) => `<button role="tab" data-v="${k}">${t}</button>`).join('')}</div>
      <div id="hv" class="stack"></div>
    </div>
  </section>`;
  $('#cp').onclick = async () => { try { await navigator.clipboard.writeText(url); toast('คัดลอกลิงก์แล้ว'); } catch { prompt('คัดลอกลิงก์นี้', url); } };
  $('#bk').onclick = () => { state.hostCode = null; save(); host(); };
  $('#cl').onclick = async () => {
    if (!confirm(`ปิดห้อง "${H.name}" ถาวร? ผู้เล่นทุกคนจะถูกนำออกจากห้อง`)) return;
    H.archived = true;
    if (await commit()) { state.hostCode = null; save(); host(); } else H.archived = false;
  };
  const hv = $('#hv');

  const views = {
    ctl() {
      const open = new Set(openIds(H));
      hv.innerHTML = `<div class="card stack">
          <h2>เกมที่เปิดให้ผู้เล่น <small>${open.size ? `เปิดอยู่ ${open.size} เกม` : 'ยังไม่เปิดเกมใด ผู้เล่นเห็นหน้ารอ'}</small></h2>
          <div class="gtoggles">${GAMES.map(g => `<button class="gt" data-g="${g.id}" aria-pressed="${open.has(g.id)}" style="--a:${g.grad[0]}"><span class="g-ico">${g.icon}</span><span><b>${g.name}</b><small>${g.skill}</small></span></button>`).join('')}</div>
          <div class="row-btns"><button class="btn ghost sm" data-all="1">เปิดทั้งหมด</button><button class="btn ghost sm" data-all="0">ปิดทั้งหมด</button></div>
        </div>
        <div class="card stack">
          <h2>ข้อความถึงผู้เล่น</h2>
          <form class="p-text" id="mf"><input class="inp" id="mi" maxlength="120" placeholder="เช่น พักเบรก 10 นาที กลับมาเจอกัน 14:30" value="${esc(H.state.msg)}" aria-label="ข้อความ"><button class="btn primary sm">ส่ง</button></form>
          ${H.state.msg ? `<p class="now">กำลังแสดงบนจอผู้เล่น: "${esc(H.state.msg)}" <button class="btn danger sm" id="mc">ลบข้อความ</button></p>` : ''}
        </div>
        <div class="card"><label class="switch"><input type="checkbox" id="sb" ${H.state.board ? 'checked' : ''}><span><b>แสดงอันดับบนจอผู้เล่น</b><small>ปิดไว้เพื่อเก็บผลเป็นเซอร์ไพรส์ตอนประกาศ</small></span></label></div>`;
      $$('.gt', hv).forEach(b => b.onclick = () => {
        open.has(b.dataset.g) ? open.delete(b.dataset.g) : open.add(b.dataset.g);
        H.state.open = GAMES.map(g => g.id).filter(id => open.has(id)); sfx.tap(); commit(); views.ctl();
      });
      $$('[data-all]', hv).forEach(b => b.onclick = () => { H.state.open = +b.dataset.all ? GAMES.map(g => g.id) : []; commit(); views.ctl(); });
      $('#mf').onsubmit = e => { e.preventDefault(); H.state.msg = $('#mi').value.trim(); commit(); views.ctl(); if (H.state.msg) toast('ส่งข้อความถึงผู้เล่นแล้ว'); };
      if ($('#mc')) $('#mc').onclick = () => { H.state.msg = ''; commit(); views.ctl(); };
      $('#sb').onchange = e => { H.state.board = e.target.checked; commit(); };
    },
    score() {
      hv.innerHTML = `${H.teams ? `<div class="seg" id="hseg" role="tablist"><button role="tab" data-t="team">รวม</button><button role="tab" data-t="avg">เฉลี่ย/คน</button><button role="tab" data-t="solo">บุคคล</button></div>` : ''}
        <div id="hb"></div>
        ${H.teams ? `<details class="card bonus"><summary>ให้คะแนนโบนัสทีม (กิจกรรมนอกจอ)</summary><div id="bn"></div></details>` : ''}`;
      const paintBoard = () => {
        $$('#hseg button').forEach(b => b.setAttribute('aria-selected', b.dataset.t === scoreTab));
        const hb = $('#hb'); if (hb) hb.innerHTML = boardHTML(players, H.teams, scoreTab, H.state.bonus);
      };
      views.score.live = paintBoard;
      $$('#hseg button').forEach(b => b.onclick = () => { scoreTab = b.dataset.t; paintBoard(); });
      const bn = $('#bn');
      if (bn) {
        const bonus = H.state.bonus;
        const paintBonus = () => {
          bn.innerHTML = bonus.map((v, i) => `<div class="bn-row"><span>${TEAMS[i].e} ${TEAMS[i].n}</span>
            <button class="pill" data-i="${i}" data-d="-10">−10</button><button class="pill val" data-i="${i}" data-d="set" aria-label="แก้โบนัสทีม${TEAMS[i].n}">${fmt(v)}</button>
            <button class="pill" data-i="${i}" data-d="10">+10</button><button class="pill" data-i="${i}" data-d="50">+50</button><button class="pill" data-i="${i}" data-d="100">+100</button></div>`).join('');
          $$('.pill', bn).forEach(b => b.onclick = () => {
            const i = +b.dataset.i;
            if (b.dataset.d === 'set') { const v = prompt(`โบนัสทีม${TEAMS[i].n}`, bonus[i]); if (v === null || isNaN(+v)) return; bonus[i] = Math.max(0, Math.round(+v)); }
            else bonus[i] = Math.max(0, (bonus[i] || 0) + +b.dataset.d);
            sfx.tap(); commit(); paintBonus(); paintBoard();
          });
        };
        paintBonus();
      }
      paintBoard();
    },
    poll() { hv.innerHTML = '<div id="hp"></div>'; stopPolls = mountHostPolls($('#hp'), code); },
    people() {
      const by = {}; for (const p of players) if (p.style) by[p.style] = (by[p.style] || 0) + 1;
      hv.innerHTML = `<div class="card stack"><h2>สไตล์ของคนในห้อง</h2>
          <div class="chips ro">${Object.entries(by).sort((a, b) => b[1] - a[1]).map(([s, n]) => `<span>${esc(s)} <b>${n}</b></span>`).join('') || '<small>ยังไม่มีผู้เล่น</small>'}</div></div>
        <ul class="ranks">${players.map(p => `<li class="rank" style="--c:${esc(p.color)}">${ava(p, 'sm')}<span class="who"><span class="grow">${esc(p.name)}<small>${esc(p.style || '')}</small></span>${H.teams ? teamChip(p.team) : ''}</span>
          <b>${fmt(p.total)}</b><button class="icon-btn kick" data-pid="${esc(p.pid)}" data-n="${esc(p.name)}" aria-label="นำ ${esc(p.name)} ออกจากห้อง">${I.close}</button></li>`).join('')}</ul>
        ${players.length ? '' : '<p class="hint">ยังไม่มีผู้เล่นเข้าห้อง ให้ผู้เข้าร่วมสแกน QR</p>'}`;
      $$('.kick', hv).forEach(b => b.onclick = async () => {
        if (!confirm(`นำ "${b.dataset.n}" ออกจากห้อง? คะแนนของคนนี้จะไม่ถูกนับ`)) return;
        await sync.setPlayerActive(code, b.dataset.pid, false); load();
      });
    }
  };
  const show = v => {
    hostView = views[v] ? v : 'ctl'; stopPolls?.(); stopPolls = null; views.score.live = null;
    $$('[data-v]').forEach(b => b.setAttribute('aria-selected', b.dataset.v === hostView));
    views[hostView]();
  };
  const load = async () => {
    if (document.hidden) return;
    const r = await sync.fetchRoom(code);
    if (stop || r.error) return;
    players = r.players; $('#pc').textContent = players.length;
    if (hostView === 'score') views.score.live?.();
    else if (hostView === 'people' && !document.querySelector('dialog[open]')) views.people();
  };
  $$('[data-v]').forEach(b => b.onclick = () => show(b.dataset.v));
  show(hostView); load();
  const iv = setInterval(load, 4000);
  leave = () => { stop = true; clearInterval(iv); stopPolls?.(); };
}

// ---------- เริ่มต้น ----------
const qs = new URLSearchParams(location.search);
const fromLink = parseRoomCode(qs.get('room'));
if (fromLink) {
  history.replaceState(null, '', location.pathname + location.hash);
  if (state.room?.code !== fromLink.code) { pendingCode = fromLink.code; state.room = null; save(); location.hash = '#/'; }
}
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
render();
