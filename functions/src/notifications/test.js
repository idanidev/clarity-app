/* eslint-disable max-len */
/**
 * Cloud Function de prueba para enviar notificaciones push manualmente
 * Se puede invocar desde Firebase Console o mediante HTTP
 * Uso: https://europe-west1-clarity-gastos.cloudfunctions.net/sendTestNotification?userId=TU_USER_ID
 */

const { onRequest } = require("firebase-functions/v2/https");
const { getFirestore } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");
const { sendNotification } = require("../utils/fcm");

const db = getFirestore();

exports.sendTestNotification = onRequest(
  {
    cors: true,
    region: "europe-west1",
    memory: "256MiB",
    timeoutSeconds: 300,
    invoker: "public",
  },
  async (req, res) => {
    logger.info("🧪 ========== INICIANDO NOTIFICACIÓN DE PRUEBA ==========");

    try {
      const userId = req.query.userId || req.body.userId;
      logger.info(`🧪 userId recibido: ${userId}`);

      if (!userId) {
        logger.error("❌ userId no proporcionado");
        res.status(400).json({
          error: "userId es requerido. Uso: ?userId=TU_USER_ID",
        });
        return;
      }

      logger.info(`🧪 Obteniendo datos del usuario ${userId}...`);
      const userDoc = await db.collection("users").doc(userId).get();

      if (!userDoc.exists) {
        logger.error(`❌ Usuario ${userId} no encontrado en Firestore`);
        res.status(404).json({ error: "Usuario no encontrado" });
        return;
      }

      const userData = userDoc.data();
      const fcmTokens = userData.fcmTokens || [];
      logger.info(`🧪 Tokens FCM encontrados: ${fcmTokens.length}`);

      if (fcmTokens.length === 0) {
        logger.error(`❌ Usuario ${userId} no tiene tokens FCM guardados`);
        res.status(400).json({
          error:
            "El usuario no tiene tokens FCM. " +
            "Asegúrate de haber concedido permisos de notificación.",
        });
        return;
      }

      logger.info(
        `📤 Enviando notificación de prueba a ${fcmTokens.length} token(s) del usuario ${userId}`
      );

      const result = await sendNotification(userId, {
        data: {
          title: "🧪 Clarity - Notificación de Prueba",
          body:
            "¡Esta es una notificación de prueba! " +
            "Si ves esto, las notificaciones push están funcionando correctamente.",
          url: "/",
          tag: "test-notification",
          persistent: "true",
          type: "reminder",
        },
        webpush: {
          fcmOptions: {
            link: "/",
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
      });

      logger.info(`✅ ========== RESULTADO DEL ENVÍO ==========`);
      logger.info(
        `✅ Notificación de prueba enviada: ${result.sent} exitosos de ${fcmTokens.length}`
      );

      res.json({
        success: result.success,
        sent: result.sent,
        failed: result.failed,
        message: `Notificación de prueba enviada a ${result.sent} dispositivo(s)`,
      });
    } catch (error) {
      logger.error("❌ Error enviando notificación de prueba:", error);
      res.status(500).json({ error: error.message });
    }
  }
);




