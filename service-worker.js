self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('hub-auto-v1').then((cache) => cache.addAll([
      '/',
      '/index.html',
      '/css/style.css',
      '/manifest.json',
    ]))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        const copy = res.clone();
        if (req.url.startsWith(self.location.origin) && res.ok) {
          caches.open('hub-auto-v1').then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
