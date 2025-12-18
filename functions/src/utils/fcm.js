/* eslint-disable max-len */
/**
 * Helper para envío de notificaciones FCM
 * Centraliza la lógica de limpieza de tokens y envío
 */

const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");
const logger = require("firebase-functions/logger");

const db = getFirestore();
const messaging = getMessaging();

/**
 * Limpiar tokens FCM duplicados, dejando solo el más reciente
 * @param {string} userId - ID del usuario
 * @param {Array<string>} fcmTokens - Array de tokens FCM
 * @return {Promise<Array<string>>} - Tokens limpios
 */
async function cleanDuplicateTokens(userId, fcmTokens) {
  if (fcmTokens.length <= 1) {
    return fcmTokens;
  }

  logger.warn(
    `Usuario ${userId} tiene ${fcmTokens.length} tokens FCM. ` +
    "Usando solo el más reciente y limpiando duplicados..."
  );

  const latestToken = fcmTokens[fcmTokens.length - 1];
  const cleanedTokens = [latestToken];

  try {
    await db.collection("users").doc(userId).update({
      fcmTokens: cleanedTokens,
      updatedAt: FieldValue.serverTimestamp(),
    });
    logger.info(
      `Tokens duplicados limpiados para usuario ${userId}. ` +
      "Ahora hay 1 token único."
    );
  } catch (error) {
    logger.error(
      `Error limpiando tokens duplicados para usuario ${userId}:`,
      error
    );
  }

  return cleanedTokens;
}

/**
 * Limpiar tokens inválidos de la respuesta de FCM
 * @param {string} userId - ID del usuario
 * @param {Array<string>} fcmTokens - Array de tokens FCM
 * @param {Array<Object>} messages - Mensajes enviados
 * @param {Array<Object>} responses - Respuestas de FCM
 * @return {Promise<Array<string>>} - Tokens válidos
 */
async function cleanInvalidTokens(userId, fcmTokens, messages, responses) {
  if (!responses) {
    return fcmTokens;
  }

  const invalidTokens = [];
  responses.forEach((resp, idx) => {
    if (
      !resp.success &&
      (resp.error?.code === "messaging/invalid-registration-token" ||
        resp.error?.code === "messaging/registration-token-not-registered")
    ) {
      invalidTokens.push(messages[idx].token);
    }
  });

  if (invalidTokens.length === 0) {
    return fcmTokens;
  }

  logger.info(
    `Limpiando ${invalidTokens.length} tokens inválidos para usuario ${userId}`
  );

  const validTokens = fcmTokens.filter(
    (token) => !invalidTokens.includes(token)
  );

  try {
    await db.collection("users").doc(userId).update({
      fcmTokens: validTokens,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    logger.error(`Error limpiando tokens inválidos para usuario ${userId}:`, error);
  }

  return validTokens;
}

/**
 * Enviar notificación a un usuario
 * @param {string} userId - ID del usuario
 * @param {Object} notification - Objeto de notificación con data, android, apns, etc.
 * @return {Promise<Object>} - Resultado del envío
 */
async function sendNotification(userId, notification) {
  const userDoc = await db.collection("users").doc(userId).get();

  if (!userDoc.exists) {
    return { success: false, error: "Usuario no encontrado" };
  }

  const userData = userDoc.data();
  let fcmTokens = userData.fcmTokens || [];

  if (fcmTokens.length === 0) {
    return { success: false, error: "Sin tokens FCM" };
  }

  // Limpiar tokens duplicados
  fcmTokens = await cleanDuplicateTokens(userId, fcmTokens);

  // Preparar mensajes
  const messages = fcmTokens.map((token) => ({
    token: token,
    data: notification.data,
    android: notification.android,
    apns: notification.apns,
    webpush: notification.webpush,
  }));

  try {
    const response = await messaging.sendEach(messages);

    // Limpiar tokens inválidos
    await cleanInvalidTokens(userId, fcmTokens, messages, response.responses);

    return {
      success: response.successCount > 0,
      response: response,
      sent: response.successCount,
      failed: response.failureCount,
    };
  } catch (error) {
    logger.error(`Error enviando notificación a usuario ${userId}:`, error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendNotification,
  cleanDuplicateTokens,
  cleanInvalidTokens,
};

