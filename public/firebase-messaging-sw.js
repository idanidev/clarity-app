importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyB_TputkxE2423A5KsCoKoCe9O5NUT-m6U",
  authDomain: "clarity-gastos.firebaseapp.com",
  projectId: "clarity-gastos",
  storageBucket: "clarity-gastos.firebasestorage.app",
  messagingSenderId: "318846020421",
  appId: "1:318846020421:web:14ff48a4c9c04267a9db57"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

const CACHE_NAME = 'clarity-v2.2.0'; // Incrementar versión para forzar actualización
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  // Forzar actualización inmediata
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch((err) => {
        console.warn('[SW] Error caching initial files:', err);
      });
    })
  );
});

// Activar Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Solo cachear assets estáticos, NO interferir con Firestore
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // NO cachear requests de chrome-extension u otros esquemas no soportados
  if (url.protocol === 'chrome-extension:' || 
      url.protocol === 'chrome:' ||
      url.protocol === 'moz-extension:') {
    return; // Ignorar completamente
  }
  
  // NO cachear llamadas a Firebase/Firestore (dejar que Firestore maneje su cache)
  if (url.hostname.includes('firebaseio.com') || 
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('firestore.googleapis.com') ||
      url.hostname.includes('firebaseapp.com')) {
    return; // Dejar pasar sin cachear
  }
  
  // NO cachear archivos JS/TS en desarrollo (siempre usar la versión más reciente)
  if (url.pathname.endsWith('.js') || 
      url.pathname.endsWith('.ts') || 
      url.pathname.endsWith('.jsx') || 
      url.pathname.endsWith('.tsx') ||
      url.pathname.includes('/src/') ||
      url.pathname.includes('?v=') || // Archivos con versioning de Vite
      url.pathname.includes('&v=')) {
    // Network-only para archivos JS/TS
    event.respondWith(fetch(event.request));
    return;
  }
  
  // NO cachear el HTML principal para evitar problemas en iOS PWA
  if (event.request.method === 'GET' && 
      (event.request.url.endsWith('/') || 
       event.request.url.endsWith('/index.html') ||
       event.request.destination === 'document')) {
    // Para el HTML, usar network-first para evitar pantallas en blanco
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Solo cachear si la respuesta es exitosa
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache).catch(() => {
                // Ignorar errores de cache
              });
            });
          }
          return response;
        })
        .catch(() => {
          // Si falla la red, intentar desde cache
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Para otros assets estáticos, usar cache-first
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).then((response) => {
        // Solo cachear respuestas exitosas y válidas
        if (response && response.status === 200 && response.type !== 'error') {
          // Verificar que el request sea cacheable
          const url = new URL(event.request.url);
          if (url.protocol === 'http:' || url.protocol === 'https:') {
            try {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache).catch((err) => {
                  console.warn('[SW] Error caching request:', err);
                });
              });
            } catch (err) {
              console.warn('[SW] Error cloning response:', err);
            }
          }
        }
        return response;
      });
    })
  );
});

// Manejar notificaciones push en background
messaging.onBackgroundMessage((payload) => {
  console.log('[Service Worker] Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'Clarity';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.message || 'Tienes una nueva notificación',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: payload.data,
    tag: payload.data?.type || 'default',
    requireInteraction: false,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Click en notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
