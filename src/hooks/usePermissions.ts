// src/hooks/usePermissions.ts
import { useCallback, useEffect, useState } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { isNative } from '../utils/platform';

// ============================================
// TYPES
// ============================================

export type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unsupported';

export interface PermissionState {
  status: PermissionStatus;
  lastRequested: number | null;
  requestCount: number;
  permanentlyDenied: boolean;
}

export interface MicrophonePermission extends PermissionState {
  request: () => Promise<boolean>;
  hasPermission: () => boolean;
}

export interface NotificationPermission extends PermissionState {
  request: (userId?: string) => Promise<boolean>;
  hasPermission: () => boolean;
  token: string | null;
  requestToken: (userId: string) => Promise<string | null>;
}

export interface UsePermissionsReturn {
  microphone: MicrophonePermission;
  notifications: NotificationPermission;
  checkAllPermissions: () => Promise<void>;
  requestAllPermissions: (userId?: string) => Promise<{ microphone: boolean; notifications: boolean }>;
  resetPermissionState: (permission: 'microphone' | 'notifications') => void;
}

// ============================================
// CONSTANTS
// ============================================

const STORAGE_KEY = 'clarity_permissions_state';
const MAX_REQUEST_ATTEMPTS = 3;
const COOLDOWN_PERIOD = 24 * 60 * 60 * 1000; // 24 horas

// ============================================
// UTILITY FUNCTIONS
// ============================================

const getStoredState = (): Record<string, PermissionState> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  };
};

const saveStoredState = (state: Record<string, PermissionState>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving permission state:', error);
  }
};

const checkMicrophonePermission = async (): Promise<PermissionStatus> => {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return 'unsupported';
  }

  try {
    // En algunos navegadores, necesitamos intentar acceder para verificar
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop());
    return 'granted';
  } catch (error: any) {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      return 'denied';
    }
    if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      return 'unsupported';
    }
    return 'prompt';
  }
};

const checkNotificationPermission = (): PermissionStatus => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  const permission = Notification.permission;
  if (permission === 'granted') return 'granted';
  if (permission === 'denied') return 'denied';
  return 'prompt';
};

const canRequestPermission = (state: PermissionState): boolean => {
  if (state.permanentlyDenied) return false;
  if (state.requestCount >= MAX_REQUEST_ATTEMPTS) {
    const timeSinceLastRequest = Date.now() - (state.lastRequested || 0);
    return timeSinceLastRequest > COOLDOWN_PERIOD;
  }
  return true;
};

// ============================================
// MAIN HOOK
// ============================================

export const usePermissions = (userId?: string): UsePermissionsReturn => {
  const [microphoneState, setMicrophoneState] = useState<PermissionState>(() => {
    const stored = getStoredState();
    return stored.microphone || {
      status: 'prompt',
      lastRequested: null,
      requestCount: 0,
      permanentlyDenied: false,
    };
  });

  const [notificationState, setNotificationState] = useState<PermissionState>(() => {
    const stored = getStoredState();
    return stored.notifications || {
      status: 'prompt',
      lastRequested: null,
      requestCount: 0,
      permanentlyDenied: false,
    };
  });

  const [notificationToken, setNotificationToken] = useState<string | null>(null);

  // Cargar estado inicial
  useEffect(() => {
    const checkPermissions = async () => {
      const micStatus = await checkMicrophonePermission();
      const notifStatus = checkNotificationPermission();

      setMicrophoneState(prev => ({ ...prev, status: micStatus }));
      setNotificationState(prev => ({ ...prev, status: notifStatus }));

      // Cargar token de notificaciones si está guardado
      if (userId && notifStatus === 'granted') {
        try {
          const userDoc = await getDoc(doc(db, 'users', userId));
          const fcmTokens = userDoc.data()?.fcmTokens || [];
          if (fcmTokens.length > 0) {
            setNotificationToken(fcmTokens[0]);
          }
        } catch (error) {
          console.error('Error loading notification token:', error);
        }
      }
    };

    checkPermissions();

    // Escuchar cambios de permisos
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'microphone' as PermissionName })
        .then(result => {
          result.onchange = async () => {
            const status = await checkMicrophonePermission();
            setMicrophoneState(prev => ({ ...prev, status }));
          };
        })
        .catch(() => {
          // No soportado en este navegador
        });
    }

    // Escuchar cambios de notificaciones
    if ('Notification' in window) {
      // Los cambios de permisos de notificaciones se detectan al intentar solicitar
    }
  }, [userId]);

  // Guardar estado en localStorage cuando cambie
  useEffect(() => {
    const stored = getStoredState();
    stored.microphone = microphoneState;
    stored.notifications = notificationState;
    saveStoredState(stored);
  }, [microphoneState, notificationState]);

  // ============================================
  // MICROPHONE PERMISSIONS
  // ============================================

  const requestMicrophone = useCallback(async (): Promise<boolean> => {
    if (!canRequestPermission(microphoneState)) {
      console.warn('Microphone permission request blocked: too many attempts or permanently denied');
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());

      const newState: PermissionState = {
        status: 'granted',
        lastRequested: Date.now(),
        requestCount: microphoneState.requestCount + 1,
        permanentlyDenied: false,
      };

      setMicrophoneState(newState);
      return true;
    } catch (error: any) {
      const isPermanentlyDenied = error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError';
      
      const newState: PermissionState = {
        status: isPermanentlyDenied ? 'denied' : 'prompt',
        lastRequested: Date.now(),
        requestCount: microphoneState.requestCount + 1,
        permanentlyDenied: isPermanentlyDenied && microphoneState.requestCount >= MAX_REQUEST_ATTEMPTS - 1,
      };

      setMicrophoneState(newState);
      return false;
    }
  }, [microphoneState]);

  // ============================================
  // NOTIFICATION PERMISSIONS
  // ============================================

  const requestNotification = useCallback(async (requestUserId?: string): Promise<boolean> => {
    if (!canRequestPermission(notificationState)) {
      console.warn('Notification permission request blocked: too many attempts or permanently denied');
      return false;
    }

    if (!('Notification' in window)) {
      setNotificationState(prev => ({
        ...prev,
        status: 'unsupported',
      }));
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';

      const newState: PermissionState = {
        status: permission as PermissionStatus,
        lastRequested: Date.now(),
        requestCount: notificationState.requestCount + 1,
        permanentlyDenied: permission === 'denied' && notificationState.requestCount >= MAX_REQUEST_ATTEMPTS - 1,
      };

      setNotificationState(newState);

      if (granted && requestUserId) {
        // Obtener token FCM
        await requestNotificationToken(requestUserId);
      }

      return granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [notificationState]);

  const requestNotificationToken = useCallback(async (requestUserId: string): Promise<string | null> => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return null;
    }

    try {
      // Importar dinámicamente para evitar errores si no está disponible
      const { getToken } = await import('firebase/messaging');
      const { messaging } = await import('../firebase');

      if (!messaging) {
        console.warn('Firebase Messaging no disponible');
        return null;
      }

      // Verificar que el Service Worker esté registrado
      if (!('serviceWorker' in navigator)) {
        console.warn('🔔 Service Worker no soportado');
        return null;
      }

      // Esperar a que el Service Worker esté listo
      const registration = await navigator.serviceWorker.ready;
      if (!registration) {
        console.warn('🔔 Service Worker no está listo');
        return null;
      }

      // Obtener VAPID key desde variables de entorno
      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
      
      if (!vapidKey) {
        console.warn('🔔 VAPID key no configurada. Las notificaciones push pueden no funcionar.');
        // Continuar sin VAPID key (puede funcionar en algunos casos)
      }
      
      // Intentar obtener token
      try {
        const token = await getToken(messaging, {
          vapidKey: vapidKey || undefined,
          serviceWorkerRegistration: registration,
        });

        if (token) {
          console.log('✅ Token FCM obtenido:', token.substring(0, 20) + '...');
          setNotificationToken(token);
          
          // Guardar token en Firestore
          const userDocRef = doc(db, 'users', requestUserId);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const existingTokens = userDoc.data()?.fcmTokens || [];
            // Evitar duplicados
            if (!existingTokens.includes(token)) {
              await updateDoc(userDocRef, {
                fcmTokens: [...existingTokens, token],
                updatedAt: new Date().toISOString(),
              });
            }
          } else {
            await setDoc(userDocRef, {
              fcmTokens: [token],
              updatedAt: new Date().toISOString(),
            });
          }

          return token;
        } else {
          console.warn('🔔 No se pudo obtener token FCM (token vacío)');
          return null;
        }
      } catch (tokenError: any) {
        console.error('❌ Error obteniendo token FCM:', tokenError);
        
        // Errores comunes y sus soluciones
        if (tokenError.code === 'messaging/registration-token-not-ready') {
          console.warn('🔔 Service Worker no está listo aún. Reintentando en 2 segundos...');
          // Reintentar después de un breve delay
          await new Promise(resolve => setTimeout(resolve, 2000));
          try {
            const registration = await navigator.serviceWorker.ready;
            const retryToken = await getToken(messaging, {
              vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || undefined,
              serviceWorkerRegistration: registration,
            });
            if (retryToken) {
              setNotificationToken(retryToken);
              return retryToken;
            }
          } catch (retryError) {
            console.error('❌ Error en reintento:', retryError);
          }
        } else if (tokenError.message?.includes('service worker') || 
                   tokenError.message?.includes('Service Worker')) {
          console.warn('🔔 Problema con Service Worker. Verifica que firebase-messaging-sw.js esté registrado.');
        } else if (tokenError.code === 'messaging/permission-blocked') {
          console.warn('🔔 Permisos de notificación bloqueados');
        } else if (tokenError.code === 'messaging/unsupported-browser') {
          console.warn('🔔 Navegador no soportado para notificaciones push');
        }
        
        return null;
      }

      return null;
    } catch (error: any) {
      console.error('❌ Error general al solicitar token de notificación:', error);
      return null;
    }
  }, []);

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  const checkAllPermissions = useCallback(async () => {
    const micStatus = await checkMicrophonePermission();
    const notifStatus = checkNotificationPermission();

    setMicrophoneState(prev => ({ ...prev, status: micStatus }));
    setNotificationState(prev => ({ ...prev, status: notifStatus }));
  }, []);

  const requestAllPermissions = useCallback(async (
    requestUserId?: string
  ): Promise<{ microphone: boolean; notifications: boolean }> => {
    const [micResult, notifResult] = await Promise.all([
      requestMicrophone(),
      requestNotification(requestUserId),
    ]);

    return {
      microphone: micResult,
      notifications: notifResult,
    };
  }, [requestMicrophone, requestNotification]);

  const resetPermissionState = useCallback((permission: 'microphone' | 'notifications') => {
    const newState: PermissionState = {
      status: 'prompt',
      lastRequested: null,
      requestCount: 0,
      permanentlyDenied: false,
    };

    if (permission === 'microphone') {
      setMicrophoneState(newState);
    } else {
      setNotificationState(newState);
      setNotificationToken(null);
    }
  }, []);

  // ============================================
  // RETURN
  // ============================================

  return {
    microphone: {
      ...microphoneState,
      request: requestMicrophone,
      hasPermission: () => microphoneState.status === 'granted',
    },
    notifications: {
      ...notificationState,
      request: requestNotification,
      hasPermission: () => notificationState.status === 'granted',
      token: notificationToken,
      requestToken: requestNotificationToken,
    },
    checkAllPermissions,
    requestAllPermissions,
    resetPermissionState,
  };
};

