/* eslint-disable max-len */
/**
 * Helper para logging y analytics
 * Centraliza el registro de eventos y uso
 */

const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");

const db = getFirestore();

/**
 * Registrar uso de IA para analytics
 * @param {string} userId - ID del usuario
 * @param {string} query - Consulta realizada
 * @param {number} tokensUsed - Tokens consumidos
 * @param {boolean} success - Si la consulta fue exitosa
 * @return {Promise<void>}
 */
async function logAIUsage(userId, query, tokensUsed, success) {
  try {
    const usageRef = db.collection("ai_usage").doc();
    await usageRef.set({
      userId,
      query: query ? query.substring(0, 200) : "unknown", // Limitar longitud
      tokensUsed: tokensUsed || 0,
      success,
      timestamp: FieldValue.serverTimestamp(),
      date: new Date().toISOString().split("T")[0],
    });
  } catch (error) {
    logger.error("Error registrando uso de IA:", error);
    // No fallar si el logging falla
  }
}

/**
 * Registrar error en analytics
 * @param {string} userId - ID del usuario
 * @param {string} functionName - Nombre de la función que falló
 * @param {Error} error - Error ocurrido
 * @param {Object} context - Contexto adicional
 * @return {Promise<void>}
 */
async function logError(userId, functionName, error, context = {}) {
  try {
    const errorRef = db.collection("ai_errors").doc();
    await errorRef.set({
      userId: userId || "unknown",
      functionName,
      error: error.message || String(error),
      context,
      timestamp: FieldValue.serverTimestamp(),
      date: new Date().toISOString().split("T")[0],
    });
  } catch (logError) {
    logger.error("Error registrando error en analytics:", logError);
  }
}

module.exports = {
  logAIUsage,
  logError,
};

