/* eslint-disable max-len */
/**
 * Cloud Function de respaldo que se ejecuta cada 6 horas
 * Verifica y recupera gastos recurrentes que no se crearon
 */

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");

const db = getFirestore();

exports.checkMissedRecurringExpenses = onSchedule(
  {
    schedule: "0 */6 * * *", // Cada 6 horas
    timeZone: "Europe/Madrid",
    memory: "256MiB",
    timeoutSeconds: 300,
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




