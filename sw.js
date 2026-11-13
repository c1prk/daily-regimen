// Minimal offline cache for RUNG — caches the app shell so it opens without a network hit.
// Bump CACHE_NAME whenever rung.html changes meaningfully so old data gets replaced.
const CACHE_NAME = 'rung-cache-v7';
const APP_SHELL = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Network-first for the HTML so you always get the latest version when online,
  // falling back to cache when offline.
  // cache:'no-store' skips the browser's HTTP cache (GitHub Pages caches for 10 min),
  // so a new version shows up on the next open instead of up to 10 minutes later.
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
