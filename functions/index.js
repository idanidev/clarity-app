/**
 * Clarity - Cloud Functions para Gastos Recurrentes
 * Firebase Functions v2
 */

const { setGlobalOptions } = require("firebase-functions/v2");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");

// Inicializar Firebase Admin
initializeApp();
const db = getFirestore();

// Configuración global
setGlobalOptions({
  maxInstances: 10,
  region: "europe-west1", // Cambia a tu región preferida
});

/**
 * Cloud Function que se ejecuta todos los días a las 00:01
 * Crea gastos recurrentes automáticamente cuando llega el día del mes
 */
exports.createRecurringExpenses = onSchedule({
  schedule: "1 0 * * *", // Todos los días a las 00:01
  timeZone: "Europe/Madrid", // ⚠️ CAMBIA A TU ZONA HORARIA
  memory: "256MiB",
  timeoutSeconds: 300, // 5 minutos
}, async (event) => {
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
        // eslint-disable-next-line max-len
        logger.info(`  ⏭️  No hay gastos recurrentes para el día ${currentDay}`);
        continue;
      }

      logger.info(`  📋 Encontrados ${recurringExpensesSnapshot.size} gastos`);

      for (const recurringDoc of recurringExpensesSnapshot.docs) {
        const recurring = recurringDoc.data();
        const recurringId = recurringDoc.id;

        logger.info(`  💰 Procesando: ${recurring.name} (€${recurring.amount})`);

        // Verificar si tiene fecha de fin y ya expiró
        if (recurring.endDate) {
          const endDate = new Date(recurring.endDate);
          if (today > endDate) {
            // eslint-disable-next-line max-len
            logger.warn(`  ⚠️  Gasto "${recurring.name}" expirado. Desactivando...`);

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

        // Verificar si ya se creó el gasto este mes
        const existingExpenseSnapshot = await db
          .collection("users")
          .doc(userId)
          .collection("expenses")
          .where("recurringId", "==", recurringId)
          .where("date", ">=", `${currentMonth}-01`)
          .where("date", "<=", `${currentMonth}-31`)
          .get();

        if (!existingExpenseSnapshot.empty) {
          logger.info(`  ✅ Gasto "${recurring.name}" ya existe para este mes`);
          totalExpensesSkipped++;
          continue;
        }

        // Crear el gasto
        const newExpense = {
          name: recurring.name,
          amount: recurring.amount,
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
    logger.info(`  ⏭️  Gastos omitidos (ya existen): ${totalExpensesSkipped}`);
    // eslint-disable-next-line max-len
    logger.info(`  ⚠️  Gastos expirados y desactivados: ${totalExpensesExpired}`);
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
});

/**
 * Cloud Function de respaldo que se ejecuta cada 6 horas
 * Verifica y recupera gastos recurrentes que no se crearon
 */
exports.checkMissedRecurringExpenses = onSchedule({
  schedule: "0 */6 * * *", // Cada 6 horas
  timeZone: "Europe/Madrid", // ⚠️ CAMBIA A TU ZONA HORARIA
  memory: "256MiB",
  timeoutSeconds: 300,
}, async (event) => {
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
            amount: recurring.amount,
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
});
