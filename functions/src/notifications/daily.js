/* eslint-disable max-len */
/**
 * Cloud Function que envía recordatorios diarios a las 20:00
 * Se ejecuta todos los días a las 20:00 (8 PM)
 */

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { getFirestore } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");
const { sendNotification } = require("../utils/fcm");

const db = getFirestore();

exports.sendDailyReminders = onSchedule(
  {
    schedule: "0 20 * * *", // Todos los días a las 20:00
    timeZone: "Europe/Madrid",
    memory: "256MiB",
    timeoutSeconds: 300,
    invoker: "public",
  },
  async (event) => {
    logger.info("🔔 Iniciando envío de recordatorios diarios...");

    try {
      const usersSnapshot = await db.collection("users").get();
      let remindersSent = 0;
      let remindersSkipped = 0;

      logger.info(`👥 Procesando ${usersSnapshot.size} usuarios...`);

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();

        const notificationSettings = userData.notificationSettings;

        if (!notificationSettings?.customReminders?.enabled) {
          remindersSkipped++;
          continue;
        }

        const message =
          notificationSettings.customReminders?.message ||
          "No olvides registrar tus gastos de hoy";

        const fcmTokens = userData.fcmTokens || [];
        if (fcmTokens.length === 0) {
          logger.info(`  ⏭️  Usuario ${userId} no tiene tokens FCM`);
          remindersSkipped++;
          continue;
        }

        const result = await sendNotification(userId, {
          data: {
            type: "daily-reminder",
            persistent: "true",
            url: "/",
            tag: `daily-reminder-${userId}`,
            title: "📝 Clarity - Recordatorio",
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

        if (result.success) {
          logger.info(
            `  ✅ Recordatorio enviado a usuario ${userId}: ${result.sent} exitosos`
          );
          remindersSent += result.sent;
        } else {
          logger.error(
            `  ❌ Error enviando recordatorio a usuario ${userId}: ${result.error}`
          );
        }
      }

      logger.info("\n" + "=".repeat(50));
      logger.info("📊 RESUMEN DE RECORDATORIOS DIARIOS:");
      logger.info(`  ✅ Recordatorios enviados: ${remindersSent}`);
      logger.info(`  ⏭️  Usuarios omitidos: ${remindersSkipped}`);
      logger.info(`  👥 Usuarios procesados: ${usersSnapshot.size}`);
      logger.info("=".repeat(50));

      return { success: true, sent: remindersSent, skipped: remindersSkipped };
    } catch (error) {
      logger.error("❌ Error en sendDailyReminders:", error);
      throw error;
    }
  }
);


