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
        const fcmTokens = userData.fcmTokens || [];
        
        if (fcmTokens.length === 0) {
          logger.info(`  ⏭️  Usuario ${userId} no tiene tokens FCM`);
          remindersSkipped++;
          continue;
        }

        // Enviar notificación a cada token
        const messages = fcmTokens.map(token => ({
          token: token,
          notification: {
            title: "📝 Clarity - Recordatorio",
            body: message,
          },
          data: {
            type: "daily-reminder",
            persistent: "true",
            url: "/",
            tag: "daily-reminder",
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
              if (!resp.success && (resp.error?.code === 'messaging/invalid-registration-token' || 
                                    resp.error?.code === 'messaging/registration-token-not-registered')) {
                invalidTokens.push(messages[idx].token);
              }
            });
            
            if (invalidTokens.length > 0) {
              logger.info(`  🧹 Limpiando ${invalidTokens.length} tokens inválidos para usuario ${userId}`);
              const validTokens = fcmTokens.filter(token => !invalidTokens.includes(token));
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
    schedule: "* * * * *", // Cada minuto
    timeZone: "Europe/Madrid",
    memory: "256MiB",
    timeoutSeconds: 300,
    invoker: "public",
  },
  async (event) => {
    logger.info("🔔 Iniciando envío de recordatorios semanales...");

    try {
      const now = new Date();
      const currentDayOfWeek = now.getDay(); // 0 = Domingo, 6 = Sábado
      const currentHour = now.getHours(); // 0-23
      const currentMinute = now.getMinutes(); // 0-59

      logger.info(`📅 Día de la semana: ${currentDayOfWeek} (0=Domingo, 6=Sábado), Hora: ${currentHour}:${String(currentMinute).padStart(2, '0')}`);

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
        const configuredDay = notificationSettings.weeklyReminder?.dayOfWeek || 0;
        const configuredHour = notificationSettings.weeklyReminder?.hour !== undefined 
          ? notificationSettings.weeklyReminder.hour 
          : 21; // Hora por defecto: 21:00
        const configuredMinute = notificationSettings.weeklyReminder?.minute !== undefined 
          ? notificationSettings.weeklyReminder.minute 
          : 0; // Minutos por defecto: 0
        
        // Verificar si coincide con el día, hora y minutos configurados
        if (currentDayOfWeek !== configuredDay || currentHour !== configuredHour || currentMinute !== configuredMinute) {
          continue;
        }

        const message = notificationSettings.weeklyReminder?.message || 
                       "¡No olvides registrar tus gastos de esta semana en Clarity!";

        // Obtener tokens FCM del usuario
        const fcmTokens = userData.fcmTokens || [];
        
        if (fcmTokens.length === 0) {
          logger.info(`  ⏭️  Usuario ${userId} no tiene tokens FCM`);
          remindersSkipped++;
          continue;
        }

        // Enviar notificación
        const messages = fcmTokens.map(token => ({
          token: token,
          notification: {
            title: "📝 Clarity - Recordatorio Semanal",
            body: message,
          },
          data: {
            type: "weekly-reminder",
            persistent: "true",
            url: "/",
            tag: "weekly-reminder",
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
          logger.info(`  ✅ Recordatorio semanal enviado a usuario ${userId}: ${response.successCount} exitosos`);
          remindersSent += response.successCount;
          
          // Limpiar tokens inválidos
          if (response.responses) {
            const invalidTokens = [];
            response.responses.forEach((resp, idx) => {
              if (!resp.success && (resp.error?.code === 'messaging/invalid-registration-token' || 
                                    resp.error?.code === 'messaging/registration-token-not-registered')) {
                invalidTokens.push(messages[idx].token);
              }
            });
            
            if (invalidTokens.length > 0) {
              logger.info(`  🧹 Limpiando ${invalidTokens.length} tokens inválidos para usuario ${userId}`);
              const validTokens = fcmTokens.filter(token => !invalidTokens.includes(token));
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
