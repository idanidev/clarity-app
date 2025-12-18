const { onSchedule } = require("firebase-functions/v2/scheduler");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");

const db = getFirestore();

/**
 * Se ejecuta diariamente para limpiar campos viejos
 * de usuarios migrados hace más de 7 días
 */
exports.cleanupMigratedUsers = onSchedule(
  {
    schedule: "0 3 * * *", // 3 AM diario
    timeZone: "Europe/Madrid",
    region: "europe-west1",
  },
  async (event) => {
    logger.info("🧹 Iniciando limpieza de usuarios migrados...");

    const now = new Date();

    // Buscar migraciones listas para limpieza
    const cleanupSnap = await db.collection("_migrations_cleanup")
      .where("cleanupAfter", "<=", now)
      .limit(100)
      .get();

    if (cleanupSnap.empty) {
      logger.info("✅ No hay migraciones pendientes de limpieza");
      return;
    }

    logger.info(`🧹 Encontradas ${cleanupSnap.size} migraciones para limpiar`);

    let cleaned = 0;
    let errors = 0;

    for (const doc of cleanupSnap.docs) {
      const { userId, fieldsToDelete } = doc.data();

      try {
        const userRef = db.doc(`users/${userId}`);
        const userSnap = await userRef.get();

        if (!userSnap.exists) {
          logger.warn(`⚠️  Usuario ${userId} no existe, eliminando registro`);
          await doc.ref.delete();
          continue;
        }

        const userData = userSnap.data();

        // Verificar que está migrado antes de borrar
        if (!userData._migrated) {
          logger.warn(`⚠️  Usuario ${userId} no está marcado como migrado, saltando`);
          continue;
        }

        // Preparar objeto con campos a borrar
        const deleteFields = {};
        fieldsToDelete.forEach((field) => {
          deleteFields[field] = FieldValue.delete();
        });

        // Borrar campos viejos
        await userRef.update(deleteFields);

        logger.info(`✅ Limpiado usuario ${userId} (${fieldsToDelete.length} campos borrados)`);

        // Eliminar registro de limpieza
        await doc.ref.delete();

        cleaned++;
      } catch (error) {
        logger.error(`❌ Error limpiando usuario ${userId}:`, error);
        errors++;
      }
    }

    logger.info(`🧹 Limpieza completada: ${cleaned} exitosos, ${errors} errores`);
  }
);
