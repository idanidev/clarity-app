const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");

const db = getFirestore();

/**
 * Migra un usuario existente a la estructura escalable
 * Uso: Desde admin panel o script
 */
exports.migrateExistingUser = onCall(
  {
    region: "europe-west1",
    timeoutSeconds: 60,
  },
  async (request) => {
    const { userId } = request.data;

    // Solo admins pueden migrar usuarios
    if (!request.auth || !request.auth.token.admin) {
      throw new HttpsError("permission-denied", "Unauthorized - Admin only");
    }

    if (!userId) {
      throw new HttpsError("invalid-argument", "userId is required");
    }

    logger.info(`🔄 Iniciando migración de usuario: ${userId}`);

    try {
      // Leer usuario actual
      const userRef = db.doc(`users/${userId}`);
      const userSnap = await userRef.get();

      if (!userSnap.exists) {
        throw new Error("User not found");
      }

      const userData = userSnap.data();

      // Verificar si ya está migrado
      if (userData._migrated) {
        logger.info(`✅ Usuario ${userId} ya estaba migrado`);
        return {
          success: true,
          alreadyMigrated: true,
          message: "User already migrated",
        };
      }

      // Si no tiene aiQuotas, no necesita migración
      if (!userData.aiQuotas) {
        logger.info(`✅ Usuario ${userId} no necesita migración (estructura correcta)`);
        return {
          success: true,
          alreadyMigrated: true,
          message: "User has correct structure",
        };
      }

      // ==========================================
      // EJECUTAR MIGRACIÓN (mismo código que onCreate)
      // ==========================================

      // 1. Perfil de IA
      await db.doc(`users/${userId}/ai/profile`).set({
        plan: userData.aiQuotas.unlimited ? "premium" :
          (userData.aiQuotas.monthly > 3 ? "pro" : "free"),
        role: userData.role || "user",
        stripeCustomerId: null,
        subscriptionStatus: null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // 2. Uso del mes
      const currentMonth = getCurrentMonth();
      await db.doc(`users/${userId}/ai/usage_${currentMonth}`).set({
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

      // 3. Notificaciones (si existen)
      if (userData.notificationSettings || userData.fcmTokens) {
        await db.doc(`users/${userId}/notifications/settings`).set({
          fcmToken: getLatestToken(userData.fcmTokens),
          pushEnabled: userData.notificationSettings?.pushNotifications?.enabled || false,
          dailyReminder: {
            enabled: userData.notificationSettings?.customReminders?.enabled || false,
            hour: userData.notificationSettings?.customReminders?.hour || 20,
            minute: userData.notificationSettings?.customReminders?.minute || 0,
            message: userData.notificationSettings?.customReminders?.message || "No olvides registrar tus gastos",
          },
          weeklyReminder: {
            enabled: userData.notificationSettings?.weeklyReminder?.enabled || false,
            dayOfWeek: userData.notificationSettings?.weeklyReminder?.dayOfWeek || 1,
            hour: userData.notificationSettings?.weeklyReminder?.hour || 9,
            minute: userData.notificationSettings?.weeklyReminder?.minute || 0,
            message: userData.notificationSettings?.weeklyReminder?.message || "¡No olvides registrar tus gastos!",
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
      }

      // 4. Programar limpieza (7 días)
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

      // 5. Marcar como migrado
      await userRef.update({
        _migrated: true,
        _migratedAt: FieldValue.serverTimestamp(),
        _migratedVersion: "2.0.0",
        updatedAt: FieldValue.serverTimestamp(),
      });

      logger.info(`✅ Usuario ${userId} migrado exitosamente`);

      return {
        success: true,
        alreadyMigrated: false,
        message: "User migrated successfully",
        userId,
        cleanupScheduledFor: cleanupDate.toISOString(),
      };
    } catch (error) {
      logger.error(`❌ Error migrando usuario ${userId}:`, error);

      await db.collection("_migrations_errors").add({
        userId,
        error: error.message,
        stack: error.stack,
        timestamp: FieldValue.serverTimestamp(),
      });

      // Si el error ya es HttpsError, relanzarlo
      if (error.code && error.details) {
        throw error;
      }

      throw new HttpsError("internal", `Migration failed: ${error.message}`, error);
    }
  }
);

// Helpers (mismos que antes)
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
  if (!tokens || !Array.isArray(tokens) || tokens.length === 0) return null;
  return tokens[tokens.length - 1];
}
