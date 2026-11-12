// Network-first พร้อม cache สำรอง: มีเน็ตได้ของใหม่เสมอ เน็ตหลุดก็ยังเล่นต่อได้
const CACHE = 'gs1-v2';
const ASSETS = ['./', 'index.html', 'config.js', 'css/style.css', 'js/app.js', 'js/core.js', 'js/games.js',
  'js/data.js', 'js/sync.js', 'js/icons.js', 'js/polls.js', 'js/vendor/qrcode.js', 'icon.svg', 'manifest.webmanifest'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
  );
});
