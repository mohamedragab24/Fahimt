const CACHE_NAME = 'fahimni-cache-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
