const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");

const db = getFirestore();

/**
 * Se ejecuta automáticamente cuando se crea un usuario
 * Migra a estructura escalable si tiene campos viejos
 */
exports.autoMigrateNewUser = onDocumentCreated(
  {
    document: "users/{userId}",
    region: "europe-west1",
  },
  async (event) => {
    const userId = event.params.userId;
    const userData = event.data.data();

    logger.info(`🔍 Verificando usuario nuevo: ${userId}`);

    // Si NO tiene aiQuotas, no necesita migración
    if (!userData.aiQuotas) {
      logger.info(`✅ Usuario ${userId} ya tiene estructura correcta`);
      return;
    }

    logger.info(`🔄 Migrando usuario ${userId} a estructura escalable...`);

    try {
      // ==========================================
      // 1. CREAR PERFIL DE IA
      // ==========================================
      const profileRef = db.doc(`users/${userId}/ai/profile`);
      await profileRef.set({
        plan: userData.aiQuotas.unlimited ? "premium" :
          (userData.aiQuotas.monthly > 3 ? "pro" : "free"),
        role: userData.role || "user",
        stripeCustomerId: null,
        subscriptionStatus: null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      logger.info(`  ✅ Perfil de IA creado`);

      // ==========================================
      // 2. CREAR USO DEL MES ACTUAL
      // ==========================================
      const currentMonth = getCurrentMonth();
      const usageRef = db.doc(`users/${userId}/ai/usage_${currentMonth}`);

      await usageRef.set({
        quotas: {
          monthly: userData.aiQuotas.monthly || userData.aiQuotas.total || 3,
          used: userData.aiQuotas.used || 0,
          remaining: userData.aiQuotas.remaining || 3,
          unlimited: userData.aiQuotas.unlimited || false,
          resetDate: fixResetDate(userData.aiQuotas.resetDate),
        },
        queries: userData.aiQuotas.used || 0,
        lastQuery: null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      logger.info(`  ✅ Cuotas del mes creadas (${currentMonth})`);

      // ==========================================
      // 3. CREAR CONFIGURACIÓN DE NOTIFICACIONES
      // ==========================================
      if (userData.notificationSettings || userData.fcmTokens) {
        const notifRef = db.doc(`users/${userId}/notifications/settings`);

        await notifRef.set({
          fcmToken: getLatestToken(userData.fcmTokens),
          pushEnabled: userData.notificationSettings?.pushNotifications?.enabled || false,

          dailyReminder: {
            enabled: userData.notificationSettings?.customReminders?.enabled || false,
            hour: userData.notificationSettings?.customReminders?.hour || 20,
            minute: userData.notificationSettings?.customReminders?.minute || 0,
            message: userData.notificationSettings?.customReminders?.message ||
                     "No olvides registrar tus gastos",
          },

          weeklyReminder: {
            enabled: userData.notificationSettings?.weeklyReminder?.enabled || false,
            dayOfWeek: userData.notificationSettings?.weeklyReminder?.dayOfWeek || 1,
            hour: userData.notificationSettings?.weeklyReminder?.hour || 9,
            minute: userData.notificationSettings?.weeklyReminder?.minute || 0,
            message: userData.notificationSettings?.weeklyReminder?.message ||
                     "¡No olvides registrar tus gastos de esta semana!",
            lastSent: userData.lastWeeklyReminderSent || null,
          },

          monthlyIncomeReminder: {
            enabled: userData.notificationSettings?.monthlyIncomeReminder?.enabled || false,
            dayOfMonth: userData.notificationSettings?.monthlyIncomeReminder?.dayOfMonth || 28,
          },

          budgetAlerts: {
            enabled: userData.notificationSettings?.budgetAlerts?.enabled ?? true,
            at80: userData.notificationSettings?.budgetAlerts?.at80 ?? true,
            at90: userData.notificationSettings?.budgetAlerts?.at90 ?? true,
            at100: userData.notificationSettings?.budgetAlerts?.at100 ?? true,
          },

          recurringReminders: {
            enabled: userData.notificationSettings?.recurringReminders?.enabled ?? true,
          },

          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });

        logger.info(`  ✅ Configuración de notificaciones creada`);
      }

      // ==========================================
      // 4. LIMPIAR DOCUMENTO RAÍZ (7 días después)
      // ==========================================
      // Programar limpieza para dar tiempo de rollback si algo falla
      const cleanupDate = new Date();
      cleanupDate.setDate(cleanupDate.getDate() + 7);

      await db.collection("_migrations_cleanup").add({
        userId,
        cleanupAfter: cleanupDate,
        fieldsToDelete: [
          "aiQuotas",
          "fcmTokens",
          "notificationSettings",
          "role",
          "lastWeeklyReminderSent",
          "lastWeeklyReminderHour",
          "lastWeeklyReminderMinute",
        ],
        createdAt: FieldValue.serverTimestamp(),
      });

      // Marcar como migrado
      await db.doc(`users/${userId}`).update({
        _migrated: true,
        _migratedAt: FieldValue.serverTimestamp(),
        _migratedVersion: "2.0.0",
        updatedAt: FieldValue.serverTimestamp(),
      });

      logger.info(`✅ Usuario ${userId} migrado exitosamente`);
      logger.info(`🧹 Limpieza programada para ${cleanupDate.toISOString()}`);
    } catch (error) {
      logger.error(`❌ Error migrando usuario ${userId}:`, error);

      // Registrar error pero no fallar (para no bloquear creación de usuario)
      await db.collection("_migrations_errors").add({
        userId,
        error: error.message,
        stack: error.stack,
        userData: JSON.stringify(userData),
        timestamp: FieldValue.serverTimestamp(),
      });
    }
  }
);

// ==========================================
// HELPERS
// ==========================================

/**
 * @return {string} The current year-month string
 */
function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * @param {string} resetDate - The reset date string
 * @return {string} The formatted reset date
 */
function fixResetDate(resetDate) {
  if (!resetDate) {
    const next = new Date();
    next.setMonth(next.getMonth() + 1, 1);
    return next.toISOString().split("T")[0];
  }

  // "2025-12" → "2026-01-01"
  if (resetDate.length === 7) {
    const [year, month] = resetDate.split("-").map(Number);
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    return `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
  }

  return resetDate;
}

/**
 * @param {string[]} tokens - Array of FCM tokens
 * @return {string|null} The latest token
 */
function getLatestToken(tokens) {
  if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
    return null;
  }
  return tokens[tokens.length - 1];
}
