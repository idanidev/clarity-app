/* eslint-disable max-len */
/**
 * Clarity - Cloud Functions para Gastos Recurrentes
 * Firebase Functions v2
 */

const { setGlobalOptions } = require("firebase-functions/v2");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");
const logger = require("firebase-functions/logger");

// Inicializar Firebase Admin
initializeApp();
const db = getFirestore();
const messaging = getMessaging();

// Configuración global
setGlobalOptions({
  maxInstances: 10,
  region: "europe-west1",
});

/**
 * Cloud Function que se ejecuta todos los días a las 00:01
 * Crea gastos recurrentes automáticamente cuando llega el día del mes
 */
exports.createRecurringExpenses = onSchedule(
  {
    schedule: "1 0 * * *", // Todos los días a las 00:01
    timeZone: "Europe/Madrid",
    memory: "256MiB",
    timeoutSeconds: 300,
    // ✅ AÑADIDO: Permitir invocaciones sin autenticación
    invoker: "public",
  },
  async (event) => {
    logger.info("🚀 Iniciando creación de gastos recurrentes...");

    try {
      const today = new Date();
      const currentDay = today.getDate();
      const currentDate = today.toISOString().split("T")[0]; // YYYY-MM-DD
      const currentMonth = currentDate.substring(0, 7); // YYYY-MM

      logger.info(`📅 Fecha actual: ${currentDate}, Día: ${currentDay}`);

      // Obtener todos los usuarios
      const usersSnapshot = await db.collection("users").get();
      let totalExpensesCreated = 0;
      let totalExpensesSkipped = 0;
      let totalExpensesExpired = 0;

      logger.info(`👥 Procesando ${usersSnapshot.size} usuarios...`);

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        logger.info(`\n👤 Usuario: ${userId}`);

        // Obtener gastos recurrentes activos para el día actual
        const recurringExpensesSnapshot = await db
          .collection("users")
          .doc(userId)
          .collection("recurringExpenses")
          .where("active", "==", true)
          .where("dayOfMonth", "==", currentDay)
          .get();

        if (recurringExpensesSnapshot.empty) {
          logger.info(
            `  ⏭️  No hay gastos recurrentes para el día ${currentDay}`
          );
          continue;
        }

        logger.info(
          `  📋 Encontrados ${recurringExpensesSnapshot.size} gastos`
        );

        for (const recurringDoc of recurringExpensesSnapshot.docs) {
          const recurring = recurringDoc.data();
          const recurringId = recurringDoc.id;
          const frequency = recurring.frequency || "monthly";

          logger.info(
            `  💰 Procesando: ${recurring.name} (€${recurring.amount}, frecuencia: ${frequency})`
          );

          // Verificar si tiene fecha de fin y ya expiró
          if (recurring.endDate) {
            const endDate = new Date(recurring.endDate);
            if (today > endDate) {
              logger.warn(
                `  ⚠️  Gasto "${recurring.name}" expirado. Desactivando...`
              );

              // Desactivar el gasto recurrente
              await db
                .collection("users")
                .doc(userId)
                .collection("recurringExpenses")
                .doc(recurringId)
                .update({
                  active: false,
                  updatedAt: FieldValue.serverTimestamp(),
                });

              totalExpensesExpired++;
              continue;
            }
          }

          // Verificar frecuencia y si corresponde crear el gasto
          let shouldCreate = false;

          if (frequency === "monthly") {
            // Mensual: verificar si ya se creó este mes
            const existingExpenseSnapshot = await db
              .collection("users")
              .doc(userId)
              .collection("expenses")
              .where("recurringId", "==", recurringId)
              .where("date", ">=", `${currentMonth}-01`)
              .where("date", "<=", `${currentMonth}-31`)
              .get();

            shouldCreate = existingExpenseSnapshot.empty;
          } else if (frequency === "quarterly") {
            // Trimestral: verificar si corresponde crear (cada 3 meses)
            const currentMonthNum = today.getMonth() + 1; // 1-12
            // Trimestres: Ene, Abr, Jul, Oct (meses 1, 4, 7, 10)
            const quarterMonths = [1, 4, 7, 10];
            if (quarterMonths.includes(currentMonthNum)) {
              const existingExpenseSnapshot = await db
                .collection("users")
                .doc(userId)
                .collection("expenses")
                .where("recurringId", "==", recurringId)
                .where("date", ">=", `${currentMonth}-01`)
                .where("date", "<=", `${currentMonth}-31`)
                .get();

              shouldCreate = existingExpenseSnapshot.empty;
            }
          } else if (frequency === "semiannual") {
            // Semestral: verificar si corresponde crear (cada 6 meses)
            const currentMonthNum = today.getMonth() + 1; // 1-12
            // Semestres: Ene, Jul (meses 1, 7)
            const semiannualMonths = [1, 7];
            if (semiannualMonths.includes(currentMonthNum)) {
              const existingExpenseSnapshot = await db
                .collection("users")
                .doc(userId)
                .collection("expenses")
                .where("recurringId", "==", recurringId)
                .where("date", ">=", `${currentMonth}-01`)
                .where("date", "<=", `${currentMonth}-31`)
                .get();

              shouldCreate = existingExpenseSnapshot.empty;
            }
          } else if (frequency === "annual") {
            // Anual: verificar si corresponde crear (una vez al año)
            const currentMonthNum = today.getMonth() + 1; // 1-12
            // Anual: solo en Enero (mes 1)
            if (currentMonthNum === 1) {
              const existingExpenseSnapshot = await db
                .collection("users")
                .doc(userId)
                .collection("expenses")
                .where("recurringId", "==", recurringId)
                .where("date", ">=", `${currentMonth}-01`)
                .where("date", "<=", `${currentMonth}-31`)
                .get();

              shouldCreate = existingExpenseSnapshot.empty;
            }
          }

          if (!shouldCreate) {
            logger.info(
              `  ⏭️  Se omite "${recurring.name}" (freq: ${frequency})`
            );
            totalExpensesSkipped++;
            continue;
          }

          // Validación: asegurar que amount no sea negativo
          const amount = Math.max(0, recurring.amount || 0);
          if (recurring.amount < 0) {
            logger.warn(
              `  ⚠️  Gasto "${recurring.name}" tiene monto negativo (€${recurring.amount}). Se ajustará a 0.`
            );
          }

          // Crear el gasto
          const newExpense = {
            name: recurring.name,
            amount: amount,
            category: recurring.category,
            subcategory: recurring.subcategory,
            date: currentDate,
            paymentMethod: recurring.paymentMethod,
            isRecurring: true,
            recurringId: recurringId,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          };

          await db
            .collection("users")
            .doc(userId)
            .collection("expenses")
            .add(newExpense);

          logger.info(`  ✅ Creado: ${recurring.name} - €${recurring.amount}`);
          totalExpensesCreated++;
        }
      }

      // Resumen final
      logger.info("\n" + "=".repeat(50));
      logger.info("📊 RESUMEN DE EJECUCIÓN:");
      logger.info(`  ✅ Gastos creados: ${totalExpensesCreated}`);
      logger.info(
        `  ⏭️  Gastos omitidos (ya existen): ${totalExpensesSkipped}`
      );
      logger.info(
        `  ⚠️  Gastos expirados y desactivados: ${totalExpensesExpired}`
      );
      logger.info(`  👥 Usuarios procesados: ${usersSnapshot.size}`);
      logger.info("=".repeat(50));

      return {
        success: true,
        created: totalExpensesCreated,
        skipped: totalExpensesSkipped,
        expired: totalExpensesExpired,
        users: usersSnapshot.size,
      };
    } catch (error) {
      logger.error("❌ Error en createRecurringExpenses:", error);
      throw error;
    }
  }
);

/**
 * Cloud Function de respaldo que se ejecuta cada 6 horas
 * Verifica y recupera gastos recurrentes que no se crearon
 */
exports.checkMissedRecurringExpenses = onSchedule(
  {
    schedule: "0 */6 * * *", // Cada 6 horas
    timeZone: "Europe/Madrid",
    memory: "256MiB",
    timeoutSeconds: 300,
    // ✅ AÑADIDO: Permitir invocaciones sin autenticación
    invoker: "public",
  },
  async (event) => {
    logger.info("🔍 Verificando gastos recurrentes perdidos...");

    try {
      const today = new Date();
      const currentDay = today.getDate();
      const currentDate = today.toISOString().split("T")[0];
      const currentMonth = currentDate.substring(0, 7);

      logger.info(`📅 Fecha: ${currentDate}, Día: ${currentDay}`);

      // Obtener todos los usuarios
      const usersSnapshot = await db.collection("users").get();
      let totalExpensesRecovered = 0;

      logger.info(`👥 Revisando ${usersSnapshot.size} usuarios...`);

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;

        // Obtener gastos recurrentes activos con día <= hoy
        const recurringExpensesSnapshot = await db
          .collection("users")
          .doc(userId)
          .collection("recurringExpenses")
          .where("active", "==", true)
          .where("dayOfMonth", "<=", currentDay)
          .get();

        if (recurringExpensesSnapshot.empty) {
          continue;
        }

        for (const recurringDoc of recurringExpensesSnapshot.docs) {
          const recurring = recurringDoc.data();
          const recurringId = recurringDoc.id;

          // Verificar si tiene fecha de fin
          if (recurring.endDate) {
            const endDate = new Date(recurring.endDate);
            if (today > endDate) {
              continue;
            }
          }

          // Verificar si ya existe el gasto de este mes
          const existingExpenseSnapshot = await db
            .collection("users")
            .doc(userId)
            .collection("expenses")
            .where("recurringId", "==", recurringId)
            .where("date", ">=", `${currentMonth}-01`)
            .where("date", "<=", `${currentMonth}-31`)
            .get();

          if (existingExpenseSnapshot.empty) {
            // Crear el gasto con la fecha correcta del mes
            const dayStr = recurring.dayOfMonth.toString().padStart(2, "0");
            const expenseDate = `${currentMonth}-${dayStr}`;

            const newExpense = {
              name: recurring.name,
              amount: Math.max(0, recurring.amount || 0), // Asegurar que amount sea >= 0
              category: recurring.category,
              subcategory: recurring.subcategory,
              date: expenseDate,
              paymentMethod: recurring.paymentMethod,
              isRecurring: true,
              recurringId: recurringId,
              createdAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            };

            await db
              .collection("users")
              .doc(userId)
              .collection("expenses")
              .add(newExpense);

            logger.info(`  🔧 Recuperado: ${recurring.name} (${expenseDate})`);
            totalExpensesRecovered++;
          }
        }
      }

      logger.info("\n" + "=".repeat(50));
      logger.info("📊 RESUMEN DE VERIFICACIÓN:");
      logger.info(`  🔧 Gastos recuperados: ${totalExpensesRecovered}`);
      logger.info(`  👥 Usuarios revisados: ${usersSnapshot.size}`);
      logger.info("=".repeat(50));

      return {
        success: true,
        recovered: totalExpensesRecovered,
        users: usersSnapshot.size,
      };
    } catch (error) {
      logger.error("❌ Error en checkMissedRecurringExpenses:", error);
      throw error;
    }
  }
);

/**
 * Cloud Function que envía recordatorios diarios a las 20:00
 * Se ejecuta todos los días a las 20:00 (8 PM)
 * Funciona incluso cuando la app está cerrada
 */
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
      // Obtener todos los usuarios
      const usersSnapshot = await db.collection("users").get();
      let remindersSent = 0;
      let remindersSkipped = 0;

      logger.info(`👥 Procesando ${usersSnapshot.size} usuarios...`);

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();

        // Verificar si tiene recordatorios personalizados activos
        const notificationSettings = userData.notificationSettings;

        if (!notificationSettings?.customReminders?.enabled) {
          remindersSkipped++;
          continue;
        }

        const message = notificationSettings.customReminders?.message ||
                       "No olvides registrar tus gastos de hoy";

        // Obtener tokens FCM del usuario
        let fcmTokens = userData.fcmTokens || [];

        if (fcmTokens.length === 0) {
          logger.info(`  ⏭️  Usuario ${userId} no tiene tokens FCM`);
          remindersSkipped++;
          continue;
        }

        // Si hay múltiples tokens, usar solo el más reciente (último de la lista)
        // y limpiar los duplicados en Firestore
        if (fcmTokens.length > 1) {
          logger.warn(`  ⚠️  Usuario ${userId} tiene ${fcmTokens.length} tokens FCM. Usando solo el más reciente y limpiando duplicados...`);
          const latestToken = fcmTokens[fcmTokens.length - 1];
          fcmTokens = [latestToken];

          // Limpiar tokens duplicados en Firestore
          try {
            await db.collection("users").doc(userId).update({
              fcmTokens: fcmTokens,
              updatedAt: FieldValue.serverTimestamp(),
            });
            logger.info(`  🧹 Tokens duplicados limpiados para usuario ${userId}. Ahora hay 1 token único.`);
          } catch (error) {
            logger.error(`  ❌ Error limpiando tokens duplicados para usuario ${userId}:`, error);
          }
        }

        // Enviar notificación a cada token
        const messages = fcmTokens.map((token) => ({
          token: token,
          notification: {
            title: "📝 Clarity - Recordatorio",
            body: message,
          },
          data: {
            type: "daily-reminder",
            persistent: "true",
            url: "/",
            tag: `daily-reminder-${userId}`, // Tag único por usuario para evitar duplicados
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
            notification: {
              requireInteraction: true,
              badge: "/icon-192.png",
              icon: "/icon-192.png",
            },
          },
        }));

        try {
          const response = await messaging.sendEach(messages);
          logger.info(`  ✅ Recordatorio enviado a usuario ${userId}: ${response.successCount} exitosos`);
          remindersSent += response.successCount;

          // Limpiar tokens inválidos
          if (response.responses) {
            const invalidTokens = [];
            response.responses.forEach((resp, idx) => {
              if (!resp.success && (resp.error?.code === "messaging/invalid-registration-token" ||
                                    resp.error?.code === "messaging/registration-token-not-registered")) {
                invalidTokens.push(messages[idx].token);
              }
            });

            if (invalidTokens.length > 0) {
              logger.info(`  🧹 Limpiando ${invalidTokens.length} tokens inválidos para usuario ${userId}`);
              const validTokens = fcmTokens.filter((token) => !invalidTokens.includes(token));
              await db.collection("users").doc(userId).update({
                fcmTokens: validTokens,
                updatedAt: FieldValue.serverTimestamp(),
              });
            }
          }
        } catch (error) {
          logger.error(`  ❌ Error enviando recordatorio a usuario ${userId}:`, error);
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

/**
 * Cloud Function que envía recordatorios semanales
 * Se ejecuta cada hora y verifica si es el día y hora configurados por cada usuario
 * Funciona incluso cuando la app está cerrada
 */
exports.sendWeeklyReminders = onSchedule(
  {
    schedule: "* * * * *", // Cada minuto para máxima precisión
    timeZone: "Europe/Madrid",
    memory: "256MiB",
    timeoutSeconds: 300,
    invoker: "public",
  },
  async (event) => {
    logger.info("🔔 Iniciando envío de recordatorios semanales...");

    try {
      // Obtener la hora actual en la zona horaria de Madrid
      // Las Cloud Functions se ejecutan en UTC, pero necesitamos la hora de Madrid
      const now = new Date();
      // Obtener el offset de Madrid (UTC+1 en invierno, UTC+2 en verano)
      // Usar Intl.DateTimeFormat para obtener la hora correcta en Madrid
      const madridFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Europe/Madrid",
        hour: "numeric",
        minute: "numeric",
        hour12: false,
        weekday: "long",
      });

      const madridParts = madridFormatter.formatToParts(now);
      const currentHour = parseInt(madridParts.find((p) => p.type === "hour")?.value || "0", 10);
      const currentMinute = parseInt(madridParts.find((p) => p.type === "minute")?.value || "0", 10);
      const weekday = madridParts.find((p) => p.type === "weekday")?.value || "";

      // Convertir día de la semana a número (0=Domingo, 6=Sábado)
      const weekdayMap = { "Sunday": 0, "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6 };
      const currentDayOfWeek = weekdayMap[weekday] ?? now.getDay();

      logger.info(`📅 Día: ${currentDayOfWeek} (0=Domingo), Hora Madrid: ${currentHour}:${String(currentMinute).padStart(2, "0")} (UTC: ${now.getUTCHours()}:${String(now.getUTCMinutes()).padStart(2, "0")})`);

      // Obtener todos los usuarios
      const usersSnapshot = await db.collection("users").get();
      let remindersSent = 0;
      let remindersSkipped = 0;

      logger.info(`👥 Procesando ${usersSnapshot.size} usuarios...`);

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();

        // Verificar si tiene recordatorios semanales activos
        const notificationSettings = userData.notificationSettings;

        if (!notificationSettings?.weeklyReminder?.enabled) {
          remindersSkipped++;
          continue;
        }

        // Verificar si es el día configurado
        const configuredDay = notificationSettings.weeklyReminder?.dayOfWeek ?? 0;
        const configuredHour = notificationSettings.weeklyReminder?.hour ?? 21;
        const configuredMinute = notificationSettings.weeklyReminder?.minute ?? 0;

        // Convertir a números para asegurar comparación correcta
        const dayMatch = Number(currentDayOfWeek) === Number(configuredDay);
        const hourMatch = Number(currentHour) === Number(configuredHour);

        // Permitir un rango de ±5 minutos para mayor flexibilidad
        // Esto evita que se pierda la notificación si la función se ejecuta unos minutos tarde
        const configuredMinuteNum = Number(configuredMinute);
        const currentMinuteNum = Number(currentMinute);
        const minuteDiff = Math.abs(currentMinuteNum - configuredMinuteNum);
        // Si la hora coincide, permitir hasta ±5 minutos de diferencia
        // Si la hora no coincide pero estamos en el mismo minuto, también permitirlo
        const minuteMatch = hourMatch ? (minuteDiff <= 5) : (currentMinuteNum === configuredMinuteNum);

        logger.info(`  👤 Usuario ${userId}: Configurado para día ${configuredDay} a las ${configuredHour}:${String(configuredMinute).padStart(2, "0")}`);
        logger.info(`  📊 Usuario ${userId}: Actual (Madrid) - día: ${currentDayOfWeek}, hora: ${currentHour}, minuto: ${currentMinute}`);
        logger.info(`  📊 Usuario ${userId}: Configurado - día: ${configuredDay}, hora: ${configuredHour}, minuto: ${configuredMinute}`);
        logger.info(`  📊 Usuario ${userId}: Coincidencias - día: ${dayMatch}, hora: ${hourMatch}, minuto: ${minuteMatch} (diferencia: ${minuteDiff} min)`);

        // Verificar si coincide con el día, hora y minutos configurados (con rango de ±2 minutos)
        if (!dayMatch || !hourMatch || !minuteMatch) {
          logger.info(`  ⏭️  Usuario ${userId}: No coincide (actual: ${currentDayOfWeek} ${currentHour}:${String(currentMinute).padStart(2, "0")}, configurado: ${configuredDay} ${configuredHour}:${String(configuredMinute).padStart(2, "0")})`);
          continue;
        }

        // Verificar si ya se envió una notificación hoy para evitar duplicados
        // Solo verificar si es el mismo día de la semana configurado
        const lastReminderSent = userData.lastWeeklyReminderSent;
        const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

        // Solo bloquear si ya se envió hoy Y es el mismo día de la semana configurado
        // Esto permite que se envíe si cambiaste el día de la semana
        if (lastReminderSent === today && dayMatch) {
          logger.info(`  ⏭️  Usuario ${userId}: Ya se envió un recordatorio hoy (${today}). Omitiendo para evitar duplicados.`);
          remindersSkipped++;
          continue;
        }

        logger.info(`  ✅ Usuario ${userId}: ¡Coincide! Enviando notificación...`);

        const message = notificationSettings.weeklyReminder?.message ||
                       "¡No olvides registrar tus gastos de esta semana en Clarity!";

        // Obtener tokens FCM del usuario
        let fcmTokens = userData.fcmTokens || [];

        if (fcmTokens.length === 0) {
          logger.info(`  ⏭️  Usuario ${userId} no tiene tokens FCM`);
          remindersSkipped++;
          continue;
        }

        // Si hay múltiples tokens, usar solo el más reciente (último de la lista)
        // y limpiar los duplicados en Firestore
        if (fcmTokens.length > 1) {
          logger.warn(`  ⚠️  Usuario ${userId} tiene ${fcmTokens.length} tokens FCM. Usando solo el más reciente y limpiando duplicados...`);
          const latestToken = fcmTokens[fcmTokens.length - 1];
          fcmTokens = [latestToken];

          // Limpiar tokens duplicados en Firestore
          try {
            await db.collection("users").doc(userId).update({
              fcmTokens: fcmTokens,
              updatedAt: FieldValue.serverTimestamp(),
            });
            logger.info(`  🧹 Tokens duplicados limpiados para usuario ${userId}. Ahora hay 1 token único.`);
          } catch (error) {
            logger.error(`  ❌ Error limpiando tokens duplicados para usuario ${userId}:`, error);
          }
        }

        // Enviar notificación
        const messages = fcmTokens.map((token) => ({
          token: token,
          notification: {
            title: "📝 Clarity - Recordatorio Semanal",
            body: message,
          },
          data: {
            type: "weekly-reminder",
            persistent: "true",
            url: "/",
            tag: `weekly-reminder-${userId}`, // Tag único por usuario para evitar duplicados
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
            notification: {
              requireInteraction: true,
              badge: "/icon-192.png",
              icon: "/icon-192.png",
            },
          },
        }));

        try {
          logger.info(`  📤 Enviando ${messages.length} mensaje(s) a usuario ${userId}...`);
          const response = await messaging.sendEach(messages);
          logger.info(`  ✅ Recordatorio semanal enviado a usuario ${userId}: ${response.successCount} exitosos de ${messages.length} intentos`);

          if (response.failureCount > 0) {
            logger.warn(`  ⚠️  ${response.failureCount} mensaje(s) fallaron para usuario ${userId}`);
            response.responses?.forEach((resp, idx) => {
              if (!resp.success) {
                logger.error(`    ❌ Error en token ${idx}: ${resp.error?.code} - ${resp.error?.message}`);
              }
            });
          }

          remindersSent += response.successCount;

          // Marcar que se envió el recordatorio hoy para evitar duplicados
          if (response.successCount > 0) {
            try {
              await db.collection("users").doc(userId).update({
                lastWeeklyReminderSent: today,
                updatedAt: FieldValue.serverTimestamp(),
              });
              logger.info(`  ✅ Marcado lastWeeklyReminderSent para usuario ${userId}: ${today}`);
            } catch (error) {
              logger.error(`  ❌ Error actualizando lastWeeklyReminderSent para usuario ${userId}:`, error);
            }
          }

          // Limpiar tokens inválidos
          if (response.responses) {
            const invalidTokens = [];
            response.responses.forEach((resp, idx) => {
              if (!resp.success && (resp.error?.code === "messaging/invalid-registration-token" ||
                                    resp.error?.code === "messaging/registration-token-not-registered")) {
                invalidTokens.push(messages[idx].token);
              }
            });

            if (invalidTokens.length > 0) {
              logger.info(`  🧹 Limpiando ${invalidTokens.length} tokens inválidos para usuario ${userId}`);
              const validTokens = fcmTokens.filter((token) => !invalidTokens.includes(token));
              await db.collection("users").doc(userId).update({
                fcmTokens: validTokens,
                updatedAt: FieldValue.serverTimestamp(),
              });
            }
          }
        } catch (error) {
          logger.error(`  ❌ Error enviando recordatorio semanal a usuario ${userId}:`, error);
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

/**
 * Cloud Function de prueba para enviar notificaciones push manualmente
 * Se puede invocar desde Firebase Console o mediante HTTP
 * Uso: https://europe-west1-clarity-gastos.cloudfunctions.net/sendTestNotification?userId=TU_USER_ID
 */
const { onRequest } = require("firebase-functions/v2/https");
exports.sendTestNotification = onRequest(
  {
    cors: true,
    region: "europe-west1",
    memory: "256MiB",
    timeoutSeconds: 300,
    invoker: "public",
  },
  async (req, res) => {
    logger.info("🧪 Enviando notificación de prueba...");

    try {
      const userId = req.query.userId || req.body.userId;

      if (!userId) {
        res.status(400).json({ error: "userId es requerido. Uso: ?userId=TU_USER_ID" });
        return;
      }

      // Obtener datos del usuario
      const userDoc = await db.collection("users").doc(userId).get();

      if (!userDoc.exists) {
        res.status(404).json({ error: "Usuario no encontrado" });
        return;
      }

      const userData = userDoc.data();
      let fcmTokens = userData.fcmTokens || [];

      if (fcmTokens.length === 0) {
        res.status(400).json({ error: "El usuario no tiene tokens FCM. Asegúrate de haber concedido permisos de notificación." });
        return;
      }

      // Si hay múltiples tokens, usar solo el más reciente (último de la lista)
      // y limpiar los duplicados en Firestore
      if (fcmTokens.length > 1) {
        logger.warn(`  ⚠️  Usuario ${userId} tiene ${fcmTokens.length} tokens FCM. Usando solo el más reciente y limpiando duplicados...`);
        const latestToken = fcmTokens[fcmTokens.length - 1];
        fcmTokens = [latestToken];

        // Limpiar tokens duplicados en Firestore
        try {
          await db.collection("users").doc(userId).update({
            fcmTokens: fcmTokens,
            updatedAt: FieldValue.serverTimestamp(),
          });
          logger.info(`  🧹 Tokens duplicados limpiados para usuario ${userId}. Ahora hay 1 token único.`);
        } catch (error) {
          logger.error(`  ❌ Error limpiando tokens duplicados para usuario ${userId}:`, error);
        }
      }

      logger.info(`📤 Enviando notificación de prueba a ${fcmTokens.length} token(s) del usuario ${userId}`);

      // Enviar notificación de prueba
      const messages = fcmTokens.map((token) => ({
        token: token,
        notification: {
          title: "🧪 Clarity - Notificación de Prueba",
          body: "¡Esta es una notificación de prueba! Si ves esto, las notificaciones push están funcionando correctamente.",
        },
        data: {
          type: "test",
          persistent: "false",
          url: "/",
          tag: "test-notification",
        },
        webpush: {
          notification: {
            requireInteraction: false,
            badge: "/icon-192.png",
            icon: "/icon-192.png",
          },
        },
      }));

      const response = await messaging.sendEach(messages);

      logger.info(`✅ Notificación de prueba enviada: ${response.successCount} exitosos de ${messages.length}`);

      if (response.failureCount > 0) {
        logger.warn(`⚠️  ${response.failureCount} mensaje(s) fallaron`);
        response.responses?.forEach((resp, idx) => {
          if (!resp.success) {
            logger.error(`    ❌ Error en token ${idx}: ${resp.error?.code} - ${resp.error?.message}`);
          }
        });
      }

      res.json({
        success: true,
        sent: response.successCount,
        failed: response.failureCount,
        message: `Notificación de prueba enviada a ${response.successCount} dispositivo(s)`,
      });
    } catch (error) {
      logger.error("❌ Error enviando notificación de prueba:", error);
      res.status(500).json({ error: error.message });
    }
  }
);
