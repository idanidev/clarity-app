// src/services/pushNotificationService.ts
import { messaging } from "../firebase";
import { getToken, onMessage, type MessagePayload } from "firebase/messaging";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Servicio de notificaciones push para PWA
 * Gestiona permisos, tokens y mensajes de FCM
 */

// ==================== TIPOS ====================

export type NotificationPermissionStatus = 'default' | 'granted' | 'denied' | 'unsupported';

export interface FCMPayload extends MessagePayload {
  notification?: {
    title?: string;
    body?: string;
    icon?: string;
    badge?: string;
    tag?: string;
  };
  data?: Record<string, string>;
}

// ==================== VAPID KEY ====================

// La clave VAPID se debe obtener desde Firebase Console:
// Firebase Console > Project Settings > Cloud Messaging > Web Push certificates > Generate key pair
let VAPID_KEY: string | null = null;

/**
 * Función para configurar la clave VAPID (se debe llamar desde Dashboard)
 */
export const setVAPIDKey = (key: string): void => {
  VAPID_KEY = key;
};

// ==================== SOLICITAR PERMISOS ====================

/**
 * Solicita permisos de notificaciones y obtiene el token FCM
 */
export const requestNotificationPermission = async (userId: string | null): Promise<string | null> => {
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

// ==================== GUARDAR TOKEN FCM ====================

/**
 * Guarda el token FCM del usuario en Firestore
 */
export const saveFCMToken = async (userId: string, token: string): Promise<void> => {
  try {
    if (!token || typeof token !== "string" || token.trim().length === 0) {
      console.error("❌ Token FCM inválido:", token);
      throw new Error("Token FCM inválido");
    }
    
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      // SIEMPRE reemplazar todos los tokens anteriores con solo el nuevo token
      // Esto asegura que solo haya 1 token activo y elimina duplicados existentes
      const updatedTokens = [token];
      
      await updateDoc(userDocRef, {
        fcmTokens: updatedTokens,
        updatedAt: new Date().toISOString(),
      });
    } else {
      console.warn(`⚠️ Usuario ${userId} no existe en Firestore`);
    }
  } catch (error) {
    console.error("❌ Error guardando token FCM:", error);
    throw error;
  }
};

// ==================== ELIMINAR TOKEN FCM ====================

/**
 * Elimina un token FCM de Firestore
 */
export const removeFCMToken = async (userId: string, token: string): Promise<void> => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      const tokens: string[] = data.fcmTokens || [];
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

// ==================== LISTENER DE MENSAJES ====================

/**
 * Configura el listener para mensajes cuando la app está en primer plano
 */
export const setupForegroundMessageListener = (
  callback: (payload: FCMPayload) => void
): (() => void) | null => {
  if (!messaging) {
    console.warn("⚠️ Firebase Messaging no está disponible para configurar listener");
    return null;
  }

  const unsubscribe = onMessage(messaging, (payload) => {
    if (callback) {
      try {
        callback(payload as FCMPayload);
      } catch (error) {
        console.error("❌ Error ejecutando callback:", error);
      }
    } else {
      console.warn("⚠️ No hay callback configurado para mostrar notificación interna");
    }
  });
  
  return unsubscribe;
};

// ==================== ESTADO DE PERMISOS ====================

/**
 * Verifica si las notificaciones están habilitadas
 */
export const areNotificationsEnabled = (): boolean => {
  return "Notification" in window && Notification.permission === "granted";
};

/**
 * Verifica el estado actual de los permisos
 */
export const getNotificationPermission = (): NotificationPermissionStatus => {
  if (!("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission as NotificationPermissionStatus;
};

// ==================== NOTIFICACIÓN DE PRUEBA ====================

/**
 * Muestra una notificación de prueba
 */
export const showTestNotification = (): Notification => {
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

