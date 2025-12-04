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
          // Importante: usamos SOLO `data` para evitar que el navegador muestre
          // automáticamente una notificación duplicada.
          data: {
            type: "daily-reminder",
            persistent: "true",
            url: "/",
            tag: `daily-reminder-${userId}`, // Tag único por usuario para evitar duplicados
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
                // NO incluir 'alert' aquí - el Service Worker se encargará de mostrar la notificación
              },
            },
          },
          // NO incluir webpush.notification - el Service Worker se encargará de mostrar la notificación
          // Esto evita que el navegador muestre automáticamente una notificación duplicada
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
    // Ejecutar cada 5 minutos pero solo durante horas activas (8:00-22:00)
    // Esto permite probar con cualquier minuto ahora, y en el futuro cuando solo haya hora funcionará igual
    // Reducimos carga ejecutando solo en horas activas (no en madrugada)
    schedule: "*/5 8-22 * * *", // Cada 5 minutos, solo entre las 8:00 y 22:59
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

        // Permitir un rango de ±2 minutos para mayor flexibilidad
        // Esto permite probar con cualquier minuto ahora, y en el futuro cuando solo haya hora (minuto 0) funcionará igual
        const configuredMinuteNum = Number(configuredMinute);
        const currentMinuteNum = Number(currentMinute);
        const minuteDiff = Math.abs(currentMinuteNum - configuredMinuteNum);
        // Si la hora coincide, permitir hasta ±2 minutos de diferencia
        const minuteMatch = hourMatch && minuteDiff <= 2;

        logger.info(`  👤 Usuario ${userId}: Configurado para día ${configuredDay} a las ${configuredHour}:${String(configuredMinute).padStart(2, "0")}`);
        logger.info(`  📊 Usuario ${userId}: Actual (Madrid) - día: ${currentDayOfWeek}, hora: ${currentHour}, minuto: ${currentMinute}`);
        logger.info(`  📊 Usuario ${userId}: Configurado - día: ${configuredDay}, hora: ${configuredHour}, minuto: ${configuredMinute}`);
        logger.info(`  📊 Usuario ${userId}: Coincidencias - día: ${dayMatch}, hora: ${hourMatch}, minuto: ${minuteMatch}`);

        // Verificar si coincide con el día, hora y minutos configurados (con rango de ±2 minutos)
        if (!dayMatch || !hourMatch || !minuteMatch) {
          logger.info(`  ⏭️  Usuario ${userId}: No coincide (actual: ${currentDayOfWeek} ${currentHour}:${String(currentMinute).padStart(2, "0")}, configurado: ${configuredDay} ${configuredHour}:${String(configuredMinute).padStart(2, "0")})`);
          continue;
        }

        // Verificar si ya se envió una notificación hoy para evitar duplicados
        // Solo bloquear si ya se envió hoy Y la hora/minuto configurados son los mismos
        // Esto permite que se envíe si cambiaste la hora o minuto del recordatorio
        const lastReminderSent = userData.lastWeeklyReminderSent;
        const lastReminderHour = userData.lastWeeklyReminderHour;
        const lastReminderMinute = userData.lastWeeklyReminderMinute;
        const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

        logger.info(`  🔍 Usuario ${userId}: Verificando último recordatorio - Fecha: ${lastReminderSent || "nunca"}, Hora: ${lastReminderHour ?? "N/A"}, Minuto: ${lastReminderMinute ?? "N/A"}`);

        // Solo bloquear si:
        // 1. Ya se envió hoy (mismo día)
        // 2. Es el mismo día de la semana
        // 3. La hora/minuto configurados coinciden con los del último envío
        // Si alguno de estos campos no existe, permitir el envío
        const sameTime = lastReminderHour !== undefined && lastReminderMinute !== undefined &&
                         lastReminderHour === configuredHour && lastReminderMinute === configuredMinute;

        if (lastReminderSent === today && dayMatch && sameTime) {
          logger.info(`  ⏭️  Usuario ${userId}: Ya se envió un recordatorio hoy (${today}) a las ${lastReminderHour}:${String(lastReminderMinute).padStart(2, "0")}. Omitiendo para evitar duplicados.`);
          remindersSkipped++;
          continue;
        } else if (lastReminderSent === today && dayMatch && !sameTime) {
          logger.info(`  ✅ Usuario ${userId}: Ya se envió hoy pero con hora diferente (última: ${lastReminderHour ?? "N/A"}:${String(lastReminderMinute ?? "N/A").padStart(2, "0")}, nueva: ${configuredHour}:${String(configuredMinute).padStart(2, "0")}). Permitir envío.`);
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
          // Importante: usar SOLO `data` para evitar notificaciones duplicadas en web/PWA
          data: {
            type: "weekly-reminder",
            persistent: "true",
            url: "/",
            tag: `weekly-reminder-${userId}`, // Tag único por usuario para evitar duplicados
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
                // NO incluir 'alert' aquí - el Service Worker se encargará de mostrar la notificación
              },
            },
          },
          // NO incluir webpush.notification - el Service Worker se encargará de mostrar la notificación
          // Esto evita que el navegador muestre automáticamente una notificación duplicada
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
          // Guardamos también la hora/minuto para permitir reenvío si el usuario cambia la hora
          if (response.successCount > 0) {
            try {
              await db.collection("users").doc(userId).update({
                lastWeeklyReminderSent: today,
                lastWeeklyReminderHour: configuredHour,
                lastWeeklyReminderMinute: configuredMinute,
                updatedAt: FieldValue.serverTimestamp(),
              });
              logger.info(`  ✅ Marcado lastWeeklyReminderSent para usuario ${userId}: ${today} a las ${configuredHour}:${String(configuredMinute).padStart(2, "0")}`);
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
    logger.info("🧪 ========== INICIANDO NOTIFICACIÓN DE PRUEBA ==========");

    try {
      const userId = req.query.userId || req.body.userId;
      logger.info(`🧪 userId recibido: ${userId}`);

      if (!userId) {
        logger.error("❌ userId no proporcionado");
        res.status(400).json({ error: "userId es requerido. Uso: ?userId=TU_USER_ID" });
        return;
      }

      // Obtener datos del usuario
      logger.info(`🧪 Obteniendo datos del usuario ${userId}...`);
      const userDoc = await db.collection("users").doc(userId).get();

      if (!userDoc.exists) {
        logger.error(`❌ Usuario ${userId} no encontrado en Firestore`);
        res.status(404).json({ error: "Usuario no encontrado" });
        return;
      }

      const userData = userDoc.data();
      const fcmTokens = userData.fcmTokens || [];
      logger.info(`🧪 Tokens FCM encontrados: ${fcmTokens.length}`);

      if (fcmTokens.length > 0) {
        logger.info(`🧪 Primer token (primeros 30 caracteres): ${fcmTokens[0].substring(0, 30)}...`);
      }

      if (fcmTokens.length === 0) {
        logger.error(`❌ Usuario ${userId} no tiene tokens FCM guardados`);
        res.status(400).json({ error: "El usuario no tiene tokens FCM. Asegúrate de haber concedido permisos de notificación." });
        return;
      }

      logger.info(`📤 Enviando notificación de prueba a ${fcmTokens.length} token(s) del usuario ${userId}`);

      // Enviar notificación de prueba
      const messages = fcmTokens.map((token) => ({
        token: token,
        // Importante: usamos SOLO `data` para evitar notificaciones duplicadas en web/PWA.
        data: {
          title: "🧪 Clarity - Notificación de Prueba",
          body: "¡Esta es una notificación de prueba! Si ves esto, las notificaciones push están funcionando correctamente.",
          url: "/",
          tag: "test-notification",
          persistent: "true",
          type: "reminder",
        },
        // NO incluir webpush.notification - el Service Worker se encargará de mostrar la notificación
        // Esto evita que el navegador muestre automáticamente una notificación duplicada
        webpush: {
          fcmOptions: {
            link: "/",
          },
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
              badge: 1,
              contentAvailable: true,
              // NO incluir 'alert' aquí - el Service Worker se encargará de mostrar la notificación
            },
          },
        },
      }));

      logger.info(`📤 Preparando ${messages.length} mensaje(s) para enviar...`);
      logger.info(`📤 Primer mensaje (primeros 100 caracteres): ${JSON.stringify(messages[0]).substring(0, 100)}...`);

      const response = await messaging.sendEach(messages);

      logger.info(`✅ ========== RESULTADO DEL ENVÍO ==========`);
      logger.info(`✅ Notificación de prueba enviada: ${response.successCount} exitosos de ${messages.length}`);

      // Limpiar tokens inválidos
      if (response.responses) {
        const invalidTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            logger.error(`    ❌ Error en token ${idx}: ${resp.error?.code} - ${resp.error?.message}`);
            logger.error(`    ❌ Token que falló (primeros 30 caracteres): ${messages[idx].token.substring(0, 30)}...`);

            // Detectar tokens inválidos
            if (resp.error?.code === "messaging/invalid-registration-token" ||
                resp.error?.code === "messaging/registration-token-not-registered") {
              invalidTokens.push(messages[idx].token);
            }
          } else {
            logger.info(`    ✅ Token ${idx} enviado correctamente`);
          }
        });

        // Eliminar tokens inválidos de Firestore
        if (invalidTokens.length > 0) {
          logger.info(`🧹 Limpiando ${invalidTokens.length} token(s) inválido(s) para usuario ${userId}...`);
          const validTokens = fcmTokens.filter((token) => !invalidTokens.includes(token));

          try {
            await db.collection("users").doc(userId).update({
              fcmTokens: validTokens,
              updatedAt: FieldValue.serverTimestamp(),
            });
            logger.info(`✅ Tokens inválidos eliminados. Tokens válidos restantes: ${validTokens.length}`);
          } catch (error) {
            logger.error(`❌ Error limpiando tokens inválidos:`, error);
          }
        }
      }

      if (response.failureCount > 0) {
        logger.warn(`⚠️  ${response.failureCount} mensaje(s) fallaron`);
      } else {
        logger.info(`✅ Todos los mensajes se enviaron correctamente`);
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

/**
 * Cloud Function que se ejecuta el último día de cada mes a las 20:00
 * Notifica a usuarios con ingresos variables (income es null) para que actualicen sus ingresos
 */
exports.sendMonthlyIncomeReminder = onSchedule(
  {
    schedule: "0 20 1-31 * *", // Todos los días del mes a las 20:00 para verificar si hay que enviar
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
      const currentDay = parseInt(madridParts.find((p) => p.type === "day")?.value || "0", 10);
      const currentMonth = parseInt(madridParts.find((p) => p.type === "month")?.value || "0", 10);
      const currentYear = parseInt(madridParts.find((p) => p.type === "year")?.value || "0", 10);

      logger.info(`📅 Día actual: ${currentDay}, Mes: ${currentMonth}, Año: ${currentYear}`);

      const usersSnapshot = await db.collection("users").get();
      let remindersSent = 0;
      let remindersSkipped = 0;

      logger.info(`👥 Procesando ${usersSnapshot.size} usuarios...`);

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();

        const notificationSettings = userData.notificationSettings;

        // Solo enviar a usuarios que tienen notificaciones push habilitadas
        if (!notificationSettings?.pushNotifications?.enabled) {
          remindersSkipped++;
          continue;
        }

        // Verificar si el recordatorio de ingresos mensual está habilitado
        const monthlyIncomeReminder = notificationSettings?.monthlyIncomeReminder;
        if (!monthlyIncomeReminder?.enabled) {
          logger.info(`  ⏭️  Usuario ${userId}: Recordatorio de ingresos mensual deshabilitado. Omitiendo.`);
          remindersSkipped++;
          continue;
        }

        // Verificar si es el día configurado para enviar el recordatorio
        const configuredDay = monthlyIncomeReminder?.dayOfMonth ?? 28;
        if (currentDay !== configuredDay) {
          logger.info(`  ⏭️  Usuario ${userId}: Día actual (${currentDay}) no coincide con día configurado (${configuredDay}). Omitiendo.`);
          remindersSkipped++;
          continue;
        }

        // Comprobar ingresos del usuario - Solo enviar si NO tiene ingresos configurados
        const userIncome = userData.income;
        const hasNoIncome = userIncome === null || userIncome === undefined || userIncome === 0;

        // Solo enviar recordatorio si NO tiene ingresos configurados
        if (!hasNoIncome) {
          logger.info(`  ⏭️  Usuario ${userId}: Ya tiene ingresos configurados (€${userIncome}). Omitiendo recordatorio.`);
          remindersSkipped++;
          continue;
        }

        // Recordar como máximo una vez al mes
        const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;
        const lastIncomeReminderSent = userData.lastIncomeReminderSent;

        if (lastIncomeReminderSent === currentMonthKey) {
          logger.info(`  ⏭️  Usuario ${userId}: Ya se envió recordatorio de ingresos este mes. Omitiendo.`);
          remindersSkipped++;
          continue;
        }

        let fcmTokens = userData.fcmTokens || [];
        if (fcmTokens.length === 0) {
          logger.info(`  ⏭️  Usuario ${userId} no tiene tokens FCM`);
          remindersSkipped++;
          continue;
        }

        // Usar solo el token más reciente
        if (fcmTokens.length > 1) {
          const latestToken = fcmTokens[fcmTokens.length - 1];
          fcmTokens = [latestToken];
        }

        const message = "📊 ¡No olvides registrar tus ingresos de este mes en Clarity! Ve a Ajustes → General para configurarlos y hacer un seguimiento preciso de tus ahorros.";

        const messages = fcmTokens.map((token) => ({
          token: token,
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
        }));

        try {
          logger.info(`  📤 Enviando recordatorio de ingresos a usuario ${userId}...`);
          const response = await messaging.sendEach(messages);
          logger.info(`  ✅ Recordatorio enviado a usuario ${userId}: ${response.successCount} exitosos de ${messages.length} intentos`);

          if (response.failureCount > 0) {
            logger.warn(`  ⚠️  ${response.failureCount} mensaje(s) fallaron para usuario ${userId}`);
          }

          remindersSent += response.successCount;

          if (response.successCount > 0) {
            try {
              await db.collection("users").doc(userId).update({
                lastIncomeReminderSent: currentMonthKey,
                updatedAt: FieldValue.serverTimestamp(),
              });
              logger.info(`  ✅ Marcado lastIncomeReminderSent para usuario ${userId}: ${currentMonthKey}`);
            } catch (error) {
              logger.error(`  ❌ Error actualizando lastIncomeReminderSent para usuario ${userId}:`, error);
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
          logger.error(`  ❌ Error enviando recordatorio de ingresos a usuario ${userId}:`, error);
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

