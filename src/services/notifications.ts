import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

// IDs fijos para cada tipo de notificación (permiten cancelar/actualizar)
const NOTIFICATION_IDS = {
  DAILY_REMINDER: 1001,
  WEEKLY_REMINDER: 1002,
  MONTHLY_INCOME_REMINDER: 1003,
};

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
 * Esta notificación se dispara incluso con la app cerrada
 * @param hour Hora del día (0-23)
 * @param minute Minuto (0-59)
 * @param message Mensaje personalizado
 */
export const scheduleDailyReminder = async (
  hour: number = 20,
  minute: number = 0,
  message: string = '¿Has gastado algo hoy? Registra tus gastos para mantener tu presupuesto al día'
): Promise<void> => {
  if (!Capacitor.isNativePlatform()) {
    console.log('Notificaciones locales solo disponibles en plataformas nativas');
    return;
  }

  try {
    // Cancelar recordatorio anterior si existe
    await LocalNotifications.cancel({
      notifications: [{ id: NOTIFICATION_IDS.DAILY_REMINDER }],
    });

    await LocalNotifications.schedule({
      notifications: [
        {
          title: '💸 Recordatorio diario',
          body: message,
          id: NOTIFICATION_IDS.DAILY_REMINDER,
          schedule: {
            on: {
              hour,
              minute,
            },
            repeats: true,
            allowWhileIdle: true, // ✅ Funciona incluso en modo ahorro de batería
          },
          sound: 'default',
          smallIcon: 'ic_stat_icon', // Icono pequeño para Android
          largeIcon: 'ic_launcher', // Icono grande para Android
        },
      ],
    });
    console.log(`✅ Recordatorio diario programado para las ${hour}:${minute.toString().padStart(2, '0')}`);
  } catch (error) {
    console.error('Error scheduling daily reminder:', error);
  }
};

/**
 * Programa un recordatorio semanal
 * @param dayOfWeek Día de la semana (0=Domingo, 1=Lunes, ..., 6=Sábado)
 * @param hour Hora del día (0-23)
 * @param minute Minuto (0-59)
 * @param message Mensaje personalizado
 */
export const scheduleWeeklyReminder = async (
  dayOfWeek: number = 0, // Domingo por defecto
  hour: number = 21,
  minute: number = 0,
  message: string = '¡No olvides registrar tus gastos de esta semana en Clarity!'
): Promise<void> => {
  if (!Capacitor.isNativePlatform()) {
    console.log('Notificaciones locales solo disponibles en plataformas nativas');
    return;
  }

  try {
    // Cancelar recordatorio anterior si existe
    await LocalNotifications.cancel({
      notifications: [{ id: NOTIFICATION_IDS.WEEKLY_REMINDER }],
    });

    // Capacitor usa 1=Domingo, 2=Lunes, etc. (diferente a JS que usa 0=Domingo)
    const capacitorDayOfWeek = dayOfWeek + 1;

    await LocalNotifications.schedule({
      notifications: [
        {
          title: '📊 Resumen semanal',
          body: message,
          id: NOTIFICATION_IDS.WEEKLY_REMINDER,
          schedule: {
            on: {
              weekday: capacitorDayOfWeek,
              hour,
              minute,
            },
            repeats: true,
            allowWhileIdle: true,
          },
          sound: 'default',
        },
      ],
    });

    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    console.log(`✅ Recordatorio semanal programado para ${days[dayOfWeek]} a las ${hour}:${minute.toString().padStart(2, '0')}`);
  } catch (error) {
    console.error('Error scheduling weekly reminder:', error);
  }
};

/**
 * Programa una notificación específica (una sola vez)
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
            allowWhileIdle: true,
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
 * Cancela el recordatorio diario
 */
export const cancelDailyReminder = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await LocalNotifications.cancel({
      notifications: [{ id: NOTIFICATION_IDS.DAILY_REMINDER }],
    });
    console.log('❌ Recordatorio diario cancelado');
  } catch (error) {
    console.error('Error canceling daily reminder:', error);
  }
};

/**
 * Cancela el recordatorio semanal
 */
export const cancelWeeklyReminder = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await LocalNotifications.cancel({
      notifications: [{ id: NOTIFICATION_IDS.WEEKLY_REMINDER }],
    });
    console.log('❌ Recordatorio semanal cancelado');
  } catch (error) {
    console.error('Error canceling weekly reminder:', error);
  }
};

/**
 * Cancela todas las notificaciones programadas
 */
export const cancelAllNotifications = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({
        notifications: pending.notifications.map(n => ({ id: n.id })),
      });
    }
    console.log('❌ Todas las notificaciones canceladas');
  } catch (error) {
    console.error('Error canceling all notifications:', error);
  }
};

/**
 * Obtiene todas las notificaciones pendientes (útil para debug)
 */
export const getPendingNotifications = async () => {
  if (!Capacitor.isNativePlatform()) return [];

  try {
    const pending = await LocalNotifications.getPending();
    console.log('📋 Notificaciones pendientes:', pending.notifications);
    return pending.notifications;
  } catch (error) {
    console.error('Error getting pending notifications:', error);
    return [];
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

// =========================================
// LEGACY FUNCTION (para compatibilidad)
// =========================================
export const scheduleExpenseReminder = scheduleDailyReminder;
