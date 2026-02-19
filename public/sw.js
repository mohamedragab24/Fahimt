self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // يشترط كروم وجود مستمع لحدث fetch لتفعيل ميزة التثبيت
  event.respondWith(fetch(event.request));
});