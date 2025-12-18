/* eslint-disable max-len */
/**
 * Script de migración para inicializar aiQuotas en todos los usuarios
 * Ejecutar manualmente desde Firebase Console o como Cloud Function
 */

const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");

const db = getFirestore();
const { getCurrentMonth, isUnlimited } = require("./quotas");

/**
 * Migrar cuotas para un usuario específico
 * @param {string} userId - ID del usuario
 * @return {Promise<Object>} - Resultado de la migración
 */
async function migrateUserQuotas(userId) {
  try {
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return { success: false, error: "Usuario no encontrado" };
    }

    const userData = userDoc.data();
    const currentMonth = getCurrentMonth();
    const unlimited = isUnlimited(userData);

    // Si ya tiene aiQuotas, verificar que esté correcto
    if (userData.aiQuotas) {
      // Verificar si necesita actualización
      const needsUpdate = unlimited && !userData.aiQuotas.unlimited;

      if (needsUpdate) {
        const plan = userData.plan || "free";
        const role = userData.role || "free";

        await userRef.update({
          "aiQuotas.unlimited": true,
          "aiQuotas.plan": plan === "premium" ? "premium" : role === "admin" ? "admin" : "free",
          "updatedAt": FieldValue.serverTimestamp(),
        });

        return { success: true, action: "updated" };
      }

      return { success: true, action: "already_exists" };
    }

    // Inicializar aiQuotas
    const plan = userData.plan || "free";
    const role = userData.role || "free";
    const quotas = {
      remaining: unlimited ? 999999 : 3,
      total: unlimited ? 999999 : 3,
      unlimited: unlimited,
      resetDate: currentMonth,
      plan: plan === "premium" ? "premium" : role === "admin" ? "admin" : "free",
    };

    await userRef.update({
      aiQuotas: quotas,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true, action: "created", quotas };
  } catch (error) {
    logger.error(`Error migrando cuotas para usuario ${userId}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Migrar cuotas para todos los usuarios
 * @return {Promise<Object>} - Resultado de la migración
 */
async function migrateAllUsersQuotas() {
  try {
    logger.info("🚀 Iniciando migración de cuotas para todos los usuarios...");

    const usersSnapshot = await db.collection("users").get();
    const results = {
      total: usersSnapshot.size,
      created: 0,
      updated: 0,
      alreadyExists: 0,
      errors: 0,
    };

    const promises = usersSnapshot.docs.map(async (userDoc) => {
      const result = await migrateUserQuotas(userDoc.id);

      if (result.success) {
        if (result.action === "created") {
          results.created++;
        } else if (result.action === "updated") {
          results.updated++;
        } else {
          results.alreadyExists++;
        }
      } else {
        results.errors++;
        logger.error(`Error en usuario ${userDoc.id}:`, result.error);
      }
    });

    await Promise.all(promises);

    logger.info("✅ Migración completada:", results);
    return results;
  } catch (error) {
    logger.error("❌ Error en migración masiva:", error);
    throw error;
  }
}

module.exports = {
  migrateUserQuotas,
  migrateAllUsersQuotas,
};

