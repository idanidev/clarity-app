import { useState, useCallback, useRef, useEffect } from 'react';
import type { Notification, NotificationType } from '../types/dashboard';

/**
 * Hook personalizado para manejar notificaciones
 * - Auto-cierre después de 3 segundos
 * - Ref para evitar dependencias en efectos
 * - Limpieza automática
 */
export const useNotifications = () => {
  const [notification, setNotification] = useState<Notification | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showNotification = useCallback((message: string, type: NotificationType = 'success') => {
    // Limpiar timeout anterior si existe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Mostrar nueva notificación
    setNotification({ message, type });

    // Auto-cierre después de 3 segundos
    timeoutRef.current = setTimeout(() => {
      setNotification(null);
      timeoutRef.current = null;
    }, 3000);
  }, []);

  const hideNotification = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setNotification(null);
  }, []);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Ref para usar en efectos sin dependencias
  const showNotificationRef = useRef(showNotification);
  useEffect(() => {
    showNotificationRef.current = showNotification;
  }, [showNotification]);

  return {
    notification,
    showNotification,
    hideNotification,
    showNotificationRef, // Para usar en efectos
  };
};

