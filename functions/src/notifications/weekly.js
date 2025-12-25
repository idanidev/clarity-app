/* eslint-disable max-len */
/**
 * Cloud Function que envía recordatorios semanales
 * Se ejecuta cada 5 minutos durante horas activas (8:00-22:00)
 * Verifica si es el día y hora configurados por cada usuario
 */

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");
const { sendNotification } = require("../utils/fcm");

const db = getFirestore();

exports.sendWeeklyReminders = onSchedule(
  {
    schedule: "*/5 8-22 * * *", // Cada 5 minutos, solo entre las 8:00 y 22:59
    timeZone: "Europe/Madrid",
    memory: "256MiB",
    timeoutSeconds: 300,
    invoker: "public",
  },
  async (event) => {
    logger.info("🔔 Iniciando envío de recordatorios semanales...");

    try {
      const now = new Date();
      const madridFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Europe/Madrid",
        hour: "numeric",
        minute: "numeric",
        hour12: false,
        weekday: "long",
      });

      const madridParts = madridFormatter.formatToParts(now);
      const currentHour = parseInt(
        madridParts.find((p) => p.type === "hour")?.value || "0",
        10
      );
      const currentMinute = parseInt(
        madridParts.find((p) => p.type === "minute")?.value || "0",
        10
      );
      const weekday = madridParts.find((p) => p.type === "weekday")?.value || "";

      const weekdayMap = {
        Sunday: 0,
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6,
      };
      const currentDayOfWeek = weekdayMap[weekday] ?? now.getDay();

      logger.info(
        `📅 Día: ${currentDayOfWeek} (0=Domingo), Hora Madrid: ` +
        `${currentHour}:${String(currentMinute).padStart(2, "0")} ` +
        `(UTC: ${now.getUTCHours()}:${String(now.getUTCMinutes()).padStart(2, "0")})`
      );

      const usersSnapshot = await db.collection("users").get();
      let remindersSent = 0;
      let remindersSkipped = 0;

      logger.info(`👥 Procesando ${usersSnapshot.size} usuarios...`);

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();

        const notificationSettings = userData.notificationSettings;

        if (!notificationSettings?.weeklyReminder?.enabled) {
          remindersSkipped++;
          continue;
        }

        const configuredDay = notificationSettings.weeklyReminder?.dayOfWeek ?? 0;
        const configuredHour = notificationSettings.weeklyReminder?.hour ?? 21;
        const configuredMinute = notificationSettings.weeklyReminder?.minute ?? 0;

        const dayMatch = Number(currentDayOfWeek) === Number(configuredDay);
        const hourMatch = Number(currentHour) === Number(configuredHour);
        const configuredMinuteNum = Number(configuredMinute);
        const currentMinuteNum = Number(currentMinute);
        const minuteDiff = Math.abs(currentMinuteNum - configuredMinuteNum);
        const minuteMatch = hourMatch && minuteDiff <= 2;

        if (!dayMatch || !hourMatch || !minuteMatch) {
          continue;
        }

        const lastReminderSent = userData.lastWeeklyReminderSent;
        const lastReminderHour = userData.lastWeeklyReminderHour;
        const lastReminderMinute = userData.lastWeeklyReminderMinute;
        const today = new Date().toISOString().split("T")[0];

        const sameTime =
          lastReminderHour !== undefined &&
          lastReminderMinute !== undefined &&
          lastReminderHour === configuredHour &&
          lastReminderMinute === configuredMinute;

        if (lastReminderSent === today && dayMatch && sameTime) {
          logger.info(
            `  ⏭️  Usuario ${userId}: Ya se envió un recordatorio hoy. Omitiendo.`
          );
          remindersSkipped++;
          continue;
        }

        logger.info(`  ✅ Usuario ${userId}: ¡Coincide! Enviando notificación...`);

        const message =
          notificationSettings.weeklyReminder?.message ||
          "¡No olvides registrar tus gastos de esta semana en Clarity!";

        const fcmTokens = userData.fcmTokens || [];
        if (fcmTokens.length === 0) {
          logger.info(`  ⏭️  Usuario ${userId} no tiene tokens FCM`);
          remindersSkipped++;
          continue;
        }

        const result = await sendNotification(userId, {
          data: {
            type: "weekly-reminder",
            persistent: "true",
            url: "/",
            tag: `weekly-reminder-${userId}`,
            title: "📝 Clarity - Recordatorio Semanal",
            message,
          },
          android: {
            priority: "high",
            notification: {
              sound: "default",
              channelId: "reminders",
            },
          },
          apns: {
            payload: {
              aps: {
                sound: "default",
                badge: 1,
                contentAvailable: true,
              },
            },
          },
        });

        if (result.success && result.sent > 0) {
          try {
            await db.collection("users").doc(userId).update({
              lastWeeklyReminderSent: today,
              lastWeeklyReminderHour: configuredHour,
              lastWeeklyReminderMinute: configuredMinute,
              updatedAt: FieldValue.serverTimestamp(),
            });
            logger.info(
              `  ✅ Marcado lastWeeklyReminderSent para usuario ${userId}: ` +
              `${today} a las ${configuredHour}:${String(configuredMinute).padStart(2, "0")}`
            );
          } catch (error) {
            logger.error(
              `  ❌ Error actualizando lastWeeklyReminderSent para usuario ${userId}:`,
              error
            );
          }
          remindersSent += result.sent;
        }
      }

      logger.info("\n" + "=".repeat(50));
      logger.info("📊 RESUMEN DE RECORDATORIOS SEMANALES:");
      logger.info(`  ✅ Recordatorios enviados: ${remindersSent}`);
      logger.info(`  ⏭️  Usuarios omitidos: ${remindersSkipped}`);
      logger.info(`  👥 Usuarios procesados: ${usersSnapshot.size}`);
      logger.info("=".repeat(50));

      return { success: true, sent: remindersSent, skipped: remindersSkipped };
    } catch (error) {
      logger.error("❌ Error en sendWeeklyReminders:", error);
      throw error;
    }
  }
);





