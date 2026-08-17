const CACHE = 'ajit-planner-v1';
const OFFLINE_URL = '/myplanner/';

const PRECACHE = [
  '/myplanner/',
  '/myplanner/index.html',
  '/myplanner/manifest.json',
  '/myplanner/icons/icon-192.png',
  '/myplanner/icons/icon-512.png',
];

// Install: pre-cache shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

// Activate: remove old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first for Firebase/CDN, cache-first for app shell
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Skip non-GET and cross-origin Firebase/analytics requests
  if (e.request.method !== 'GET') return;
  if (url.hostname.includes('firestore.googleapis.com')) return;
  if (url.hostname.includes('firebase')) return;
  if (url.hostname.includes('gstatic.com')) return;
  if (url.hostname.includes('google-analytics.com')) return;

  // Network-first for HTML (always get fresh app)
  if (e.request.destination === 'document') {
    e.respondWith(
      fetch(e.request)
        .then(res => { caches.open(CACHE).then(c => c.put(e.request, res.clone())); return res; })
        .catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // Cache-first for everything else (icons, manifest)
  e.respondWith(
    caches.match(e.request).then(cached => cached ||
      fetch(e.request).then(res => {
        if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      })
    )
  );
});
