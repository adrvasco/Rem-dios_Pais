// Service worker do app de remédios.
// Rede primeiro (sempre pega a versão nova quando há internet); sem internet, abre a última cópia salva.
// Firebase e fontes (outros domínios) passam direto, sem cache.
const CACHE = 'remedios-v1';
const ARQUIVOS = [
  './', './index.html',
  './manifest.json', './manifest-acompanhar.json',
  './icon-192.png', './icon-512.png', './icon-a-192.png', './icon-a-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(ARQUIVOS.map(u => c.add(u).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.ok) {
          const copia = res.clone();
          caches.open(CACHE).then(c => c.put(req, copia)).catch(() => null);
        }
        return res;
      })
      .catch(() =>
        caches.match(req, { ignoreSearch: true })
          .then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : undefined))
          .then(r => r || Response.error())
      )
  );
});
