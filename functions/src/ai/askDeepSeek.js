/* eslint-disable max-len */
/**
 * Firebase Function: askDeepSeek
 * Integración con DeepSeek API para análisis inteligente de gastos
 * Sistema de cuotas: 3 consultas/mes (free), ilimitado (admin/premium)
 */

const { onCall } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const { getUserQuotas, decrementQuota } = require("../utils/quotas");
const { logAIUsage } = require("../utils/analytics");

/**
 * Cloud Function: askDeepSeek
 * Llama a la API de DeepSeek con contexto de gastos del usuario
 */
exports.askDeepSeek = onCall(
  {
    region: "europe-west1",
    memory: "512MiB",
    timeoutSeconds: 60,
    secrets: ["DEEPSEEK_API_KEY"],
  },
  async (request) => {
    const startTime = Date.now();
    logger.info("🤖 ========== INICIANDO askDeepSeek ==========");

    try {
      // Verificar autenticación
      const auth = request.auth;
      if (!auth) {
        logger.error("❌ Usuario no autenticado");
        return {
          success: false,
          error: "Debes estar autenticado para usar el asistente IA",
        };
      }

      const userId = auth.uid;
      logger.info(`👤 Usuario: ${userId}`);

      // Obtener datos de la petición
      const { query, contextData } = request.data;

      if (!query || typeof query !== "string") {
        logger.error("❌ Query no válida");
        return {
          success: false,
          error: "La consulta es requerida",
        };
      }

      logger.info(`📝 Query: ${query.substring(0, 100)}...`);

      // Obtener cuotas del usuario
      let quotas;
      try {
        quotas = await getUserQuotas(userId);
        const quotaText = quotas.unlimited ?
          "Ilimitado" :
          `${quotas.remaining}/${quotas.total}`;
        logger.info(`📊 Cuotas: ${quotaText}`);
      } catch (error) {
        logger.error("❌ Error obteniendo cuotas:", error);
        return {
          success: false,
          error: "Error al verificar cuotas del usuario",
        };
      }

      // Verificar si tiene cuotas disponibles
      if (!quotas.unlimited && quotas.remaining <= 0) {
        logger.warn(`⚠️ Usuario ${userId} sin cuotas disponibles`);
        return {
          success: false,
          error:
            "Cuotas agotadas. Has usado tus 3 consultas mensuales. " +
            "Actualiza a Pro para 50 consultas/mes.",
          quotas: quotas,
        };
      }

      // Obtener API key de DeepSeek
      const apiKey = process.env.DEEPSEEK_API_KEY;
      if (!apiKey) {
        logger.error("❌ DEEPSEEK_API_KEY no configurada");
        return {
          success: false,
          error: "API key no configurada. Contacta al administrador.",
        };
      }

      // Construir prompt con contexto
      const topCategoriesText = contextData?.topCategories?.length > 0 ?
        `- Top categorías: ${contextData.topCategories
          .map((c) => `${c.category} (€${c.total.toFixed(2)})`)
          .join(", ")}` :
        "";
      const projectedTotalText = contextData?.projectedTotal ?
        `- Proyección fin de mes: €${contextData.projectedTotal.toFixed(2)}` :
        "";
      const smallExpensesText = contextData?.smallExpenses ?
        `- Gastos pequeños (<€10): €${contextData.smallExpenses.toFixed(2)}` :
        "";

      const systemPrompt = `Eres un asistente financiero experto en análisis de gastos personales. 
Analiza los datos financieros del usuario y proporciona insights útiles, recomendaciones prácticas y análisis detallados.

Datos del usuario:
- Total gastado este mes: €${contextData?.totalExpenses?.toFixed(2) || "0.00"}
- Ingresos: €${contextData?.income?.toFixed(2) || "0.00"}
- Promedio diario: €${contextData?.avgDaily?.toFixed(2) || "0.00"}
- Días restantes del mes: ${contextData?.daysLeft || 0}
- Tendencia: ${contextData?.trend || "estable"}
${topCategoriesText}
${projectedTotalText}
${smallExpensesText}

Responde en español, de forma clara y concisa. Usa emojis cuando sea apropiado. 
Sé específico con números y recomendaciones accionables.`;

      const userPrompt = query;

      // Llamar a DeepSeek API
      logger.info("📤 Llamando a DeepSeek API...");
      const deepseekResponse = await fetch(
        "https://api.deepseek.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
              {
                role: "system",
                content: systemPrompt,
              },
              {
                role: "user",
                content: userPrompt,
              },
            ],
            max_tokens: 1500,
            temperature: 0.7,
          }),
        }
      );

      if (!deepseekResponse.ok) {
        const errorData = await deepseekResponse.json().catch(() => ({}));
        logger.error("❌ Error en DeepSeek API:", errorData);

        // Registrar error
        await logAIUsage(userId, query, 0, false);

        return {
          success: false,
          error:
            errorData.error?.message || "Error al procesar la consulta con IA",
          fallbackUsed: false,
        };
      }

      const deepseekData = await deepseekResponse.json();
      const content =
        deepseekData.choices?.[0]?.message?.content ||
        "No se pudo generar una respuesta.";
      const tokensUsed = deepseekData.usage?.total_tokens || 0;

      logger.info(`✅ Respuesta recibida (${tokensUsed} tokens)`);

      // Decrementar cuota (solo si no es ilimitado)
      let updatedQuotas = quotas;
      if (!quotas.unlimited) {
        try {
          updatedQuotas = await decrementQuota(userId, quotas);
        } catch (error) {
          logger.error("❌ Error decrementando cuota:", error);
          // Si falla el decremento pero ya tenemos la respuesta, devolverla igual
          // pero registrar el error
        }
      }

      // Registrar uso exitoso
      await logAIUsage(userId, query, tokensUsed, true);

      const duration = Date.now() - startTime;
      logger.info(`⏱️ Tiempo total: ${duration}ms`);
      logger.info("✅ ========== askDeepSeek COMPLETADO ==========");

      return {
        success: true,
        content: content,
        quotas: updatedQuotas,
        tokensUsed: tokensUsed,
      };
    } catch (error) {
      logger.error("❌ Error en askDeepSeek:", error);

      // Intentar registrar el error
      const userId = request.auth?.uid;
      if (userId) {
        try {
          await logAIUsage(
            userId,
            request.data?.query || "unknown",
            0,
            false
          );
        } catch (logError) {
          logger.error("Error registrando uso fallido:", logError);
        }
      }

      return {
        success: false,
        error: error.message || "Error interno del servidor",
        fallbackUsed: false,
      };
    }
  }
);

