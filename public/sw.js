// const CACHE_NAME = 'clarity-v1.0.0';
// const urlsToCache = ['/', '/index.html'];

// self.addEventListener('install', (event) => {
//   event.waitUntil(
//     caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
//   );
//   self.skipWaiting();
// });

// self.addEventListener('activate', (event) => {
//   event.waitUntil(
//     caches.keys().then((cacheNames) => {
//       return Promise.all(
//         cacheNames.map((cacheName) => {
//           if (cacheName !== CACHE_NAME) return caches.delete(cacheName);
//         })
//       );
//     })
//   );
//   self.clients.claim();
// });

// self.addEventListener('fetch', (event) => {
//   event.respondWith(
//     fetch(event.request)
//       .then((response) => {
//         if (response && response.status === 200) {
//           const responseToCache = response.clone();
//           caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
//         }
//         return response;
//       })
//       .catch(() => caches.match(event.request))
//   );
// });
