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
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'Clarity';
  const notificationBody = payload.notification?.body || payload.data?.message || 'Tienes una nueva notificación';
  
  const notificationOptions = {
    body: notificationBody,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: {
      url: payload.data?.url || '/',
    },
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
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




