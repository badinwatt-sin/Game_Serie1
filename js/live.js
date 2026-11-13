// หน้า Live: จอใหญ่สำหรับฉายให้ทั้งห้องดู + แถบสั่งงานของผู้สอนด้านล่าง
// ฉากเปลี่ยนตามสถานะห้อง: ผนังตัวละคร → เตรียมเกม → นับถอยหลัง → แข่งสด → โพเดียม (หรือ โพล / อันดับรวม)
import { $, $$, esc, fmt, sfx, confetti, toast, TEAMS } from './core.js';
import * as sync from './sync.js';
import { GAMES } from './games.js';
import { resultHTML } from './polls.js';
import { ava, game, roundKey, boardHTML } from './ui.js';

const LANES = 8;

export function mountLive(app, code, onGone) {
  let H = null, players = [], polls = [], votes = [], scene = '', ctlKey = '', stop = false, firstLoad = true, cheered = '', lastCount = null;
  const url = `${location.origin}${location.pathname}?room=${code}`;
  let qr = '';
  try { const q = window.qrcode(0, 'M'); q.addData(url); q.make(); qr = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); } catch { /* ใช้รหัสห้องแทนได้ */ }

  app.innerHTML = `<section class="lv">
    <header class="lv-top"><b id="lv-name"></b>
      <span class="lv-join">เข้าร่วม: <b>${esc(location.host)}</b> · รหัส <i>${code}</i></span>
      <span class="lv-n"><b id="lv-pc">0</b> คน</span></header>
    <main class="lv-main" id="lv-main"><p class="hint">กำลังเปิดห้อง…</p></main>
    <footer class="lv-ctl" id="lv-ctl"></footer>
  </section>`;
  const main = $('#lv-main'), ctl = $('#lv-ctl');
  const R = () => H?.state?.round || null;
  const inRound = () => players.filter(p => p.round != null).sort((a, b) => b.round - a.round);

  // ---------- ฉาก ----------
  const scenes = {
    lobby: {
      build() {
        main.innerHTML = `<div class="lv-lobby"><div class="lv-qr"><div class="qr">${qr}</div><div class="code">${code}</div><p>สแกนเพื่อเข้าร่วม</p></div>
          <div class="lv-wall"><h1>ใครมาแล้วบ้าง</h1><div class="lv-crowd" id="crowd"></div><p class="hint" id="nobody">รอผู้เล่นคนแรก…</p></div></div>`;
      },
      update() {
        const box = $('#crowd'), seen = new Set(players.map(p => p.pid));
        for (const p of players) if (!box.querySelector(`[data-pid="${CSS.escape(p.pid)}"]`)) {
          const d = document.createElement('div');
          d.className = 'lv-p pop'; d.dataset.pid = p.pid;
          d.innerHTML = `${ava(p, 'big')}<b>${esc(p.name)}</b><small>${esc(p.style || '')}</small>`;
          box.append(d);
          if (!firstLoad) sfx.tap();
        }
        $$('.lv-p', box).forEach(d => seen.has(d.dataset.pid) || d.remove());
        $('#nobody').hidden = players.length > 0;
      }
    },
    ready: {
      build() {
        const g = game(R().game);
        main.innerHTML = `<div class="lv-ready pop"><div class="lv-ico" style="--a:${g.grad[0]}">${g.icon}</div>
          <small>รอบที่ ${R().n} · เกมต่อไป</small><h1>${g.name}</h1><p>${g.how}</p>
          <div class="dots" aria-hidden="true"><i></i><i></i><i></i></div><p class="lv-sub">ทุกคนจะเริ่มพร้อมกันเมื่อผู้สอนปล่อยเกม</p></div>`;
      },
      update() {}
    },
    count: {
      build() { main.innerHTML = `<div class="lv-count"><small>${game(R().game).name}</small><b id="cn"></b></div>`; lastCount = null; },
      update() {
        const n = Math.max(1, Math.ceil((R().startAt - sync.now()) / 1000));
        if (n !== lastCount) { lastCount = n; const el = $('#cn'); el.textContent = n; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); sfx.tick(); }
      }
    },
    race: {
      build() {
        sfx.go();
        main.innerHTML = `<div class="lv-race"><div class="lv-lanes" id="lanes"><p class="hint" id="nolane">รอคะแนนแรก…</p></div>
          <aside class="lv-side"><div class="lv-ring"><b id="dn">0</b><small>จาก <span id="tot">0</span> คน เล่นจบแล้ว</small></div>
            <div class="lv-clock" id="ck">0:00</div>${H.teams ? '<div class="lv-teams" id="tb"></div>' : ''}</aside></div>`;
      },
      update() {
        const list = inRound(), top = list.slice(0, LANES), max = Math.max(1, top[0]?.round || 0), box = $('#lanes');
        $('#nolane').hidden = top.length > 0;
        top.forEach((p, i) => {
          let el = box.querySelector(`[data-pid="${CSS.escape(p.pid)}"]`);
          if (!el) {
            el = document.createElement('div'); el.className = 'lane'; el.dataset.pid = p.pid; el.style.setProperty('--c', p.color || '#fff');
            el.innerHTML = `<span class="ln-pos"></span><span class="ln-track"><i></i>${ava(p)}</span><span class="ln-name">${esc(p.name)}</span><b class="ln-sc"></b>`;
            box.append(el);
          }
          el.style.setProperty('--y', i); el.style.setProperty('--w', (p.round / max * 100).toFixed(1));
          el.classList.toggle('fin', !!p.rdone);
          $('.ln-pos', el).textContent = i + 1; $('.ln-sc', el).textContent = fmt(p.round);
        });
        const keep = new Set(top.map(p => p.pid));
        $$('.lane', box).forEach(el => keep.has(el.dataset.pid) || el.remove());
        const done = list.filter(p => p.rdone).length;
        $('#dn').textContent = done; $('#tot').textContent = players.length;
        const s = Math.max(0, Math.floor((sync.now() - R().startAt) / 1000));
        $('#ck').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
        const tb = $('#tb');
        if (tb) {
          const tt = sync.teamTotals(list.map(p => ({ ...p, total: p.round })), H.teams).sort((a, b) => b.total - a.total), tm = Math.max(1, tt[0].total);
          tb.innerHTML = tt.map(t => `<div class="tbar-row" style="--c:${TEAMS[t.team].c}"><span>${TEAMS[t.team].e}</span><span class="bar"><i style="width:${t.total / tm * 100}%"></i></span><b>${fmt(t.total)}</b></div>`).join('');
        }
        $('[data-o=fin]', ctl)?.classList.toggle('pulse', players.length > 0 && done >= players.length);
      }
    },
    done: {
      build() { main.innerHTML = `<div class="lv-done"><h1>ผลรอบที่ ${R().n} · ${game(R().game).name}</h1><div id="pod"></div><div class="lv-after" id="after"></div></div>`; this.sig = ''; },
      update() {
        const list = inRound(), top = list.slice(0, 3), sig = top.map(p => p.pid + p.round).join('|');
        if (sig !== this.sig) {
          const again = !!this.sig; this.sig = sig;
          $('#pod').innerHTML = top.length ? `<div class="podium ${again ? 'still' : ''}">${[1, 0, 2].filter(i => top[i]).map(i =>
            `<div class="pod p${i + 1}" style="--c:${esc(top[i].color || '#fff')}">${ava(top[i], 'big')}<b>${esc(top[i].name)}</b><span>${fmt(top[i].round)}</span><i>${i + 1}</i></div>`).join('')}</div>`
            : '<p class="hint">ไม่มีใครส่งคะแนนในรอบนี้</p>';
        }
        $('#after').innerHTML = `${H.teams ? `<div><h2>ทีมในรอบนี้</h2>${boardHTML(players, H.teams, 'team', null, { field: 'round' })}</div>` : ''}
          <div><h2>อันดับรวมตอนนี้</h2>${H.teams ? boardHTML(players, H.teams, 'team', H.state.bonus) : boardHTML(players, 0, 'solo', null, { top: 5 })}</div>`;
        if (cheered !== scene && top.length) { cheered = scene; sfx.win(); confetti(220); }
      }
    },
    poll: {
      build() { main.innerHTML = `<div class="lv-poll card"><small class="kicker">คำถามจากผู้สอน</small><h1 id="pq"></h1><div id="pr"></div></div>`; },
      update() {
        const p = polls.filter(x => x.open).pop(); if (!p) return;
        $('#pq').textContent = p.q;
        const h = resultHTML(p, votes), box = $('#pr');
        if (box._h !== h) { box._h = h; box.innerHTML = h; }
      }
    },
    board: {
      build() { main.innerHTML = `<div class="lv-board"><h1>อันดับรวม</h1><div class="lv-after" id="bd"></div></div>`; },
      update() {
        $('#bd').innerHTML = `${H.teams ? `<div><h2>ทีม</h2>${boardHTML(players, H.teams, 'team', H.state.bonus)}</div>` : ''}
          <div><h2>บุคคล</h2>${boardHTML(players, H.teams, 'solo', null, { top: H.teams ? 6 : 10 })}</div>`;
      }
    }
  };

  // ---------- แถบสั่งงาน ----------
  const drawCtl = () => {
    const r = R(), ph = r?.phase || 'none', key = ph + (r?.n || '');
    if (key === ctlKey) return; ctlKey = key;
    const picker = `<select id="gs" class="inp" aria-label="เลือกเกม">${GAMES.map(g => `<option value="${g.id}">${g.name}</option>`).join('')}</select><button class="btn ${ph === 'none' ? 'primary' : 'ghost'}" data-o="prep">เตรียมเกมนี้</button>`;
    ctl.innerHTML = `${ph === 'ready' ? `<button class="btn primary go" data-o="rel">ปล่อยเกม!</button><button class="btn ghost" data-o="clr">ยกเลิก</button>`
      : ph === 'live' ? `<button class="btn primary" data-o="fin">จบรอบและประกาศผล</button>`
      : ph === 'done' ? `<button class="btn primary" data-o="clr">กลับหน้ารอ</button>${picker}` : picker}
      <span class="grow"></span><button class="btn ghost" data-o="fs">เต็มจอ</button><a class="btn ghost" href="#/host">ห้องควบคุม</a>`;
    if (r && $('#gs')) { const i = GAMES.findIndex(g => g.id === r.game); $('#gs').value = GAMES[(i + 1) % GAMES.length].id; } // เสนอเกมถัดไป
  };
  ctl.onclick = async e => {
    const o = e.target.closest('[data-o]')?.dataset.o; if (!o || !H) return;
    if (o === 'fs') return document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.().catch(() => {});
    const ops = sync.roundOps(H);
    const r = await (o === 'prep' ? ops.prepare($('#gs').value) : o === 'rel' ? ops.release() : o === 'fin' ? ops.finish() : ops.clear());
    if (!r.ok) toast('สั่งงานไม่สำเร็จ ตรวจสอบการเชื่อมต่อ');
    render();
  };
  const onKey = e => { if (e.code === 'Space' && !/SELECT|INPUT|BUTTON|A/.test(e.target.tagName)) { e.preventDefault(); $('.btn.primary', ctl)?.click(); } };
  addEventListener('keydown', onKey);

  // ---------- วงรอบ ----------
  function render() {
    if (!H) return;
    const r = R(), g = r && game(r.game);
    const kind = !g ? (polls.some(p => p.open) ? 'poll' : H.state.board ? 'board' : 'lobby')
      : r.phase === 'ready' ? 'ready' : r.phase === 'done' ? 'done' : sync.now() < r.startAt ? 'count' : 'race';
    const id = kind + (g ? r.n : '');
    document.body.style.setProperty('--bg', g && kind !== 'done' ? g.grad[0] : '');
    if (id !== scene) { scene = id; main.dataset.scene = kind; scenes[kind].build(); }
    scenes[kind].update();
    drawCtl();
    $('#lv-name').textContent = H.name; $('#lv-pc').textContent = players.length;
  }
  async function tick() {
    if (document.hidden) return;
    const got = await sync.getRoom(code);
    if (stop) return;
    if (got.ok && !got.data) return onGone();
    if (got.ok) H = got.data;
    if (!H) return;
    const r = R();
    const [b, pl, vt] = await Promise.all([sync.fetchRoom(code, r ? roundKey(r) : null), r ? null : sync.listPolls(code), r ? null : sync.listVotes(code)]);
    if (stop) return;
    if (!b.error) players = b.players;
    if (pl?.ok) polls = pl.data; if (vt?.ok) votes = vt.data;
    render(); firstLoad = false;
  }
  sync.syncClock().then(tick);
  const slow = setInterval(tick, 1500), fast = setInterval(() => { if (/^(count|race)/.test(scene)) render(); }, 200);
  return () => { stop = true; clearInterval(slow); clearInterval(fast); removeEventListener('keydown', onKey); };
}
