const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getFirestore } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");

const db = getFirestore();

exports.getUsersToMigrate = onCall(async (request) => {
  // 1. Verificar permisos de admin
  if (!request.auth || !request.auth.token.admin) {
    throw new HttpsError(
      "permission-denied",
      "Solo los administradores pueden ver esto."
    );
  }

  try {
    const unmigrated = [];

    // 2. Obtener usuarios (Optimización: en prod, usar paginación)
    // Para este script de migración, leemos la colección.
    const usersSnap = await db.collection("users").get();

    usersSnap.forEach((doc) => {
      const data = doc.data();
      // Misma lógica de filtrado que teníamos en el frontend
      if (data.aiQuotas && !data._migrated) {
        unmigrated.push({
          id: doc.id,
          email: data.email || "No email",
          aiQuotas: data.aiQuotas,
          _migrated: data._migrated,
        });
      }
    });

    logger.info(`Found ${unmigrated.length} users to migrate`);

    return {
      success: true,
      users: unmigrated,
    };
  } catch (error) {
    logger.error("Error fetching users", error);
    throw new HttpsError("internal", "Error interno", error);
  }
});
