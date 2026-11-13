// มินิเกมทั้ง 10 — แต่ละเกมออกแบบให้คะแนนเต็มอยู่ราว ๆ 1,000 เพื่อให้น้ำหนักใกล้เคียงกัน
// api ที่ได้จาก shell: stage, add(n, ev), miss(), score, info(t), timer(s, onEnd), stopTimer(), timeLeft(),
//                      after(ms, fn), every(ms, fn), end()
import { $, $$, esc, rand, rnd, pick, shuffle, clamp, sfx, graphemes } from './core.js';
import { QUIZ, WORDS, MEMORY_ICONS } from './data.js';
import { I } from './icons.js';

const quiz = {
  id: 'quiz', name: 'ควิซสายฟ้า', icon: I.quiz, grad: ['#ff5a1f'], skill: 'ความรู้',
  desc: 'ตอบถูก ตอบไว ได้แต้มเยอะ', how: '10 คำถาม ข้อละ 12 วินาที ยิ่งตอบเร็วยิ่งได้โบนัส', stars: [400, 650, 850],
  start(api) {
    const qs = shuffle(QUIZ).slice(0, 10);
    let i = 0;
    const next = () => {
      if (i >= qs.length) return api.end();
      const q = qs[i], t0 = performance.now();
      let locked = false;
      api.info(`ข้อ ${i + 1}/${qs.length}`);
      api.stage.innerHTML = `<div class="q-card pop"><p>${esc(q.q)}</p></div>
        <div class="opts col">${shuffle(q.a).map((o, k) => `<button class="opt"><i>${'ABCD'[k]}</i><span>${esc(o)}</span></button>`).join('')}</div>`;
      const answer = (b, ev) => {
        if (locked) return; locked = true; api.stopTimer();
        const txt = x => x.querySelector('span').textContent, ok = !!b && txt(b) === q.a[0];
        $$('.opt', api.stage).forEach(x => { x.disabled = true; if (txt(x) === q.a[0]) x.classList.add('ok'); });
        if (ok) api.add(50 + Math.round(clamp(1 - (performance.now() - t0) / 12000, 0, 1) * 50), ev);
        else { b?.classList.add('no'); api.miss(); }
        i++; api.after(ok ? 700 : 1500, next);
      };
      $$('.opt', api.stage).forEach(b => b.onclick = ev => answer(b, ev));
      api.timer(12, () => answer(null));
    };
    next();
  }
};

const memory = {
  id: 'memory', name: 'จับคู่ความจำ', icon: I.memory, grad: ['#e6399b'], skill: 'ความจำ',
  desc: 'เปิดการ์ดหาคู่ให้ครบ', how: 'จับคู่ให้ครบ 8 คู่ใน 60 วินาที เหลือเวลาเท่าไรได้โบนัสเพิ่ม', stars: [400, 800, 950],
  start(api) {
    const cards = shuffle([...shuffle(MEMORY_ICONS).slice(0, 8)].flatMap(x => [x, x]));
    api.stage.innerHTML = `<div class="mem-grid">${cards.map((c, i) =>
      `<button class="mem" data-i="${i}" aria-label="การ์ด ${i + 1}"><span class="mem-in"><span class="mem-f">?</span><span class="mem-b">${c}</span></span></button>`).join('')}</div>`;
    let open = [], found = 0, busy = false;
    api.info('0/8 คู่');
    api.timer(60, api.end);
    $$('.mem', api.stage).forEach(b => b.onclick = ev => {
      if (busy || b.classList.contains('on')) return;
      sfx.tap(); b.classList.add('on'); open.push(b);
      if (open.length < 2) return;
      const [a, c] = open; open = [];
      if (cards[a.dataset.i] === cards[c.dataset.i]) {
        a.classList.add('done'); c.classList.add('done'); found++;
        api.add(100, ev); api.info(`${found}/8 คู่`);
        if (found === 8) { api.stopTimer(); api.add(Math.round(api.timeLeft() * 5)); api.after(600, api.end); }
      } else {
        busy = true;
        api.after(650, () => { a.classList.remove('on'); c.classList.remove('on'); busy = false; });
      }
    });
  }
};

const reaction = {
  id: 'reaction', name: 'ไวกว่าแสง', icon: I.reaction, grad: ['#12a65c'], skill: 'ปฏิกิริยา',
  desc: 'แตะทันทีเมื่อจอเป็นสีเขียว', how: '5 รอบ รอให้จอเปลี่ยนเป็นสีเขียวแล้วแตะให้ไวที่สุด แตะก่อน = อดแต้มรอบนั้น', stars: [450, 700, 880],
  start(api) {
    let round = 0, t0 = 0, phase = 'idle', wait;
    api.stage.innerHTML = `<button class="react-pad" aria-live="polite"><b></b><small></small></button>`;
    const pad = $('.react-pad', api.stage), big = $('b', pad), sub = $('small', pad);
    const arm = () => {
      if (round >= 5) return api.end();
      round++; phase = 'wait'; api.info(`รอบ ${round}/5`);
      pad.className = 'react-pad wait'; big.textContent = 'รอ...'; sub.textContent = 'อย่าเพิ่งแตะ';
      wait = api.after(rand(1200, 3600), () => { phase = 'go'; t0 = performance.now(); pad.className = 'react-pad go'; big.textContent = 'แตะ!'; sub.textContent = ''; sfx.go(); });
    };
    pad.addEventListener('pointerdown', ev => {
      if (phase === 'wait') {
        clearTimeout(wait); phase = 'idle'; pad.className = 'react-pad early';
        big.textContent = 'เร็วไป!'; sub.textContent = 'รอบนี้ไม่ได้แต้ม'; api.miss(); api.after(1100, arm);
      } else if (phase === 'go') {
        const ms = Math.round(performance.now() - t0); phase = 'idle';
        pad.className = 'react-pad hit'; big.textContent = `${ms} ms`;
        sub.textContent = ms < 280 ? 'สายฟ้าแลบ!' : ms < 400 ? 'ไวมาก!' : 'ยังไวได้อีก';
        api.add(Math.round(clamp(200 - (ms - 180) * 0.5, 20, 200)), ev); api.after(1100, arm);
      }
    });
    arm();
  }
};

const scramble = {
  id: 'scramble', name: 'สลับอักษร', icon: I.scramble, grad: ['#1c8ef0'], skill: 'ภาษา',
  desc: 'เรียงตัวอักษรให้เป็นคำ', how: 'แตะตัวอักษรเรียงเป็นคำตามคำใบ้ ภายใน 60 วินาที คำละ 100 แต้ม กด "ข้าม" ได้ถ้าคิดไม่ออก', stars: [300, 600, 900],
  start(api) {
    const list = shuffle(WORDS);
    let n = 0, solved = 0;
    api.timer(60, api.end);
    const next = () => {
      const { w, h } = list[n++ % list.length], parts = graphemes(w);
      let tiles = shuffle(parts);
      if (tiles.join('') === w) tiles = [...parts].reverse();
      const ans = [];
      api.info(`ถูก ${solved} คำ`);
      api.stage.innerHTML = `<div class="q-card pop"><small>คำใบ้</small><p>${esc(h)}</p></div>
        <div class="slots">${parts.map(() => '<span class="slot"></span>').join('')}</div>
        <div class="tiles">${tiles.map((t, i) => `<button class="tile" data-i="${i}">${esc(t)}</button>`).join('')}</div>
        <div class="row-btns"><button class="btn ghost sm" data-a="undo">ลบ</button><button class="btn ghost sm" data-a="skip">ข้าม</button></div>`;
      const slots = $$('.slot', api.stage);
      const paint = () => slots.forEach((s, i) => { s.textContent = ans[i] ? tiles[ans[i].dataset.i] : ''; s.classList.toggle('fill', !!ans[i]); });
      $$('.tile', api.stage).forEach(b => b.onclick = ev => {
        if (b.disabled) return;
        sfx.tap(); b.disabled = true; ans.push(b); paint();
        if (ans.length < parts.length) return;
        if (ans.map(x => tiles[x.dataset.i]).join('') === w) { solved++; api.add(100, ev); $('.slots', api.stage).classList.add('ok'); api.after(450, next); }
        else {
          api.miss(); $('.slots', api.stage).classList.add('shake');
          api.after(450, () => { ans.splice(0).forEach(x => x.disabled = false); paint(); $('.slots', api.stage)?.classList.remove('shake'); });
        }
      });
      $('[data-a=undo]', api.stage).onclick = () => { const b = ans.pop(); if (b) { b.disabled = false; paint(); } };
      $('[data-a=skip]', api.stage).onclick = next;
    };
    next();
  }
};

const math = {
  id: 'math', name: 'คิดเลขเร็ว', icon: I.math, grad: ['#0c9c9c'], skill: 'ตรรกะ',
  desc: 'บวก ลบ คูณ แข่งกับเวลา', how: '45 วินาที ตอบถูกต่อเนื่องได้โบนัสคอมโบ ตอบผิด -20 และคอมโบหาย', stars: [300, 550, 800],
  start(api) {
    let streak = 0, n = 0;
    api.timer(45, api.end);
    const next = () => {
      const lv = Math.min(3, Math.floor(n / 4)); n++;
      const op = pick(lv === 0 ? ['+', '-'] : ['+', '-', '×']);
      let a, b, ans;
      if (op === '×') { a = rand(2, 6 + lv * 2); b = rand(2, 9); ans = a * b; }
      else if (op === '+') { a = rand(3, 20 + lv * 25); b = rand(3, 20 + lv * 25); ans = a + b; }
      else { a = rand(8, 30 + lv * 30); b = rand(2, a - 1); ans = a - b; }
      const opts = new Set([ans]);
      while (opts.size < 4) { const d = ans + pick([-10, -3, -2, -1, 1, 2, 3, 10]); if (d >= 0) opts.add(d); }
      api.info(streak > 1 ? `คอมโบ x${streak}` : '');
      api.stage.innerHTML = `<div class="big-q pop">${a} ${op} ${b}</div>
        <div class="opts two col">${shuffle([...opts]).map(o => `<button class="opt num">${o}</button>`).join('')}</div>`;
      $$('.opt', api.stage).forEach(x => x.onclick = ev => {
        if (+x.textContent === ans) { streak++; api.add(25 + Math.min(streak - 1, 5) * 3, ev); }
        else { streak = 0; api.add(-20, ev); }
        next();
      });
    };
    next();
  }
};

const COLORS = [
  { n: 'แดง', c: '#ef4444' }, { n: 'เขียว', c: '#22c55e' }, { n: 'ฟ้า', c: '#38bdf8' },
  { n: 'เหลือง', c: '#facc15' }, { n: 'ม่วง', c: '#c084fc' }, { n: 'ส้ม', c: '#fb923c' }
];
const stroop = {
  id: 'stroop', name: 'สีหลอกตา', icon: I.stroop, grad: ['#e03131'], skill: 'สมาธิ',
  desc: 'ตอบ "สีของตัวอักษร" ไม่ใช่คำที่อ่าน', how: '45 วินาที เลือกปุ่มที่ตรงกับ "สีหมึก" ของคำ อย่าให้คำที่อ่านหลอกได้! ตอบผิด -20', stars: [350, 650, 900],
  start(api) {
    let streak = 0;
    api.timer(45, api.end);
    const next = () => {
      const word = pick(COLORS), ink = pick(COLORS.filter(c => c !== word));
      const opts = shuffle([ink, word, ...shuffle(COLORS.filter(c => c !== ink && c !== word)).slice(0, 2)]);
      api.info(streak > 1 ? `คอมโบ x${streak}` : 'ตัวอักษรสีอะไร?');
      api.stage.innerHTML = `<div class="big-q pop stroke" style="color:${ink.c}">${word.n}</div>
        <div class="opts two">${opts.map(o => `<button class="opt swatch" data-c="${o.c}"><i style="background:${o.c}"></i>${o.n}</button>`).join('')}</div>`;
      $$('.opt', api.stage).forEach(x => x.onclick = ev => {
        if (x.dataset.c === ink.c) { streak++; api.add(35 + Math.min(streak - 1, 5) * 5, ev); }
        else { streak = 0; api.add(-20, ev); }
        next();
      });
    };
    next();
  }
};

const sequence = {
  id: 'sequence', name: 'จำลำดับแสง', icon: I.sequence, grad: ['#8f4bf0'], skill: 'ความจำ',
  desc: 'จำลำดับแล้วแตะตามให้ถูก', how: 'ดูลำดับไฟแล้วแตะตาม ลำดับจะยาวขึ้นทุกรอบ แตะผิดครั้งเดียวจบเกม ผ่าน 10 รอบได้ 1,100 แต้ม', stars: [300, 560, 900],
  start(api) {
    const pads = ['', '', '', '', '', ''];
    api.stage.innerHTML = `<div class="seq-msg" aria-live="polite"></div>
      <div class="seq-grid">${pads.map((p, i) => `<button class="seq" data-i="${i}" aria-label="ปุ่ม ${i + 1}">${p}</button>`).join('')}</div>`;
    const btns = $$('.seq', api.stage), msg = $('.seq-msg', api.stage), seq = [];
    let pos = 0, input = false;
    const flash = i => { btns[i].classList.add('lit'); sfx.note(i); api.after(260, () => btns[i].classList.remove('lit')); };
    const round = () => {
      if (seq.length >= 10) return api.end();
      input = false; seq.push(rand(0, 5)); pos = 0;
      api.info(`รอบ ${seq.length}`); msg.textContent = 'ดูให้ดี...';
      const gap = Math.max(340, 620 - seq.length * 25);
      seq.forEach((s, k) => api.after(600 + k * gap, () => flash(s)));
      api.after(600 + seq.length * gap, () => { input = true; msg.textContent = 'ตาคุณแล้ว!'; });
    };
    btns.forEach(b => b.addEventListener('pointerdown', ev => {
      if (!input) return;
      const i = +b.dataset.i;
      if (i !== seq[pos]) { input = false; b.classList.add('wrong'); msg.textContent = 'ผิดลำดับ!'; api.miss(); return api.after(900, api.end); }
      flash(i); pos++;
      if (pos === seq.length) { input = false; api.add(seq.length * 20, ev); msg.textContent = 'เยี่ยม!'; api.after(700, round); }
    }));
    round();
  }
};

const oddone = {
  id: 'oddone', name: 'ตาไวจับผิด', icon: I.oddone, grad: ['#e8890c'], skill: 'การสังเกต',
  desc: 'หาช่องที่สีต่างจากเพื่อน', how: '45 วินาที แตะช่องที่สีไม่เหมือนช่องอื่น ยิ่งผ่านหลายด่าน ตารางยิ่งใหญ่และสียิ่งใกล้กัน แตะผิด -15', stars: [350, 650, 900],
  start(api) {
    let lv = 0;
    api.timer(45, api.end);
    const next = () => {
      lv++;
      const n = Math.min(6, 2 + Math.floor(lv / 2)), hue = rand(0, 359), diff = Math.max(5, 22 - lv * 1.4), odd = rand(0, n * n - 1);
      api.info(`ด่าน ${lv}`);
      api.stage.innerHTML = `<div class="odd-grid pop" style="--n:${n}">${Array.from({ length: n * n }, (_, i) =>
        `<button class="odd" data-o="${+(i === odd)}" aria-label="ช่อง ${i + 1}" style="background:hsl(${hue} 70% ${i === odd ? 55 + diff : 55}%)"></button>`).join('')}</div>`;
      $$('.odd', api.stage).forEach(b => b.addEventListener('pointerdown', ev => {
        if (b.dataset.o === '1') { api.add(30 + Math.min(lv, 15) * 3, ev); next(); }
        else { b.classList.add('shake'); api.add(-15, ev); }
      }));
    };
    next();
  }
};

const targets = {
  id: 'targets', name: 'ล่าดาว', icon: I.targets, grad: ['#d6336c'], skill: 'ความเร็ว',
  desc: 'แตะดาวให้ทัน หลบระเบิด', how: '30 วินาที ⭐ +15 · 💎 +50 · 💣 -80 เป้าจะหายเร็วขึ้นเรื่อย ๆ', stars: [300, 480, 650],
  start(api) {
    api.stage.innerHTML = `<div class="field"></div>`;
    const field = $('.field', api.stage);
    api.timer(30, api.end);
    const spawn = () => {
      const r = rnd(), kind = r < 0.22 ? ['💣', -80] : r < 0.32 ? ['💎', 50] : ['⭐', 15];
      const life = 650 + api.timeLeft() * 22;
      const t = document.createElement('button');
      t.className = 'target'; t.textContent = kind[0]; t.setAttribute('aria-label', kind[0]);
      t.style.left = rand(2, 80) + '%'; t.style.top = rand(2, 82) + '%';
      t.style.animationDuration = life + 'ms';
      t.addEventListener('pointerdown', ev => { if (t.dataset.hit) return; t.dataset.hit = 1; api.add(kind[1], ev); t.classList.add('hit'); setTimeout(() => t.remove(), 150); });
      field.append(t);
      api.after(life, () => t.remove());
      api.after(420 + api.timeLeft() * 10, spawn);
    };
    spawn();
  }
};

const order = {
  id: 'order', name: 'เรียงเลขสายตาไว', icon: I.order, grad: ['#3358e0'], skill: 'สมาธิ',
  desc: 'แตะเลข 1 ถึง 25 ตามลำดับ', how: 'แตะเลขเรียงจาก 1 ไป 25 ให้เร็วที่สุดใน 60 วินาที เลขละ 20 แต้ม แตะผิด -5 ครบแล้วเวลาที่เหลือเป็นโบนัส', stars: [320, 560, 800],
  start(api) {
    let want = 1;
    api.stage.innerHTML = `<div class="ord-grid">${shuffle(Array.from({ length: 25 }, (_, i) => i + 1)).map(v => `<button class="ord">${v}</button>`).join('')}</div>`;
    api.info('หาเลข 1'); api.timer(60, api.end);
    $$('.ord', api.stage).forEach(b => b.addEventListener('pointerdown', ev => {
      if (b.disabled) return;
      if (+b.textContent !== want) { b.classList.add('shake'); setTimeout(() => b.classList.remove('shake'), 300); return api.add(-5, ev); }
      b.disabled = true; want++; api.add(20, ev);
      if (want > 25) { api.stopTimer(); api.add(Math.round(api.timeLeft() * 12)); return api.after(500, api.end); }
      api.info(`หาเลข ${want}`);
    }));
  }
};

export const GAMES = [quiz, memory, reaction, scramble, math, stroop, sequence, oddone, targets, order];
