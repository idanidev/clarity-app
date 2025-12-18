/* eslint-disable max-len */
/**
 * Helper para gestión de cuotas de IA
 * Maneja reset automático, verificación y decremento
 */

const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");

const db = getFirestore();

/**
 * Obtener mes actual en formato YYYY-MM
 * @return {string} - Mes actual en formato YYYY-MM
 */
function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Verificar si es admin o premium (ilimitado)
 * @param {Object} userData - Datos del usuario
 * @return {boolean} - Si el usuario tiene cuotas ilimitadas
 */
function isUnlimited(userData) {
  const role = userData.role || "free";
  const plan = userData.plan || "free";
  return role === "admin" || plan === "premium" || userData.unlimited === true;
}

/**
 * Obtener o inicializar cuotas del usuario
 * @param {string} userId - ID del usuario
 * @return {Promise<Object>} - Cuotas del usuario
 */
async function getUserQuotas(userId) {
  const userRef = db.collection("users").doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new Error("Usuario no encontrado");
  }

  const userData = userDoc.data();
  const currentMonth = getCurrentMonth();
  const unlimited = isUnlimited(userData);

  // Obtener cuotas actuales o inicializar si no existen
  const plan = userData.plan || "free";
  const role = userData.role || "free";
  let quotas = userData.aiQuotas;

  // Si no existen cuotas, inicializarlas
  if (!quotas) {
    quotas = {
      remaining: unlimited ? 999999 : 3,
      total: unlimited ? 999999 : 3,
      unlimited: unlimited,
      resetDate: currentMonth,
      plan: plan === "premium" ? "premium" : role === "admin" ? "admin" : "free",
    };

    // Guardar en Firestore
    await userRef.update({
      aiQuotas: quotas,
      updatedAt: FieldValue.serverTimestamp(),
    });

    logger.info(
      `✨ Cuotas inicializadas para usuario ${userId} (mes: ${currentMonth})`
    );
    return quotas;
  }

  // Verificar si necesitamos resetear (nuevo mes)
  const lastReset = quotas.resetDate || null;
  const needsReset = !lastReset || lastReset !== currentMonth;

  if (needsReset && !unlimited) {
    // Resetear cuotas para el nuevo mes
    quotas = {
      remaining: 3,
      total: 3,
      unlimited: false,
      resetDate: currentMonth,
      plan: plan,
    };

    // Guardar en Firestore
    await userRef.update({
      aiQuotas: quotas,
      updatedAt: FieldValue.serverTimestamp(),
    });

    logger.info(
      `🔄 Cuotas reseteadas para usuario ${userId} (mes: ${currentMonth})`
    );
  } else if (unlimited) {
    // Actualizar para asegurar que unlimited está en true
    const needsUpdate = !quotas.unlimited || quotas.plan !== (plan === "premium" ? "premium" : role === "admin" ? "admin" : "free");

    if (needsUpdate) {
      quotas.unlimited = true;
      quotas.plan = plan === "premium" ? "premium" : role === "admin" ? "admin" : "free";

      // Guardar actualización
      await userRef.update({
        aiQuotas: quotas,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }

  return quotas;
}

/**
 * Decrementar cuota del usuario
 * @param {string} userId - ID del usuario
 * @param {Object} quotas - Cuotas actuales del usuario
 * @return {Promise<Object>} - Cuotas actualizadas
 */
async function decrementQuota(userId, quotas) {
  if (quotas.unlimited) {
    return quotas; // No decrementar si es ilimitado
  }

  if (quotas.remaining <= 0) {
    throw new Error("Cuotas agotadas. Has usado tus 3 consultas mensuales.");
  }

  const updatedQuotas = {
    ...quotas,
    remaining: quotas.remaining - 1,
  };

  const userRef = db.collection("users").doc(userId);
  await userRef.update({
    aiQuotas: updatedQuotas,
    updatedAt: FieldValue.serverTimestamp(),
  });

  logger.info(
    `📉 Cuota decrementada para usuario ${userId}: ` +
    `${updatedQuotas.remaining}/${updatedQuotas.total}`
  );

  return updatedQuotas;
}

module.exports = {
  getUserQuotas,
  decrementQuota,
  getCurrentMonth,
  isUnlimited,
};

