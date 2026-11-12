// ไอคอนวาดเอง (SVG 24x24) — ใช้สี currentColor, ส่วนที่ "เจาะ" ใช้สีพื้นของการ์ด (--a)
const svg = body => `<svg class="ic" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${body}</svg>`;
export const I = {
  quiz: svg('<path d="M13.5 2 5 13.5h5.5L9.5 22 19 10h-6z"/>'),
  memory: svg('<rect x="3" y="6" width="11" height="15" rx="2.5" opacity=".55"/><rect x="10" y="3" width="11" height="15" rx="2.5"/>'),
  reaction: svg('<path d="M9 1.5h6V4H9z"/><circle cx="12" cy="13.5" r="8.5"/><path d="M12 13.5V8.5" stroke="var(--a,#333)" stroke-width="2.6" stroke-linecap="round"/>'),
  scramble: svg('<text x="12" y="18.5" text-anchor="middle" font-size="16" font-weight="800">กข</text>'),
  math: svg('<path d="M3 6.5h7M6.5 3v7M14 6.5h7M4 15l5 5M9 15l-5 5M14 15.5h7M14 19.5h7" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" fill="none"/>'),
  stroop: svg('<circle cx="12" cy="8" r="6"/><circle cx="7.5" cy="15.5" r="6" opacity=".6"/><circle cx="16.5" cy="15.5" r="6" opacity=".35"/>'),
  sequence: svg('<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2" opacity=".45"/><rect x="3" y="13" width="8" height="8" rx="2" opacity=".45"/><rect x="13" y="13" width="8" height="8" rx="2" opacity=".75"/>'),
  oddone: svg('<path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z"/><circle cx="12" cy="12" r="3.6" fill="var(--a,#333)"/>'),
  targets: svg('<path d="m12 1.8 3.1 6.5 7.1.9-5.2 4.9 1.3 7-6.3-3.4-6.3 3.4 1.3-7L1.8 9.2l7.1-.9z"/>'),
  order: svg('<text x="12" y="17" text-anchor="middle" font-size="12.5" font-weight="800">123</text>'),
  // เมนู
  games: svg('<rect x="3" y="3" width="8" height="8" rx="2.2"/><rect x="13" y="3" width="8" height="8" rx="2.2"/><rect x="3" y="13" width="8" height="8" rx="2.2"/><rect x="13" y="13" width="8" height="8" rx="2.2"/>'),
  poll: svg('<rect x="3" y="12" width="4.5" height="9" rx="1.5"/><rect x="9.75" y="3" width="4.5" height="18" rx="1.5"/><rect x="16.5" y="8" width="4.5" height="13" rx="1.5"/>'),
  board: svg('<path d="M7 3h10v5a5 5 0 0 1-10 0z"/><path d="M7 5H3.5v1.5A3.5 3.5 0 0 0 7 10M17 5h3.5v1.5A3.5 3.5 0 0 1 17 10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10.5 13h3v4h-3zM7.5 18h9v3h-9z"/>'),
  room: svg('<circle cx="8.5" cy="8" r="3.5"/><path d="M2 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6z"/><circle cx="17" cy="9" r="2.8" opacity=".6"/><path d="M16.5 20c0-2-.5-3.700-1.600-5A5.300 5.300 0 0 1 22 20z" opacity=".6"/>'),
  host: svg('<path d="M3 9.500v5h3.500L14 19V5L6.500 9.500z"/><path d="M17 8.500a5 5 0 0 1 0 7" fill="none" stroke="currentColor" stroke-width="2.200" stroke-linecap="round"/>'),
  mute: svg('<path d="M3 9.500v5h3.500L14 19V5L6.500 9.500z"/><path d="m17 9.500 5 5m0-5-5 5" fill="none" stroke="currentColor" stroke-width="2.200" stroke-linecap="round"/>'),
  close: svg('<path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>'),
  star: svg('<path d="m12 1.800 3.100 6.500 7.100.900-5.200 4.900 1.300 7-6.300-3.400-6.300 3.400 1.300-7L1.800 9.200l7.100-.900z"/>')
};
