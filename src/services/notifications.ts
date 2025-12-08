import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

/**
 * Solicita permisos para notificaciones locales
 * @returns true si los permisos fueron concedidos
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) {
    // En web, usar la API de notificaciones del navegador
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  try {
    const result = await LocalNotifications.requestPermissions();
    return result.display === 'granted';
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

/**
 * Programa un recordatorio diario de gastos
 * @param hour Hora del día (0-23)
 */
export const scheduleExpenseReminder = async (hour: number = 20): Promise<void> => {
  if (!Capacitor.isNativePlatform()) {
    console.log('Notificaciones locales solo disponibles en plataformas nativas');
    return;
  }

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          title: '💸 ¿Has gastado algo hoy?',
          body: 'Registra tus gastos para mantener tu presupuesto al día',
          id: 1,
          schedule: {
            hour,
            minute: 0,
            repeats: true,
          },
          sound: 'default',
        },
      ],
    });
  } catch (error) {
    console.error('Error scheduling expense reminder:', error);
  }
};

/**
 * Programa una notificación específica
 */
export const scheduleNotification = async (
  title: string,
  body: string,
  date: Date,
  id: number = Date.now()
): Promise<void> => {
  if (!Capacitor.isNativePlatform()) {
    console.log('Notificaciones locales solo disponibles en plataformas nativas');
    return;
  }

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body,
          id,
          schedule: {
            at: date,
          },
          sound: 'default',
        },
      ],
    });
  } catch (error) {
    console.error('Error scheduling notification:', error);
  }
};

/**
 * Cancela todas las notificaciones programadas
 */
export const cancelAllNotifications = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    await LocalNotifications.cancel({
      notifications: [{ id: 1 }], // Cancelar el recordatorio diario
    });
  } catch (error) {
    console.error('Error canceling notifications:', error);
  }
};

/**
 * Verifica si las notificaciones están habilitadas
 */
export const areNotificationsEnabled = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) {
    if ('Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  }

  try {
    const result = await LocalNotifications.checkPermissions();
    return result.display === 'granted';
  } catch (error) {
    console.error('Error checking notification permissions:', error);
    return false;
  }
};

