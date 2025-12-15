// src/services/pushNotificationService.js
import { messaging } from "../firebase";
import { getToken, onMessage } from "firebase/messaging";
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
        }
        
        // Esperar a que esté activo
        await navigator.serviceWorker.ready;
      } catch (error) {
        console.error("Error registrando service worker:", error);
        return null;
      }
    }

    // Obtener token FCM
    if (!VAPID_KEY) {
      console.warn("⚠️ VAPID key no configurada. Ve a Firebase Console > Cloud Messaging > Web Push certificates");
      return null;
    }

    // Esperar a que el Service Worker esté completamente listo
    const serviceWorkerRegistration = await navigator.serviceWorker.ready;
    
    // Verificar que el Service Worker esté activo
    if (!serviceWorkerRegistration.active) {
      console.warn("⚠️ Service Worker no está activo. Intentando activarlo...");
      await serviceWorkerRegistration.update();
    }
    
    // Obtener el token FCM
    const currentToken = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: serviceWorkerRegistration,
    });

    if (currentToken) {
      // Guardar token en Firestore
      if (userId) {
        try {
          await saveFCMToken(userId, currentToken);
        } catch (error) {
          console.error("❌ Error guardando token FCM:", error);
        }
      } else {
        console.warn("⚠️ No hay userId, no se puede guardar el token");
      }
      
      return currentToken;
    } else {
      console.warn("⚠️ No se pudo obtener el token FCM. Verifica que el Service Worker esté activo y que tengas permisos de notificación.");
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
    if (!token || typeof token !== "string" || token.trim().length === 0) {
      console.error("❌ Token FCM inválido:", token);
      throw new Error("Token FCM inválido");
    }
    
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const tokens = userDoc.data().fcmTokens || [];
      
      // SIEMPRE reemplazar todos los tokens anteriores con solo el nuevo token
      // Esto asegura que solo haya 1 token activo y elimina duplicados existentes
      const updatedTokens = [token];
      
      await updateDoc(userDocRef, {
        fcmTokens: updatedTokens,
        updatedAt: new Date().toISOString(),
      });
      
      // Verificar que se guardó correctamente
      // Verificación adicional no necesaria en producción; Firestore garantiza consistencia básica
    } else {
      console.warn(`⚠️ Usuario ${userId} no existe en Firestore`);
    }
  } catch (error) {
    console.error("❌ Error guardando token FCM:", error);
    throw error;
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
    console.warn("⚠️ Firebase Messaging no está disponible para configurar listener");
    return null;
  }

  const unsubscribe = onMessage(messaging, (payload) => {
    if (callback) {
      try {
        callback(payload);
      } catch (error) {
        console.error("❌ Error ejecutando callback:", error);
      }
    } else {
      console.warn("⚠️ No hay callback configurado para mostrar notificación interna");
    }
    
  });
  return unsubscribe;
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

