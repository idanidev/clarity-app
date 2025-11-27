// src/services/pushNotificationService.js
import { messaging, getMessagingToken, onMessagingMessage } from "../firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Servicio de notificaciones push para PWA
 * Gestiona permisos, tokens y mensajes de FCM
 */

// La clave VAPID se debe obtener desde Firebase Console:
// Firebase Console > Project Settings > Cloud Messaging > Web Push certificates > Generate key pair
// Por ahora dejamos null y se pedirá cuando se inicialice
let VAPID_KEY = null;

// Función para configurar la clave VAPID (se debe llamar desde Dashboard)
export const setVAPIDKey = (key) => {
  VAPID_KEY = key;
};

/**
 * Solicita permisos de notificaciones y obtiene el token FCM
 */
export const requestNotificationPermission = async (userId) => {
  if (!messaging) {
    console.warn("Firebase Messaging no está disponible");
    return null;
  }

  try {
    // Solicitar permisos
    const permission = await Notification.requestPermission();
    
    if (permission !== "granted") {
      console.log("Permiso de notificaciones denegado");
      return null;
    }

    // Asegurar que el Service Worker esté registrado y activo
    if ("serviceWorker" in navigator) {
      try {
        // Intentar obtener el registro existente primero
        let registration = await navigator.serviceWorker.getRegistration();
        
        // Si no existe, registrarlo
        if (!registration) {
          registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
          console.log("Service Worker registrado:", registration.scope);
        } else {
          console.log("Service Worker ya registrado:", registration.scope);
        }
        
        // Esperar a que esté activo
        await navigator.serviceWorker.ready;
        console.log("Service Worker activo y listo");
      } catch (error) {
        console.error("Error registrando service worker:", error);
        return null;
      }
    }

    // Obtener token FCM
    if (!VAPID_KEY) {
      console.warn("VAPID key no configurada. Ve a Firebase Console > Cloud Messaging > Web Push certificates");
      return null;
    }

    // Esperar a que el Service Worker esté completamente listo
    const serviceWorkerRegistration = await navigator.serviceWorker.ready;
    
    // Obtener el token FCM
    const currentToken = await getMessagingToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: serviceWorkerRegistration,
    });

    if (currentToken) {
      console.log("Token FCM obtenido:", currentToken);
      
      // Guardar token en Firestore
      if (userId) {
        await saveFCMToken(userId, currentToken);
      }
      
      return currentToken;
    } else {
      console.log("No se pudo obtener el token FCM");
      return null;
    }
  } catch (error) {
    console.error("Error solicitando permisos de notificaciones:", error);
    return null;
  }
};

/**
 * Guarda el token FCM del usuario en Firestore
 */
export const saveFCMToken = async (userId, token) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const tokens = userDoc.data().fcmTokens || [];
      
      // Solo añadir si no existe ya
      if (!tokens.includes(token)) {
        await updateDoc(userDocRef, {
          fcmTokens: [...tokens, token],
          updatedAt: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    console.error("Error guardando token FCM:", error);
  }
};

/**
 * Elimina un token FCM de Firestore
 */
export const removeFCMToken = async (userId, token) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const tokens = userDoc.data().fcmTokens || [];
      const updatedTokens = tokens.filter((t) => t !== token);
      
      await updateDoc(userDocRef, {
        fcmTokens: updatedTokens,
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Error eliminando token FCM:", error);
  }
};

/**
 * Configura el listener para mensajes cuando la app está en primer plano
 */
export const setupForegroundMessageListener = (callback) => {
  if (!messaging) {
    return null;
  }

  return onMessagingMessage(messaging, (payload) => {
    console.log("Mensaje recibido en primer plano:", payload);
    
    if (callback) {
      callback(payload);
    }
    
    // Mostrar notificación manual si el usuario no la bloqueó
    // En iOS, estas notificaciones aparecerán como banners (tiras)
    // No se pueden hacer persistentes desde el código web
    if (Notification.permission === "granted") {
      const notificationTitle = payload.notification?.title || "Clarity";
      const notificationOptions = {
        body: payload.notification?.body || payload.data?.message || "Tienes una nueva notificación",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: payload.data?.tag || "clarity-notification",
        // requireInteraction no funciona en iOS, pero lo dejamos para otros navegadores
        requireInteraction: payload.data?.persistent === 'true' || false,
        // Datos adicionales
        data: {
          ...payload.data,
          url: payload.data?.url || '/',
        },
        // Vibrar si está disponible (no funciona en iOS)
        vibrate: [200, 100, 200],
      };
      
      const notification = new Notification(notificationTitle, notificationOptions);
      
      // Manejar clic en la notificación
      notification.onclick = (event) => {
        event.preventDefault();
        const url = payload.data?.url || '/';
        window.focus();
        window.location.href = url;
        notification.close();
      };
    }
  });
};

/**
 * Verifica si las notificaciones están habilitadas
 */
export const areNotificationsEnabled = () => {
  return "Notification" in window && Notification.permission === "granted";
};

/**
 * Verifica el estado actual de los permisos
 */
export const getNotificationPermission = () => {
  if (!("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission; // "default" | "granted" | "denied"
};

/**
 * Muestra una notificación de prueba
 */
export const showTestNotification = () => {
  if (!("Notification" in window)) {
    throw new Error("Tu navegador no soporta notificaciones");
  }

  if (Notification.permission !== "granted") {
    throw new Error("Los permisos de notificaciones no están concedidos");
  }

  const notification = new Notification("🔔 Clarity - Notificación de Prueba", {
    body: "¡Hola! Esta es una notificación push de prueba. Si ves esto, las notificaciones están funcionando correctamente 🎉",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: "clarity-test-notification",
    requireInteraction: false,
  });

  // Cerrar automáticamente después de 5 segundos
  setTimeout(() => {
    notification.close();
  }, 5000);

  return notification;
};

