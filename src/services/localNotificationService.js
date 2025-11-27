// src/services/localNotificationService.js
/**
 * Servicio de notificaciones locales programadas
 * Estas notificaciones SÍ se quedan en la bandeja de notificaciones en iOS
 */

/**
 * Solicita permisos para notificaciones locales
 */
export const requestLocalNotificationPermission = async () => {
  if (!("Notification" in window)) {
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission === "denied") {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === "granted";
};

/**
 * Programa un recordatorio diario para añadir gastos
 * Estas notificaciones SÍ se quedan en la bandeja de iOS
 */
export const scheduleDailyReminder = async (message = "No olvides registrar tus gastos de hoy") => {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return false;
  }

  // Cancelar recordatorios anteriores
  await cancelDailyReminders();

  // Programar para mañana a las 20:00 (8 PM)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(20, 0, 0, 0);

  // Si ya pasó la hora de hoy, programar para hoy
  const today = new Date();
  today.setHours(20, 0, 0, 0);
  const targetTime = today > new Date() ? today : tomorrow;

  // Programar notificaciones futuras
  scheduleRecurringNotification(message, targetTime, false, 1);
  
  return true;
};

/**
 * Programa un recordatorio semanal
 */
export const scheduleWeeklyReminder = async (dayOfWeek = 0, message = "¡No olvides registrar tus gastos de esta semana en Clarity!") => {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return false;
  }

  await cancelWeeklyReminders();

  // Calcular el próximo día de la semana (0 = domingo, 6 = sábado)
  const today = new Date();
  const currentDay = today.getDay();
  let daysUntilTarget = dayOfWeek - currentDay;

  if (daysUntilTarget <= 0) {
    daysUntilTarget += 7; // Próxima semana
  }

  const targetDate = new Date();
  targetDate.setDate(today.getDate() + daysUntilTarget);
  targetDate.setHours(10, 0, 0, 0); // 10 AM

  // Programar usando Service Worker
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Programar notificación recurrente
      scheduleRecurringNotification(message, targetDate, true, 7); // Cada 7 días
      
      return true;
    } catch (error) {
      console.error("Error programando recordatorio semanal:", error);
      return false;
    }
  }

  return false;
};

/**
 * Programa una notificación recurrente
 * IMPORTANTE: En iOS, estas notificaciones SÍ se quedan en la bandeja
 * porque usan requireInteraction: true y se crean desde el Service Worker
 */
const scheduleRecurringNotification = (message, targetTime, isRecurring = false, intervalDays = 1) => {
  const now = new Date();
  const timeUntilNotification = targetTime.getTime() - now.getTime();

  if (timeUntilNotification <= 0) {
    return;
  }

  setTimeout(async () => {
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.ready;
          
          // Usar requireInteraction: true para que se quede en la bandeja en iOS
          await registration.showNotification("📝 Clarity - Recordatorio", {
            body: message,
            icon: "/icon-192.png",
            badge: "/icon-192.png",
            tag: isRecurring ? "weekly-reminder" : "daily-reminder",
            // IMPORTANTE: requireInteraction: true hace que la notificación se quede en la bandeja
            requireInteraction: true,
            data: {
              type: isRecurring ? "weekly-reminder" : "daily-reminder",
              url: "/",
            },
            // Vibrar
            vibrate: [200, 100, 200],
            // No silenciar
            silent: false,
          });
        } else {
          // Fallback si no hay Service Worker
          new Notification("📝 Clarity - Recordatorio", {
            body: message,
            icon: "/icon-192.png",
            badge: "/icon-192.png",
            tag: isRecurring ? "weekly-reminder" : "daily-reminder",
            requireInteraction: true,
          });
        }

        // Si es recurrente, programar la siguiente
        if (isRecurring) {
          const nextDate = new Date(targetTime);
          nextDate.setDate(nextDate.getDate() + intervalDays);
          scheduleRecurringNotification(message, nextDate, true, intervalDays);
        } else {
          // Si es diario, programar para mañana
          const nextDay = new Date(targetTime);
          nextDay.setDate(nextDay.getDate() + 1);
          scheduleRecurringNotification(message, nextDay, false, 1);
        }
      } catch (error) {
        console.error("Error mostrando notificación programada:", error);
      }
    }
  }, timeUntilNotification);
};

/**
 * Cancela todos los recordatorios diarios
 */
export const cancelDailyReminders = async () => {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      // Las notificaciones con el mismo tag se reemplazan
      // Para cancelar completamente, necesitaríamos guardar los timeouts
      // Por ahora, simplemente no programamos nuevas
    } catch (error) {
      console.error("Error cancelando recordatorios diarios:", error);
    }
  }
};

/**
 * Cancela todos los recordatorios semanales
 */
export const cancelWeeklyReminders = async () => {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      // Similar a cancelDailyReminders
    } catch (error) {
      console.error("Error cancelando recordatorios semanales:", error);
    }
  }
};

/**
 * Programa un recordatorio personalizado
 */
export const scheduleCustomReminder = async (date, message) => {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return false;
  }

  const targetTime = new Date(date);
  const now = new Date();
  const timeUntilNotification = targetTime.getTime() - now.getTime();

  if (timeUntilNotification <= 0) {
    return false;
  }

  setTimeout(async () => {
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        await registration.showNotification("📝 Clarity", {
          body: message,
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          tag: `custom-reminder-${date}`,
          requireInteraction: false,
          data: {
            type: "custom-reminder",
            url: "/",
          },
        });
      } catch (error) {
        console.error("Error mostrando recordatorio personalizado:", error);
      }
    }
  }, timeUntilNotification);

  return true;
};

/**
 * Programa una notificación de prueba para X minutos desde ahora
 * Útil para probar notificaciones sin esperar a la hora programada
 */
export const scheduleTestNotification = async (minutes, message = "Notificación de prueba") => {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    console.warn("Permisos de notificación no concedidos");
    return false;
  }

  if (minutes <= 0 || minutes > 60) {
    console.warn("Los minutos deben estar entre 1 y 60");
    return false;
  }

  const now = new Date();
  const targetTime = new Date(now.getTime() + minutes * 60 * 1000);

  console.log(`Programando notificación de prueba para ${minutes} minutos (${targetTime.toLocaleTimeString()})`);

  setTimeout(async () => {
    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        
        await registration.showNotification("📝 Clarity - Prueba", {
          body: message,
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          tag: `test-notification-${Date.now()}`,
          requireInteraction: true, // Para que se quede en la bandeja en iOS
          data: {
            url: "/",
            type: "test-reminder",
            persistent: "true",
          },
          vibrate: [200, 100, 200],
          silent: false,
        });
        
        console.log("✅ Notificación de prueba enviada");
      } else {
        // Fallback si no hay Service Worker
        new Notification("📝 Clarity - Prueba", {
          body: message,
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          tag: `test-notification-${Date.now()}`,
          requireInteraction: true,
        });
      }
    } catch (error) {
      console.error("Error mostrando notificación de prueba:", error);
    }
  }, minutes * 60 * 1000);

  return true;
};

/**
 * Muestra una notificación inmediata (para pruebas)
 * Si options.persistent es true, se quedará en la bandeja de iOS
 */
export const showLocalNotification = async (title, message, options = {}) => {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return false;
  }

  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      
      await registration.showNotification(title || "📝 Clarity", {
        body: message,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: options.tag || "local-notification",
        // Para recordatorios, usar requireInteraction: true para que se quede en la bandeja
        requireInteraction: options.persistent || options.isReminder || false,
        data: {
          url: options.url || "/",
          type: options.isReminder ? "reminder" : "notification",
          ...options.data,
        },
        vibrate: [200, 100, 200],
        silent: false,
      });
    } else {
      // Fallback si no hay Service Worker
      new Notification(title || "📝 Clarity", {
        body: message,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: options.tag || "local-notification",
        requireInteraction: options.persistent || options.isReminder || false,
      });
    }

    return true;
  } catch (error) {
    console.error("Error mostrando notificación local:", error);
    return false;
  }
};

