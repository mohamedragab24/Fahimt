
// محرك الخدمة (Service Worker) لتفعيل ميزة تثبيت التطبيق
const CACHE_NAME = 'fahimni-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // مطلوب وجود مستمع لحدث fetch لكي يعتبر المتصفح الموقع PWA قابلاً للتثبيت
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
