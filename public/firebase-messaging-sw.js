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
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  console.log('[firebase-messaging-sw.js] App está cerrada o en background');
  console.log('[firebase-messaging-sw.js] Payload completo:', JSON.stringify(payload, null, 2));
  console.log('[firebase-messaging-sw.js] Título:', payload.notification?.title);
  console.log('[firebase-messaging-sw.js] Mensaje:', payload.notification?.body || payload.data?.message);
  console.log('[firebase-messaging-sw.js] Tipo:', payload.data?.type);
  
  const notificationTitle = payload.notification?.title || 'Clarity';
  
  // Determinar si es un recordatorio (debe quedarse en la bandeja)
  const isReminder = payload.data?.type === 'reminder' || payload.data?.type === 'daily-reminder' || payload.data?.type === 'weekly-reminder';
  
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.message || 'Tienes una nueva notificación',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: payload.data?.tag || 'clarity-notification',
    // Para recordatorios y notificaciones de prueba, intentar que se quede en la bandeja
    // En iOS, requireInteraction: true hace que la notificación se quede en la bandeja
    requireInteraction: isReminder || payload.data?.persistent === 'true' || payload.data?.type === 'test',
    // Vibrar si está disponible
    vibrate: [200, 100, 200],
    // Sonido personalizado si está disponible
    sound: payload.data?.sound || 'default',
    // Datos adicionales para cuando se toque la notificación
    data: {
      ...payload.data,
      url: payload.data?.url || '/',
      timestamp: Date.now(),
      type: payload.data?.type || 'notification',
    },
    // Acciones (no soportadas en iOS, pero útil para Android)
    actions: payload.data?.actions ? JSON.parse(payload.data.actions) : undefined,
    // Timestamp
    timestamp: Date.now(),
    // Renovar la notificación si ya existe
    renotify: true,
    // Para iOS: usar silent: false para asegurar que se muestre
    silent: false,
    // Para iOS: asegurar que la notificación se muestre incluso cuando la app está cerrada
    dir: 'ltr',
    lang: 'es',
  };

  console.log('[firebase-messaging-sw.js] Mostrando notificación:', notificationTitle, notificationOptions);

  // Mostrar la notificación
  // En iOS, las notificaciones con requireInteraction: true se quedan en la bandeja
  return self.registration.showNotification(notificationTitle, notificationOptions)
    .then(() => {
      console.log('[firebase-messaging-sw.js] Notificación mostrada correctamente');
    })
    .catch((error) => {
      console.error('[firebase-messaging-sw.js] Error mostrando notificación:', error);
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




