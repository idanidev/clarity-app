/* eslint-disable max-len */
/**
 * Cloud Function que se ejecuta todos los días a las 00:01
 * Crea gastos recurrentes automáticamente cuando llega el día del mes
 */

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");

const db = getFirestore();

exports.createRecurringExpenses = onSchedule(
  {
    schedule: "1 0 * * *", // Todos los días a las 00:01
    timeZone: "Europe/Madrid",
    memory: "256MiB",
    timeoutSeconds: 300,
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
              `  ⚠️  Gasto "${recurring.name}" tiene monto negativo ` +
              `(€${recurring.amount}). Se ajustará a 0.`
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





