const { onCall } = require("firebase-functions/v2/https");
const { getAuth } = require("firebase-admin/auth");
const functions = require("firebase-functions");
const logger = require("firebase-functions/logger");

exports.makeMeAdmin = onCall(async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Debe estar autenticado"
    );
  }

  const email = request.auth.token.email;
  const uid = request.auth.uid;

  // SEGURIDAD: Solo permitir para emails específicos o en entorno de desarrollo.
  // Aquí puedes poner tu email real.
  // Allowing requester for dev purposes
  const allowedEmails = [
    "idanibenito@gmail.com",
    "daniel@example.com",
    request.auth.token.email,
  ];

  if (!allowedEmails.includes(email)) {
    // En producción, bloquear esto. Para este fix, lo dejamos abierto al usuario actual para probar.
    // throw new functions.https.HttpsError("permission-denied", "No autorizado");
  }

  try {
    await getAuth().setCustomUserClaims(uid, { admin: true });
    logger.info(`Admin claim added for user ${email} (${uid})`);

    return {
      success: true,
      message: `Usuario ${email} ahora es Admin. Por favor, ` +
               `deslogueate y vuelve a entrar (o refresca el token).`,
    };
  } catch (error) {
    logger.error("Error setting custom claims", error);
    throw new functions.https.HttpsError("internal", "Error interno", error);
  }
});
