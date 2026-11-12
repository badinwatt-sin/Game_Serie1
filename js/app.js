import { $, $$, esc, fmt, clamp, state, save, sfx, toast, floatText, confetti, countUp, TEAMS, AVATARS,
  makeRoomCode, parseRoomCode, myScores, myTotal, pick, reducedMotion } from './core.js';
import { GAMES } from './games.js';
import * as sync from './sync.js';
import { I } from './icons.js';
import { mountPlayerPolls, mountHostPolls, POLL_POINTS } from './polls.js';

const app = $('#app');
let leave = null; // ฟังก์ชันเก็บกวาดของหน้าปัจจุบัน (หยุด timer / polling)

const starsOf = (g, score) => g.stars.filter(t => score >= t).length;
const starStr = n => '★'.repeat(n) + '☆'.repeat(3 - n);
const teamOf = i => TEAMS[i] || null;
const teamChip = i => { const t = teamOf(i); return t ? `<span class="chip" style="--c:${t.c}">${t.e} ทีม${t.n}</span>` : ''; };

// ---------- router ----------
const routes = { '': home, board, room, host, me, play, poll };
function render() {
  // เปลี่ยนหน้าแบบ cross-fade ถ้าเบราว์เซอร์รองรับ
  if (!document.startViewTransition || reducedMotion()) return draw();
  const vt = document.startViewTransition(draw);
  // ถ้าเปลี่ยนหน้าซ้อนกัน transition เก่าจะถูกข้าม — ไม่ใช่ข้อผิดพลาด
  for (const k of ['ready', 'finished', 'updateCallbackDone']) vt[k]?.catch(() => {});
}
function draw() {
  leave?.(); leave = null;
  document.body.style.removeProperty('--bg');
  const [name = '', arg] = location.hash.replace(/^#\/?/, '').split('/');
  const view = routes[name] || home;
  if (!state.player && view !== host) return me(true);
  document.body.classList.toggle('wide', view === host);
  window.scrollTo(0, 0);
  view(arg);
}
const go = hash => { if (location.hash === hash) render(); else location.hash = hash; };
addEventListener('hashchange', render);

const nav = cur => `<nav class="tabbar" aria-label="เมนูหลัก">${[
  ['', I.games, 'เกม'], ['poll', I.poll, 'โพล'], ['board', I.board, 'คะแนน'], ['room', I.room, 'ห้อง'], ['host', I.host, 'ผู้จัด']
].map(([h, i, t]) => `<a href="#/${h}" ${cur === h ? 'aria-current="page"' : ''}>${i}<span>${t}</span></a>`).join('')}</nav>`;

// ---------- โปรไฟล์ ----------
function me(first) {
  const p = state.player || { name: '', avatar: pick(AVATARS) };
  let avatar = p.avatar;
  app.innerHTML = `<section class="screen center">
    <div class="logo"><span>GAME</span><b>SERIE<i>1</i></b><small>10 เกมสะสมแต้ม · เล่นเดี่ยวหรือทีม</small></div>
    <form class="card stack" id="f">
      <label class="lbl" for="nm">ชื่อเล่นของคุณ</label>
      <input id="nm" class="inp" maxlength="16" autocomplete="nickname" placeholder="เช่น ต้น, มิ้นท์" value="${esc(p.name)}" required>
      <span class="lbl" id="avl">เลือกตัวละคร</span>
      <div class="avatars" role="radiogroup" aria-labelledby="avl">${AVATARS.map(a =>
        `<button type="button" role="radio" aria-checked="${a === avatar}" class="av">${a}</button>`).join('')}</div>
      <button class="btn primary">${first === true ? 'เริ่มเล่นเลย' : 'บันทึก'}</button>
    </form>
    ${first === true ? `<a class="link" href="#/host">ฉันเป็นผู้จัดกิจกรรม →</a>` : ''}
  </section>`;
  $$('.av').forEach(b => b.onclick = () => { avatar = b.textContent; $$('.av').forEach(x => x.setAttribute('aria-checked', x === b)); sfx.tap(); });
  $('#f').onsubmit = e => {
    e.preventDefault();
    const name = $('#nm').value.trim();
    if (!name) return;
    state.player = { ...state.player, name, avatar }; save(); sync.pushScores();
    go(pendingRoom ? '#/room' : '#/');
  };
}

// ---------- หน้าเกม ----------
function home() {
  const sc = myScores(), p = state.player, played = GAMES.filter(g => sc[g.id]?.best).length;
  app.innerHTML = `<section class="screen">
    <header class="hero">
      <a class="me" href="#/me" aria-label="แก้ไขโปรไฟล์"><span class="ava">${p.avatar}</span>
        <span><b>${esc(p.name)}</b><small>${state.room ? `ห้อง ${state.room.code}` : 'โหมดเล่นเดี่ยว'} ${state.room ? teamChip(p.team) : ''}</small></span></a>
      <button class="icon-btn" id="snd" aria-label="เปิด/ปิดเสียง">${state.sound ? I.host : I.mute}</button>
    </header>
    <div class="total">
      <div><small>คะแนนสะสม</small><b id="tot">0</b></div>
      <div class="prog"><small>เล่นแล้ว ${played}/10 เกม</small><div class="bar"><i style="width:${played * 10}%"></i></div></div>
    </div>
    <h2 class="h">เลือกเกม</h2>
    <div class="games">${GAMES.map((g, i) => {
      const best = sc[g.id]?.best || 0;
      return `<a class="game" href="#/play/${g.id}" style="--a:${g.grad[0]};--i:${i}">
        <span class="g-ico">${g.icon}</span><span class="g-tag">${g.skill}</span>
        <b>${g.name}</b><small>${g.desc}</small>
        <span class="g-best">${best ? `<span class="stars">${starStr(starsOf(g, best))}</span> ${fmt(best)}` : 'ยังไม่เคยเล่น'}</span></a>`;
    }).join('')}</div>
  </section>${nav('')}`;
  countUp($('#tot'), myTotal(), 700);
  $('#snd').onclick = e => { state.sound = !state.sound; save(); e.currentTarget.innerHTML = state.sound ? I.host : I.mute; sfx.tap(); };
}

// ---------- shell สำหรับเล่นเกม ----------
function play(id) {
  const g = GAMES.find(x => x.id === id);
  if (!g) return go('#/');
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
    <div class="goal">${g.stars.map((s, i) => `<span><span class="stars">${'★'.repeat(i + 1)}</span>${fmt(s)}+</span>`).join('')}</div>
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
    const nextG = GAMES[(GAMES.indexOf(g) + 1) % GAMES.length], t = state.room ? teamOf(state.player.team) : null;
    stage.innerHTML = `<div class="result card pop">
      <small>${st === 3 ? 'สุดยอด!' : st === 2 ? 'เก่งมาก!' : st === 1 ? 'ดีเลย!' : 'ลองอีกครั้งนะ'}</small>
      <div class="r-stars" aria-label="${st} ดาว">${[0, 1, 2].map(i => `<span class="${i < st ? 'on' : ''}" style="--d:${i}">★</span>`).join('')}</div>
      <b class="r-score" id="rs">0</b>
      ${isBest ? `<span class="badge">สถิติใหม่!</span>` : `<small>สถิติของคุณ ${fmt(s.best)}</small>`}
      <p class="r-total">คะแนนสะสมรวม <b>${fmt(myTotal())}</b>${t ? ` · ให้ทีม${t.n} ${t.e}` : ''}</p>
      <div class="stack">
        <a class="btn primary" href="#/play/${nextG.id}">เกมถัดไป: ${nextG.name}</a>
        <button class="btn ghost" id="again">เล่นอีกครั้ง</button>
        <a class="btn ghost" href="#/">กลับหน้าเกม</a>
      </div></div>`;
    countUp($('#rs'), score);
    $('#again').onclick = () => render();
    if (st >= 2 || isBest) { sfx.win(); confetti(); }
  }
}

// ---------- ห้อง (ฝั่งผู้เล่น) ----------
let pendingRoom = null; // { code, teams, name } จากลิงก์/QR
function room() {
  const r = state.room, p = state.player;
  const teamPicker = (n, cur) => `<span class="lbl" id="tl">เลือกทีมของคุณ</span>
    <div class="teams" role="radiogroup" aria-labelledby="tl">${TEAMS.slice(0, n).map((t, i) =>
      `<button type="button" class="team" role="radio" aria-checked="${i === cur}" data-t="${i}" style="--c:${t.c}"><span>${t.e}</span>${t.n}</button>`).join('')}</div>`;

  if (r && !pendingRoom) {
    app.innerHTML = `<section class="screen">
      <h1 class="h1">ห้องของคุณ</h1>
      <div class="card stack center-t">
        <small>${esc(r.name || 'กิจกรรม')}</small><div class="code">${r.code}</div>
        ${r.teams ? `<p>คุณอยู่ ${teamChip(p.team)}</p>${teamPicker(r.teams, p.team)}` : '<p>โหมดเล่นเดี่ยว — แข่งคะแนนรายบุคคล</p>'}
        <a class="btn primary" href="#/">ไปเล่นเกม</a>
        <button class="btn danger" id="lv">ออกจากห้อง</button>
      </div></section>${nav('room')}`;
    $$('.team').forEach(b => b.onclick = () => { p.team = +b.dataset.t; save(); sync.pushScores(); sfx.tap(); room(); });
    $('#lv').onclick = () => { if (confirm('ออกจากห้องนี้? (คะแนนในห้องยังเก็บไว้ในเครื่อง)')) { state.room = null; p.team = null; save(); room(); } };
    return;
  }

  const pr = pendingRoom;
  app.innerHTML = `<section class="screen">
    <h1 class="h1">เข้าร่วมห้อง</h1>
    <form class="card stack" id="jf">
      <label class="lbl" for="rc">รหัสห้อง 5 ตัว (ดูจากจอของผู้จัด)</label>
      <input id="rc" class="inp code-inp" maxlength="5" autocapitalize="characters" autocomplete="off" spellcheck="false" placeholder="ABCD4" value="${pr?.code || ''}" required>
      <div id="tp">${pr?.teams ? teamPicker(pr.teams, -1) : ''}</div>
      <p class="err" id="er" role="alert"></p>
      <button class="btn primary">เข้าร่วม</button>
    </form>
    <p class="hint">ยังไม่มีรหัส? เล่นแบบเดี่ยวได้เลยที่แท็บ "เกม" หรือให้ผู้จัดสร้างห้องที่แท็บ "ผู้จัด"</p>
  </section>${nav('room')}`;
  let team = -1;
  const bindTeams = () => $$('.team').forEach(b => b.onclick = () => { team = +b.dataset.t; $$('.team').forEach(x => x.setAttribute('aria-checked', x === b)); sfx.tap(); });
  bindTeams();
  $('#rc').oninput = e => {
    const v = parseRoomCode(e.target.value);
    team = -1; $('#er').textContent = '';
    $('#tp').innerHTML = v?.teams ? teamPicker(v.teams, -1) : ''; bindTeams();
  };
  $('#jf').onsubmit = e => {
    e.preventDefault();
    const v = parseRoomCode($('#rc').value);
    if (!v) return $('#er').textContent = 'รหัสห้องไม่ถูกต้อง ลองตรวจอีกครั้ง';
    if (v.teams && team < 0) return $('#er').textContent = 'เลือกทีมก่อนนะ';
    state.room = { code: v.code, teams: v.teams, name: pr?.code === v.code ? pr.name : '' };
    state.player.team = v.teams ? team : null;
    pendingRoom = null; save(); sync.pushScores();
    toast('เข้าห้องแล้ว ลุยเลย!'); go('#/');
  };
}

// ---------- กระดานคะแนน ----------
const rankRow = (i, left, right, hl, color) => `<li class="rank ${hl ? 'me' : ''}" style="${color ? `--c:${color}` : ''}">
  <span class="pos">${['🥇', '🥈', '🥉'][i] || i + 1}</span><span class="who">${left}</span><b>${right}</b></li>`;

function liveBoard(box, code, teams, mode) {
  // mode: 'team' | 'avg' | 'solo' — คืนฟังก์ชันหยุด polling
  let stop = false;
  const load = async () => {
    const { players, error } = await sync.fetchRoom(code);
    if (stop || !box.isConnected) return;
    if (error) { box.innerHTML = `<p class="hint">เชื่อมต่อกระดานกลางไม่ได้ (${esc(error)}) — จะลองใหม่อัตโนมัติ</p>`; return; }
    if (!players.length) { box.innerHTML = `<p class="hint">ยังไม่มีคะแนนเข้ามา รอผู้เล่นคนแรก…</p>`; return; }
    if (mode === 'solo') {
      box.innerHTML = `<ol class="ranks">${players.slice(0, 50).map((p, i) =>
        rankRow(i, `<span class="ava sm">${esc(p.avatar)}</span>${esc(p.name)} ${teams ? teamChip(p.team) : ''}`, fmt(p.total), p.pid === state.pid)).join('')}</ol>
        <p class="hint">ผู้เล่นทั้งหมด ${players.length} คน</p>`;
    } else {
      const bonus = state.host?.code === code ? state.host.bonus || [] : [];
      const tt = sync.teamTotals(players, teams).map(t => ({ ...t, total: t.total + (bonus[t.team] || 0) }));
      const key = mode === 'avg' ? 'avg' : 'total', max = Math.max(1, ...tt.map(t => t[key]));
      box.innerHTML = `<ol class="ranks">${tt.sort((a, b) => b[key] - a[key]).map((t, i) => {
        const T = TEAMS[t.team];
        return rankRow(i, `<span class="ava sm">${T.e}</span><span class="grow">ทีม${T.n} <small>${t.members} คน</small>
          <span class="bar"><i style="width:${t[key] / max * 100}%"></i></span></span>`, fmt(t[key]), state.room?.code === code && state.player?.team === t.team, T.c);
      }).join('')}</ol>`;
    }
  };
  load();
  const iv = setInterval(load, 4000);
  return () => { stop = true; clearInterval(iv); };
}

function board() {
  const sc = myScores(), r = state.room, live = sync.enabled && r;
  let tab = live ? (r.teams ? 'team' : 'solo') : 'mine', stopLive = null;
  app.innerHTML = `<section class="screen">
    <h1 class="h1">กระดานคะแนน</h1>
    ${live ? `<div class="seg" role="tablist">${r.teams ? '<button role="tab" data-t="team">ทีม</button><button role="tab" data-t="avg">เฉลี่ย/คน</button>' : ''}
      <button role="tab" data-t="solo">บุคคล</button><button role="tab" data-t="mine">ของฉัน</button></div>` : ''}
    <div id="bd"></div>
    ${!live ? `<p class="hint">${r ? 'กระดานรวมของห้องแสดงที่จอผู้จัด — โชว์คะแนนสะสมของคุณให้ผู้จัดดูได้เลย' : 'เข้าร่วมห้องเพื่อแข่งกับเพื่อนและสะสมแต้มให้ทีม'}</p>` : ''}
  </section>${nav('board')}`;
  const bd = $('#bd');
  const show = () => {
    stopLive?.(); stopLive = null;
    $$('.seg button').forEach(b => b.setAttribute('aria-selected', b.dataset.t === tab));
    if (tab !== 'mine') { bd.innerHTML = '<p class="hint">กำลังโหลด…</p>'; stopLive = liveBoard(bd, r.code, r.teams, tab); return; }
    bd.innerHTML = `<div class="total"><div><small>${esc(state.player.name)} ${r ? teamChip(state.player.team) : ''}</small><b>${fmt(myTotal())}</b></div>
      <span class="ava big">${state.player.avatar}</span></div>
      <ul class="ranks">${GAMES.map(g => {
        const b = sc[g.id]?.best || 0;
        return `<li class="rank" style="--c:${g.grad[0]};--a:#fff"><span class="pos ico">${g.icon}</span><span class="who"><span class="grow">${g.name}<small class="stars">${starStr(starsOf(g, b))}</small></span></span><b>${b ? fmt(b) : '–'}</b></li>`;
      }).join('')}${sc.poll?.best ? `<li class="rank" style="--c:#17124a;--a:#fff"><span class="pos ico">${I.poll}</span><span class="who"><span class="grow">ร่วมตอบโพล<small>${sc.poll.plays} ข้อ × ${POLL_POINTS} แต้ม</small></span></span><b>${fmt(sc.poll.best)}</b></li>` : ''}</ul>`;
  };
  $$('.seg button').forEach(b => b.onclick = () => { tab = b.dataset.t; show(); });
  show();
  leave = () => stopLive?.();
}

// ---------- โพล (ฝั่งผู้เล่น) ----------
function poll() {
  const why = !state.room ? 'เข้าร่วมห้องก่อน แล้วคำถามจากผู้จัดจะมาแสดงที่นี่'
    : !sync.enabled ? 'ห้องนี้ยังไม่ได้เปิดระบบโพล (ผู้จัดต้องตั้งค่ากระดานสดก่อน)' : '';
  app.innerHTML = `<section class="screen">
    <h1 class="h1">โพล</h1>
    <p class="sub">ร่วมตอบได้ข้อละ ${POLL_POINTS} แต้ม ไม่มีถูกผิด</p>
    <div id="pb" class="stack">${why ? `<p class="hint">${why}</p>${state.room ? '' : '<a class="btn primary" href="#/room">เข้าร่วมห้อง</a>'}` : ''}</div>
  </section>${nav('poll')}`;
  if (!why) leave = mountPlayerPolls($('#pb'));
}

// ---------- ผู้จัด ----------
let hostView = 'score';
function host() {
  leave?.(); leave = null;
  const h = state.host;
  if (!h) {
    app.innerHTML = `<section class="screen">
      <h1 class="h1">สร้างห้องกิจกรรม</h1>
      <form class="card stack" id="hf">
        <label class="lbl" for="en">ชื่อกิจกรรม</label>
        <input id="en" class="inp" maxlength="40" placeholder="เช่น Team Building 2026" required>
        <label class="lbl" for="sz">จำนวนผู้เข้าร่วมโดยประมาณ: <b id="szv">30</b> คน</label>
        <input id="sz" type="range" min="2" max="300" value="30">
        <span class="lbl" id="ml">รูปแบบการแข่ง</span>
        <div class="seg" role="radiogroup" aria-labelledby="ml"><button type="button" role="radio" data-m="team" aria-checked="true">ทีม</button><button type="button" role="radio" data-m="solo" aria-checked="false">เดี่ยว</button></div>
        <div id="tc" class="stack">
          <span class="lbl">จำนวนทีม</span>
          <div class="stepper"><button type="button" class="icon-btn" data-d="-1" aria-label="ลดทีม">−</button><b id="tn">6</b><button type="button" class="icon-btn" data-d="1" aria-label="เพิ่มทีม">+</button></div>
          <small class="hint" id="per"></small>
        </div>
        <button class="btn primary">สร้างห้อง</button>
      </form>
      <p class="hint">ห้องเดียวรองรับได้ตั้งแต่กลุ่มเล็ก 2 คน จนถึงงานใหญ่หลายร้อยคน (สูงสุด 12 ทีม)</p>
    </section>${nav('host')}`;
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
    $('#hf').onsubmit = e => {
      e.preventDefault();
      const t = mode === 'team' ? teams : 0;
      state.host = { code: makeRoomCode(t), name: $('#en').value.trim(), teams: t, size: +$('#sz').value, bonus: Array(t).fill(0) };
      save(); host();
    };
    upd();
    return;
  }

  const url = `${location.origin}${location.pathname}?room=${h.code}&n=${encodeURIComponent(h.name)}`;
  let qr = '';
  try { const q = window.qrcode(0, 'M'); q.addData(url); q.make(); qr = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); } catch { /* ไม่มี QR ก็ยังใช้รหัสได้ */ }
  app.innerHTML = `<section class="screen host">
    <div class="host-join card center-t">
      <small>${esc(h.name)}</small>
      <h1 class="h1">สแกนเพื่อเข้าเล่น</h1>
      <div class="qr">${qr}</div>
      <small>หรือเปิดเว็บแล้วกรอกรหัสห้อง</small>
      <div class="code">${h.code}</div>
      <div class="row-btns"><button class="btn ghost sm" id="cp">คัดลอกลิงก์</button><button class="btn ghost sm" id="sh">แชร์</button></div>
      <button class="btn primary" id="jn">เข้าห้องนี้ด้วยเครื่องนี้</button>
      <button class="btn danger" id="cl">ปิดห้อง / สร้างใหม่</button>
    </div>
    <div class="host-board">
      <div class="seg big" role="tablist"><button role="tab" data-v="score" aria-selected="${hostView === 'score'}">คะแนน</button><button role="tab" data-v="poll" aria-selected="${hostView === 'poll'}">โพล / แบบสำรวจ</button></div>
      <div id="hp" ${hostView === 'poll' ? '' : 'hidden'}></div>
      <div id="hs" class="stack" ${hostView === 'score' ? '' : 'hidden'}>
      <h2 class="h1">${h.teams ? 'คะแนนทีม' : 'อันดับผู้เล่น'} ${sync.enabled ? '<span class="live">● LIVE</span>' : ''}</h2>
      ${sync.enabled && h.teams ? `<div class="seg" id="hseg" role="tablist"><button role="tab" data-t="team">รวม</button><button role="tab" data-t="avg">เฉลี่ย/คน</button><button role="tab" data-t="solo">บุคคล</button></div>` : ''}
      <div id="hb"></div>
      ${h.teams ? `<details class="card bonus" ${sync.enabled ? '' : 'open'}><summary>${sync.enabled ? 'ให้คะแนนโบนัสทีม (กิจกรรมนอกจอ)' : 'จดคะแนนทีม'}</summary><div id="bn"></div></details>` : ''}
      ${sync.enabled ? '' : `<p class="hint">${h.teams ? 'ยังไม่ได้เปิดกระดานสด: ให้แต่ละทีมรวม "คะแนนสะสม" ของสมาชิกแล้วกรอกที่นี่ หรือใช้ให้คะแนนกิจกรรมหน้างาน' : 'ยังไม่ได้เปิดกระดานสด: ให้ผู้เล่นโชว์หน้า "คะแนน" ของตัวเองเพื่อหาผู้ชนะ'} · วิธีเปิดกระดานสดดูที่ docs/SETUP.md</p>`}
      </div>
    </div>
  </section>${nav('host')}`;
  let stopPolls = null;
  if (hostView === 'poll') {
    if (sync.enabled) stopPolls = mountHostPolls($('#hp'));
    else $('#hp').innerHTML = `<div class="card stack"><h2>โพลต้องใช้กระดานสด</h2><p>คำตอบของผู้เข้าร่วมต้องส่งมารวมกันที่เซิร์ฟเวอร์กลาง จึงต้องตั้งค่า Supabase ก่อน (ราว 5 นาที) ดูขั้นตอนใน docs/SETUP.md</p></div>`;
  }
  $$('[data-v]').forEach(b => b.onclick = () => { hostView = b.dataset.v; host(); });

  $('#cp').onclick = async () => { try { await navigator.clipboard.writeText(url); toast('คัดลอกลิงก์แล้ว'); } catch { prompt('คัดลอกลิงก์นี้', url); } };
  $('#sh').onclick = () => navigator.share ? navigator.share({ title: h.name, text: `มาเล่นเกมกัน! รหัสห้อง ${h.code}`, url }).catch(() => {}) : $('#cp').click();
  $('#jn').onclick = () => { pendingRoom = { code: h.code, teams: h.teams, name: h.name }; go('#/room'); };
  $('#cl').onclick = () => { if (confirm('ปิดห้องนี้และสร้างห้องใหม่? คะแนนที่จดไว้ในหน้านี้จะหายไป')) { state.host = null; save(); host(); } };

  // คะแนนโบนัส / จดคะแนนเอง
  const hb = $('#hb'), bn = $('#bn');
  const manual = () => {
    const rows = h.bonus.map((v, i) => ({ i, v })).sort((a, b) => b.v - a.v), max = Math.max(1, ...h.bonus);
    hb.innerHTML = `<ol class="ranks">${rows.map((x, k) => rankRow(k, `<span class="ava sm">${TEAMS[x.i].e}</span><span class="grow">ทีม${TEAMS[x.i].n}
      <span class="bar"><i style="width:${x.v / max * 100}%"></i></span></span>`, fmt(x.v), false, TEAMS[x.i].c)).join('')}</ol>`;
  };
  let stopLive = null, tab = h.teams ? 'team' : 'solo';
  const showLive = () => {
    stopLive?.(); $$('#hseg button').forEach(b => b.setAttribute('aria-selected', b.dataset.t === tab));
    stopLive = liveBoard(hb, h.code, h.teams, tab);
  };
  const refresh = () => sync.enabled ? showLive() : h.teams ? manual() : (hb.innerHTML = '');
  if (bn) {
    const paint = () => {
      bn.innerHTML = h.bonus.map((v, i) => `<div class="bn-row" style="--c:${TEAMS[i].c}"><span>${TEAMS[i].e} ${TEAMS[i].n}</span>
        <button class="pill" data-i="${i}" data-d="-10">−10</button><button class="pill val" data-i="${i}" data-d="set" aria-label="แก้คะแนนทีม${TEAMS[i].n}">${fmt(v)}</button>
        <button class="pill" data-i="${i}" data-d="10">+10</button><button class="pill" data-i="${i}" data-d="50">+50</button><button class="pill" data-i="${i}" data-d="100">+100</button></div>`).join('');
      $$('.pill', bn).forEach(b => b.onclick = () => {
        const i = +b.dataset.i;
        if (b.dataset.d === 'set') { const v = prompt(`คะแนนทีม${TEAMS[i].n}`, h.bonus[i]); if (v === null || isNaN(+v)) return; h.bonus[i] = Math.max(0, Math.round(+v)); }
        else h.bonus[i] = Math.max(0, h.bonus[i] + +b.dataset.d);
        save(); sfx.tap(); paint(); refresh();
      });
    };
    paint();
  }
  $$('#hseg button').forEach(b => b.onclick = () => { tab = b.dataset.t; showLive(); });
  refresh();
  leave = () => { stopLive?.(); stopPolls?.(); };
}

// ---------- เริ่มต้น ----------
const qs = new URLSearchParams(location.search);
const fromLink = parseRoomCode(qs.get('room'));
if (fromLink) {
  history.replaceState(null, '', location.pathname + location.hash);
  if (state.room?.code !== fromLink.code) { pendingRoom = { ...fromLink, name: (qs.get('n') || '').slice(0, 40) }; location.hash = '#/room'; }
}
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
render();
