// public/firebase-messaging-sw.js
// Service Worker para Firebase Cloud Messaging

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyCFhaSfL2VGvSA0PtSCRISB7l_e9ig1kSI",
  authDomain: "clarity-gastos.firebaseapp.com",
  projectId: "clarity-gastos",
  storageBucket: "clarity-gastos.firebasestorage.app",
  messagingSenderId: "318846020421",
  appId: "1:318846020421:web:d55aadfbe492db8d29ec2c",
  measurementId: "G-WWTL6X7SV1",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Retrieve firebase messaging
const messaging = firebase.messaging();

// Log cuando el Service Worker se activa
self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker activado');
  event.waitUntil(self.clients.claim());
});

// Log cuando el Service Worker se instala
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker instalado');
  self.skipWaiting(); // Activar inmediatamente
});

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] ========== MENSAJE RECIBIDO EN BACKGROUND ==========');
  console.log('[firebase-messaging-sw.js] Payload:', payload);
  
  const notificationTitle = payload.notification?.title || payload.data?.title || 'Clarity';
  const notificationBody = payload.notification?.body || payload.data?.body || payload.data?.message || 'Tienes una nueva notificación';
  
  console.log('[firebase-messaging-sw.js] Título:', notificationTitle);
  console.log('[firebase-messaging-sw.js] Mensaje:', notificationBody);
  
  // Determinar si es un recordatorio (debe quedarse en la bandeja)
  const isReminder = payload.data?.type === 'reminder' || payload.data?.type === 'daily-reminder' || payload.data?.type === 'weekly-reminder';
  
  const notificationOptions = {
    body: notificationBody,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: payload.data?.tag || 'clarity-notification',
    // Para recordatorios, intentar que se quede en la bandeja
    // En iOS, esto hará que la notificación se quede en la bandeja de notificaciones
    requireInteraction: isReminder || payload.data?.persistent === 'true',
    // Vibrar si está disponible
    vibrate: [200, 100, 200],
    // Sonido personalizado si está disponible
    sound: payload.data?.sound || undefined,
    data: {
      url: payload.data?.url || '/',
      ...payload.data,
    },
  };

  console.log('[firebase-messaging-sw.js] Mostrando notificación con opciones:', notificationOptions);

  return self.registration.showNotification(notificationTitle, notificationOptions)
    .then(() => {
      console.log('[firebase-messaging-sw.js] ✅ Notificación mostrada correctamente');
    })
    .catch((error) => {
      console.error('[firebase-messaging-sw.js] ❌ Error mostrando notificación:', error);
    });
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.');
  
  event.notification.close();

  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});




