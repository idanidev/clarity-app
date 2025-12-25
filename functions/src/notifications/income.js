/* eslint-disable max-len */
/**
 * Cloud Function que se ejecuta todos los días a las 20:00
 * Notifica a usuarios con ingresos variables (income es null) para que actualicen sus ingresos
 */

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");
const { sendNotification } = require("../utils/fcm");

const db = getFirestore();

exports.sendMonthlyIncomeReminder = onSchedule(
  {
    schedule: "0 20 1-31 * *", // Todos los días del mes a las 20:00
    timeZone: "Europe/Madrid",
    memory: "256MiB",
    timeoutSeconds: 300,
    invoker: "public",
  },
  async (event) => {
    logger.info("💰 Iniciando recordatorio de ingresos mensuales...");

    try {
      const now = new Date();
      const madridFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Europe/Madrid",
        day: "numeric",
        month: "numeric",
        year: "numeric",
      });

      const madridParts = madridFormatter.formatToParts(now);
      const currentDay = parseInt(
        madridParts.find((p) => p.type === "day")?.value || "0",
        10
      );
      const currentMonth = parseInt(
        madridParts.find((p) => p.type === "month")?.value || "0",
        10
      );
      const currentYear = parseInt(
        madridParts.find((p) => p.type === "year")?.value || "0",
        10
      );

      logger.info(
        `📅 Día actual: ${currentDay}, Mes: ${currentMonth}, Año: ${currentYear}`
      );

      const usersSnapshot = await db.collection("users").get();
      let remindersSent = 0;
      let remindersSkipped = 0;

      logger.info(`👥 Procesando ${usersSnapshot.size} usuarios...`);

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();

        const notificationSettings = userData.notificationSettings;

        if (!notificationSettings?.pushNotifications?.enabled) {
          remindersSkipped++;
          continue;
        }

        const monthlyIncomeReminder = notificationSettings?.monthlyIncomeReminder;
        if (!monthlyIncomeReminder?.enabled) {
          logger.info(
            `  ⏭️  Usuario ${userId}: Recordatorio de ingresos mensual deshabilitado. Omitiendo.`
          );
          remindersSkipped++;
          continue;
        }

        const configuredDay = monthlyIncomeReminder?.dayOfMonth ?? 28;
        if (currentDay !== configuredDay) {
          logger.info(
            `  ⏭️  Usuario ${userId}: Día actual (${currentDay}) no coincide con día configurado (${configuredDay}). Omitiendo.`
          );
          remindersSkipped++;
          continue;
        }

        const userIncome = userData.income;
        const hasNoIncome =
          userIncome === null || userIncome === undefined || userIncome === 0;

        if (!hasNoIncome) {
          logger.info(
            `  ⏭️  Usuario ${userId}: Ya tiene ingresos configurados (€${userIncome}). Omitiendo recordatorio.`
          );
          remindersSkipped++;
          continue;
        }

        const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;
        const lastIncomeReminderSent = userData.lastIncomeReminderSent;

        if (lastIncomeReminderSent === currentMonthKey) {
          logger.info(
            `  ⏭️  Usuario ${userId}: Ya se envió recordatorio de ingresos este mes. Omitiendo.`
          );
          remindersSkipped++;
          continue;
        }

        const fcmTokens = userData.fcmTokens || [];
        if (fcmTokens.length === 0) {
          logger.info(`  ⏭️  Usuario ${userId} no tiene tokens FCM`);
          remindersSkipped++;
          continue;
        }

        const message =
          "📊 ¡No olvides registrar tus ingresos de este mes en Clarity! " +
          "Ve a Ajustes → General para configurarlos y hacer un seguimiento preciso de tus ahorros.";

        const result = await sendNotification(userId, {
          data: {
            type: "income-reminder",
            persistent: "true",
            url: "/",
            tag: `income-reminder-${userId}-${currentMonthKey}`,
            title: "💰 Clarity - Recordatorio de Ingresos",
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
          webpush: {
            fcmOptions: {
              link: "/",
            },
          },
        });

        if (result.success && result.sent > 0) {
          try {
            await db.collection("users").doc(userId).update({
              lastIncomeReminderSent: currentMonthKey,
              updatedAt: FieldValue.serverTimestamp(),
            });
            logger.info(
              `  ✅ Marcado lastIncomeReminderSent para usuario ${userId}: ${currentMonthKey}`
            );
          } catch (error) {
            logger.error(
              `  ❌ Error actualizando lastIncomeReminderSent para usuario ${userId}:`,
              error
            );
          }
          remindersSent += result.sent;
        }
      }

      logger.info("\n" + "=".repeat(50));
      logger.info("📊 RESUMEN DE RECORDATORIOS DE INGRESOS:");
      logger.info(`  ✅ Recordatorios enviados: ${remindersSent}`);
      logger.info(`  ⏭️  Usuarios omitidos: ${remindersSkipped}`);
      logger.info(`  👥 Usuarios procesados: ${usersSnapshot.size}`);
      logger.info("=".repeat(50));

      return { success: true, sent: remindersSent, skipped: remindersSkipped };
    } catch (error) {
      logger.error("❌ Error en sendMonthlyIncomeReminder:", error);
      throw error;
    }
  }
);




