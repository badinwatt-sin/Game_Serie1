// กติกาธุรกิจที่ใช้ร่วมกันทั้งหน้า Landing และ Portal: ขั้นของลีด, แบบประเมิน, การจับคู่ผู้จัดการ
export const CFG = window.RC_CONFIG || {};
export const SLA_DAYS = 5;        // ผู้จัดการต้องติดต่อภายในกี่วัน (ต้องตรงกับ rc_sweep ใน recruit.sql)
export const QUEUE_SIZE = 2;      // ส่งให้ผู้จัดการกี่ลำดับก่อนบริษัทติดต่อเอง (2 × 5 วัน = 10 วัน)

export const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const DAY = 864e5;

export const STAGES = [
  { id: 'new', label: 'รอประเมิน', who: 'Admin' },
  { id: 'qualified', label: 'Qualified รอจับคู่', who: 'Admin' },
  { id: 'assigned', label: 'ส่งให้ผู้จัดการแล้ว', who: 'Manager' },
  { id: 'contacted', label: 'ติดต่อแล้ว', who: 'Manager' },
  { id: 'interview', label: 'นัดสัมภาษณ์', who: 'Manager' },
  { id: 'applied', label: 'ยื่นใบสมัคร', who: 'Admin' },
  { id: 'agent', label: 'ตัวแทนใหม่', who: '' },
  { id: 'escalated', label: 'บริษัทติดต่อเอง', who: 'Admin' },
  { id: 'rejected', label: 'ไม่ผ่าน', who: '' }
];
export const stageLabel = id => STAGES.find(s => s.id === id)?.label || id;
export const RANK = { new: 0, qualified: 1, assigned: 2, contacted: 3, interview: 4, applied: 5, agent: 6 };

export const SOURCES = [
  { id: 'facebook_ads', label: 'Facebook Ads', hint: 'โฆษณาจากเพจบริษัท' },
  { id: 'agent_post', label: 'โพสต์ของตัวแทน/ผู้จัดการ', hint: 'แชร์ในหน้าส่วนตัว พร้อมรหัสแนะนำ' },
  { id: 'line', label: 'LINE', hint: 'ส่งในแชตหรือ LINE OA' },
  { id: 'youtube', label: 'YouTube', hint: 'ลิงก์ใต้คลิป' },
  { id: 'tiktok', label: 'TikTok', hint: 'ลิงก์ในโปรไฟล์' },
  { id: 'job_board', label: 'เว็บหางาน', hint: 'ประกาศรับสมัคร' },
  { id: 'print_qr', label: 'สิ่งพิมพ์ / QR', hint: 'โบรชัวร์ ป้าย บูธ' },
  { id: 'event', label: 'งานสัมมนา', hint: 'Career Day, Open House' },
  { id: 'direct', label: 'เข้าตรง', hint: 'ไม่ระบุที่มา' }
];
export const sourceLabel = id => SOURCES.find(s => s.id === id)?.label || id || 'เข้าตรง';

export const STYLES = [
  { id: 'warm', label: 'เครือข่ายคนรู้จัก', desc: 'เริ่มจากเพื่อน ครอบครัว และการแนะนำต่อ', icon: '🤝' },
  { id: 'online', label: 'ออนไลน์ / โซเชียล', desc: 'สร้างตัวตนและหาลูกค้าผ่านคอนเทนต์', icon: '📱' },
  { id: 'corporate', label: 'องค์กร / SME', desc: 'ดูแลเจ้าของกิจการและสวัสดิการพนักงาน', icon: '🏢' },
  { id: 'wealth', label: 'วางแผนการเงิน', desc: 'วางแผนเกษียณ มรดก และการลงทุน', icon: '📈' }
];
export const styleLabel = id => STYLES.find(s => s.id === id)?.label || id || '-';
export const WORK_MODES = [{ id: 'full', label: 'Full-time' }, { id: 'part', label: 'Part-time' }];
export const AGES = [
  { id: 'u20', label: 'ต่ำกว่า 20 ปี' }, { id: '20-29', label: '20–29 ปี' }, { id: '30-39', label: '30–39 ปี' },
  { id: '40-49', label: '40–49 ปี' }, { id: '50+', label: '50 ปีขึ้นไป' }
];

export const REGIONS = {
  'กรุงเทพฯ และปริมณฑล': ['กรุงเทพมหานคร', 'นนทบุรี', 'ปทุมธานี', 'สมุทรปราการ', 'นครปฐม', 'สมุทรสาคร'],
  'ภาคกลาง': ['พระนครศรีอยุธยา', 'อ่างทอง', 'ลพบุรี', 'สิงห์บุรี', 'ชัยนาท', 'สระบุรี', 'นครนายก', 'สุพรรณบุรี', 'สมุทรสงคราม'],
  'ภาคตะวันตก': ['กาญจนบุรี', 'ราชบุรี', 'เพชรบุรี', 'ประจวบคีรีขันธ์', 'ตาก'],
  'ภาคตะวันออก': ['ชลบุรี', 'ระยอง', 'จันทบุรี', 'ตราด', 'ฉะเชิงเทรา', 'ปราจีนบุรี', 'สระแก้ว'],
  'ภาคเหนือ': ['เชียงใหม่', 'เชียงราย', 'ลำพูน', 'ลำปาง', 'แพร่', 'น่าน', 'พะเยา', 'แม่ฮ่องสอน', 'อุตรดิตถ์', 'สุโขทัย', 'พิษณุโลก', 'พิจิตร', 'กำแพงเพชร', 'เพชรบูรณ์', 'นครสวรรค์', 'อุทัยธานี'],
  'ภาคตะวันออกเฉียงเหนือ': ['นครราชสีมา', 'บุรีรัมย์', 'สุรินทร์', 'ศรีสะเกษ', 'อุบลราชธานี', 'ยโสธร', 'ชัยภูมิ', 'อำนาจเจริญ', 'บึงกาฬ', 'หนองบัวลำภู', 'ขอนแก่น', 'อุดรธานี', 'เลย', 'หนองคาย', 'มหาสารคาม', 'ร้อยเอ็ด', 'กาฬสินธุ์', 'สกลนคร', 'นครพนม', 'มุกดาหาร'],
  'ภาคใต้': ['ชุมพร', 'ระนอง', 'สุราษฎร์ธานี', 'พังงา', 'ภูเก็ต', 'กระบี่', 'นครศรีธรรมราช', 'ตรัง', 'พัทลุง', 'สงขลา', 'สตูล', 'ปัตตานี', 'ยะลา', 'นราธิวาส']
};
export const regionOf = p => Object.keys(REGIONS).find(r => REGIONS[r].includes(p)) || '';
export const provinceOptions = (selected = []) => Object.entries(REGIONS).map(([r, ps]) =>
  `<optgroup label="${r}">${ps.map(p => `<option${selected.includes(p) ? ' selected' : ''}>${p}</option>`).join('')}</optgroup>`).join('');

// ---------- แบบประเมินตัวเอง (Pre-Screening): Attitude · Skill · Expectation ----------
export const DIMS = [
  { id: 'attitude', label: 'ทัศนคติ', en: 'Attitude', weight: 0.4 },
  { id: 'skill', label: 'ทักษะ', en: 'Skill', weight: 0.35 },
  { id: 'expectation', label: 'ความคาดหวัง', en: 'Expectation', weight: 0.25 }
];
export const QUESTIONS = [
  { d: 'attitude', q: 'ฉันเชื่อว่าการช่วยให้คนอื่นวางแผนชีวิตและการเงินเป็นงานที่มีคุณค่า' },
  { d: 'attitude', q: 'เมื่อถูกปฏิเสธ ฉันกลับมาลองใหม่ได้โดยไม่เสียกำลังใจนาน' },
  { d: 'attitude', q: 'ฉันจัดตารางและรักษาวินัยของตัวเองได้ แม้ไม่มีใครคอยสั่ง' },
  { d: 'skill', q: 'ฉันเริ่มบทสนทนากับคนที่ไม่รู้จักได้อย่างเป็นธรรมชาติ' },
  { d: 'skill', q: 'ฉันฟังและจับประเด็นความต้องการของอีกฝ่ายได้ดี' },
  { d: 'skill', q: 'ฉันอธิบายเรื่องซับซ้อนให้คนอื่นเข้าใจง่ายได้' },
  { d: 'expectation', q: 'ฉันต้องการรายได้ที่เติบโตตามผลงาน มากกว่าเงินเดือนคงที่' },
  { d: 'expectation', q: 'ฉันพร้อมลงทุนเวลาเรียนรู้และสอบใบอนุญาตในช่วง 2–3 เดือนแรก' },
  { d: 'expectation', q: 'ฉันอยากเติบโตไปถึงการสร้างและบริหารทีมของตัวเอง' }
];
// answers: [1..5] ตามลำดับ QUESTIONS → คะแนนรายด้านเป็น % และเกรด (เซิร์ฟเวอร์คำนวณ total/grade ซ้ำด้วยสูตรเดียวกัน)
export function scorePrescreen(answers, ageRange) {
  const out = {};
  for (const d of DIMS) {
    const vals = QUESTIONS.map((x, i) => x.d === d.id ? answers[i] : null).filter(v => v != null);
    out[d.id] = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length - 1) / 4 * 100);
  }
  out.total = Math.round(DIMS.reduce((s, d) => s + out[d.id] * d.weight, 0));
  out.grade = ageRange === 'u20' ? 'C' : out.total >= 75 ? 'A' : out.total >= 55 ? 'B' : 'C';
  return out;
}
export const GRADE_INFO = {
  A: { title: 'คุณมีแนวโน้มเข้ากับอาชีพนี้สูง', body: 'ทัศนคติ ทักษะ และเป้าหมายของคุณตรงกับคนที่ไปได้ไกลในอาชีพที่ปรึกษา ลงทะเบียนเพื่อคุยกับผู้จัดการในพื้นที่ของคุณได้เลย' },
  B: { title: 'คุณมีพื้นฐานที่ดี', body: 'มีบางด้านที่ทีมจะช่วยพัฒนาเพิ่มได้ผ่านการอบรมและพี่เลี้ยง ลองคุยกับผู้จัดการเพื่อดูว่าเส้นทางนี้ใช่สำหรับคุณไหม' },
  C: { title: 'อาชีพนี้อาจต้องปรับตัวพอสมควร', body: 'ผลประเมินเป็นเพียงมุมมองเบื้องต้น ถ้าคุณยังสนใจ ลงทะเบียนไว้ได้ ทีมงานจะให้ข้อมูลเพิ่มเติมเพื่อประกอบการตัดสินใจ' }
};

// ---------- จับคู่ผู้จัดการ (Selection) ----------
// เกณฑ์: พื้นที่ใกล้ที่สุด 40 · แนวทางการขายตรงกัน 25 · Rating 20 · ยังรับลีดไหว 15
// ผู้ที่ไม่อยู่ในแคมเปญ / ผลงานไม่ผ่านเงื่อนไข / ลีดเต็ม จะไม่ถูกเสนอ · ผู้แนะนำ (ref) ได้สิทธิ์ลำดับแรก
export const OPEN_STAGES = ['assigned', 'contacted', 'interview'];
export function matchManagers(cand, users, candidates) {
  const load = {};
  for (const c of candidates) if (c.manager_id && OPEN_STAGES.includes(c.stage)) load[c.manager_id] = (load[c.manager_id] || 0) + 1;
  const region = regionOf(cand.province);
  return users.filter(u => u.role === 'manager' && u.active).map(u => {
    const open = load[u.id] || 0, reasons = [], blocks = [];
    if (!u.in_campaign) blocks.push('ไม่ได้เข้าร่วมแคมเปญ');
    if (!u.validated) blocks.push('ผลงานยังไม่ผ่านเงื่อนไข');
    if (open >= u.capacity) blocks.push(`ลีดเต็ม (${open}/${u.capacity})`);
    let score = 0;
    const provs = u.provinces || [];
    if (provs.includes(cand.province)) { score += 40; reasons.push(`ดูแล ${cand.province}`); }
    else if (region && provs.some(p => regionOf(p) === region)) { score += 20; reasons.push(`อยู่${region}`); }
    if ((u.styles || []).includes(cand.style)) { score += 25; reasons.push(`ทีม${styleLabel(cand.style)}`); }
    score += Math.round(Number(u.rating) / 5 * 20);
    score += Math.round(Math.max(0, 1 - open / Math.max(1, u.capacity)) * 15);
    const referrer = !!cand.ref_code && u.code === cand.ref_code;
    if (referrer) reasons.unshift('เป็นผู้แนะนำ');
    return { user: u, score, open, reasons, blocks, referrer, eligible: !blocks.length };
  }).sort((a, b) => (b.eligible - a.eligible) || (b.referrer - a.referrer) || (b.score - a.score));
}

// ---------- ตัวช่วยเรื่องเวลา ----------
export const fmtDate = (d, withTime) => d ? new Date(d).toLocaleString('th-TH', withTime
  ? { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' } : { day: 'numeric', month: 'short', year: '2-digit' }) : '-';
export const ago = d => {
  const m = (Date.now() - new Date(d)) / 6e4;
  return m < 60 ? `${Math.max(1, Math.round(m))} นาทีที่แล้ว` : m < 1440 ? `${Math.round(m / 60)} ชม.ที่แล้ว` : `${Math.round(m / 1440)} วันที่แล้ว`;
};
// วันที่เหลือก่อนระบบส่งลีดต่อ (เฉพาะขั้น assigned)
export const slaLeft = c => c.stage === 'assigned' && c.assigned_at ? SLA_DAYS - (Date.now() - new Date(c.assigned_at)) / DAY : null;

// ลิงก์ Landing พร้อมตัวติดตามที่มา: ?s=ช่องทาง &c=แคมเปญ &ref=รหัสผู้แนะนำ
export function landingUrl({ source, campaign, ref } = {}) {
  const u = new URL(CFG.landingUrl || 'index.html', location.href);
  u.search = ''; u.hash = '';
  if (source && source !== 'direct') u.searchParams.set('s', source);
  if (campaign) u.searchParams.set('c', campaign);
  if (ref) u.searchParams.set('ref', ref);
  return u.toString();
}
export function qrSvg(text, size = 180) {
  const qr = window.qrcode(0, 'M'); qr.addData(text); qr.make();
  const n = qr.getModuleCount(), q = 2; let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + q} ${r + q}h1v1h-1z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n + q * 2} ${n + q * 2}" width="${size}" height="${size}" role="img" aria-label="QR code"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#0b1f4b"/></svg>`;
}
export function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 2600);
}
export async function copy(text, label = 'คัดลอกแล้ว') {
  try { await navigator.clipboard.writeText(text); toast(label); }
  catch { prompt('คัดลอกข้อความนี้', text); }
}
