// محرك خدمة بسيط لتلبية متطلبات PWA
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // تمرير الطلبات كالمعتاد لضمان عمل الموقع بشكل طبيعي
  event.respondWith(fetch(event.request));
});