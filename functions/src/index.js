/* eslint-disable max-len */
/**
 * Clarity - Cloud Functions
 * Punto de entrada principal - Solo exporta funciones
 */

const { setGlobalOptions } = require("firebase-functions/v2");
const { initializeApp } = require("firebase-admin/app");
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

// Inicializar Firebase Admin
initializeApp();

// Configuración global
setGlobalOptions({
  maxInstances: 10,
  region: "europe-west1",
});

// ============================================
// EXPORTAR FUNCIONES DE IA
// ============================================
const { askDeepSeek } = require("./ai/askDeepSeek");
exports.askDeepSeek = askDeepSeek;

// ============================================
// EXPORTAR FUNCIONES DE GASTOS RECURRENTES
// ============================================
const { createRecurringExpenses } = require("./recurring/create");
const { checkMissedRecurringExpenses } = require("./recurring/check");

exports.createRecurringExpenses = createRecurringExpenses;
exports.checkMissedRecurringExpenses = checkMissedRecurringExpenses;

// ============================================
// EXPORTAR FUNCIONES DE NOTIFICACIONES
// ============================================
const { sendDailyReminders } = require("./notifications/daily");
const { sendWeeklyReminders } = require("./notifications/weekly");
const { sendMonthlyIncomeReminder } = require("./notifications/income");
const { sendTestNotification } = require("./notifications/test");

exports.sendDailyReminders = sendDailyReminders;
exports.sendWeeklyReminders = sendWeeklyReminders;
exports.sendMonthlyIncomeReminder = sendMonthlyIncomeReminder;
exports.sendTestNotification = sendTestNotification;

// ============================================
// EXPORTAR FUNCIONES DE UTILIDAD
// ============================================
const { migrateQuotas } = require("./utils/migrateQuotas");
exports.migrateQuotas = migrateQuotas;

// TODO: ELIMINAR ESTO EN PRODUCCION
const { makeMeAdmin } = require("./admin/makeMeAdmin");
const { getUsersToMigrate } = require("./admin/getUsersToMigrate");

exports.makeMeAdmin = makeMeAdmin;
exports.getUsersToMigrate = getUsersToMigrate;
// ============================================
/**
 * Cloud Function que actúa como proxy para la API de DeepSeek
 * Evita problemas de CORS y mantiene la API key segura en el servidor
 */
exports.aiProxy = onRequest(
  {
    cors: true,
    region: "europe-west1",
    memory: "256MiB",
    timeoutSeconds: 60,
    secrets: ["DEEPSEEK_API_KEY"],
  },
  async (req, res) => {
    // Solo permitir POST
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      // Obtener la API key del secret de Firebase
      const apiKey = process.env.DEEPSEEK_API_KEY;
      if (!apiKey) {
        logger.error(
          "❌ DEEPSEEK_API_KEY no configurada en los secrets de Firebase"
        );
        res.status(500).json({
          error:
            "API key not configured. " +
            "Please set DEEPSEEK_API_KEY secret in Firebase.",
        });
        return;
      }

      const { model, max_tokens: maxTokens, messages } = req.body;

      if (!model || !messages) {
        res.status(400).json({
          error: "Missing required fields: model, messages",
        });
        return;
      }

      // Hacer la petición a DeepSeek
      const response = await fetch(
        "https://api.deepseek.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model || "deepseek-chat",
            max_tokens: maxTokens || 1000,
            messages: messages,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error("❌ Error en API de DeepSeek:", errorData);
        res.status(response.status).json(errorData);
        return;
      }

      const data = await response.json();
      res.status(200).json(data);
    } catch (error) {
      logger.error("❌ Error en aiProxy:", error);
      res.status(500).json({
        error: "Internal server error",
        message: error.message,
      });
    }
  }
);

// ============================================
// EXPORTAR FUNCIONES DE MIGRACIÓN
// ============================================
const { migrateAllUsersQuotas } = require("./utils/migrateQuotas");

/**
 * Función HTTP para migrar cuotas de todos los usuarios
 * Uso: Llamar desde Firebase Console o con curl
 * Ejemplo: curl -X POST https://europe-west1-clarity-gastos.cloudfunctions.net/migrateQuotas -H "Authorization: Bearer clarity-migration-2024"
 */
exports.migrateQuotas = onRequest(
  {
    cors: true,
    region: "europe-west1",
    memory: "512MiB",
    timeoutSeconds: 540,
    invoker: "public",
  },
  async (req, res) => {
    try {
      // Verificar autenticación básica (opcional, puedes añadir más seguridad)
      const authHeader = req.headers.authorization;
      const migrationToken = process.env.MIGRATION_TOKEN || "clarity-migration-2024";

      if (!authHeader || authHeader !== `Bearer ${migrationToken}`) {
        res.status(401).json({ error: "No autorizado" });
        return;
      }

      logger.info("🚀 Iniciando migración de cuotas...");
      const results = await migrateAllUsersQuotas();

      res.status(200).json({
        success: true,
        message: "Migración completada",
        results,
      });
    } catch (error) {
      logger.error("❌ Error en migración:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);


// ============================================
// EXPORTAR FUNCIONES DE MIGRACIÓN AUTOMÁTICA
// ============================================
// Migración automática de nuevos usuarios
const { autoMigrateNewUser } = require("./migrations/autoMigrateUser");
exports.autoMigrateNewUser = autoMigrateNewUser;

// Migración manual de usuarios existentes
const { migrateExistingUser } = require("./migrations/migrateExistingUser");
exports.migrateExistingUser = migrateExistingUser;

// Limpieza automática (7 días después)
const { cleanupMigratedUsers } = require("./migrations/cleanupOldFields");
exports.cleanupMigratedUsers = cleanupMigratedUsers;
