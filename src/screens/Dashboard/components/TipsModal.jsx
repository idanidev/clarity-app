import { BookOpen, CheckCircle, Lightbulb, Target, TrendingUp, X } from "lucide-react";

const TipsModal = ({ visible, darkMode, cardClass, textClass, textSecondaryClass, onClose }) => {
  if (!visible) {
    return null;
  }

  const tips = [
    {
      icon: Target,
      title: "Organiza tus gastos",
      description: "Crea categorías personalizadas con colores para organizar mejor tus gastos y visualizarlos fácilmente.",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      icon: TrendingUp,
      title: "Establece presupuestos",
      description: "Define presupuestos por categoría para controlar tus gastos y recibir alertas cuando los superes.",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      icon: CheckCircle,
      title: "Gastos recurrentes",
      description: "Configura gastos recurrentes para automatizar el seguimiento de suscripciones y pagos mensuales.",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      icon: Lightbulb,
      title: "Revisa tus gráficos",
      description: "Utiliza las diferentes vistas (tabla, gráfico circular, barras) para analizar tus patrones de gasto.",
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      icon: BookOpen,
      title: "Personaliza tu experiencia",
      description: "Ajusta el tema oscuro/claro y personaliza los colores de tus categorías según tus preferencias.",
      color: "text-pink-600",
      bgColor: "bg-pink-100",
    },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onMouseDown={onClose}
    >
      <div
        className={`${cardClass} rounded-2xl p-0 max-w-3xl w-full border shadow-2xl max-h-[90vh] overflow-y-auto`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          className={`sticky top-0 z-10 px-6 py-4 flex justify-between items-center ${
            darkMode
              ? "bg-gray-800/95 border-b border-gray-700"
              : "bg-white/80 border-b border-purple-100"
          } backdrop-blur`}
        >
          <div>
            <h3 className={`text-2xl font-bold ${textClass} flex items-center gap-2`}>
              <Lightbulb className="w-6 h-6 text-amber-500" />
              Consejos y Trucos
            </h3>
            <p className={`text-sm ${textSecondaryClass} mt-1`}>
              Descubre cómo aprovechar al máximo Clarity
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${
              darkMode ? "hover:bg-gray-700" : "hover:bg-purple-100"
            } transition-all`}
          >
            <X className={`w-6 h-6 ${textClass}`} />
          </button>
        </div>

        <div className="px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tips.map((tip, index) => {
            const Icon = tip.icon;
            return (
              <div
                key={index}
                className={`p-5 rounded-xl border ${
                  darkMode ? "bg-gray-700/50 border-gray-600" : "bg-white/50 border-purple-100"
                } transition-all hover:shadow-lg`}
              >
                <div className={`w-12 h-12 rounded-xl ${tip.bgColor} flex items-center justify-center mb-4 ${
                  darkMode ? "opacity-80" : ""
                }`}>
                  <Icon className={`w-6 h-6 ${tip.color}`} />
                </div>
                <h4 className={`text-lg font-semibold ${textClass} mb-2`}>
                  {tip.title}
                </h4>
                <p className={`text-sm ${textSecondaryClass}`}>
                  {tip.description}
                </p>
              </div>
            );
          })}
        </div>

          <div className={`mt-6 p-4 rounded-xl ${
            darkMode ? "bg-blue-900/30 border-blue-800" : "bg-blue-50 border-blue-200"
          } border`}>
            <div className="flex items-start gap-3">
              <Lightbulb className={`w-5 h-5 ${darkMode ? "text-blue-400" : "text-blue-600"} flex-shrink-0 mt-0.5`} />
              <div>
                <p className={`font-semibold ${textClass} mb-1`}>
                  💡 Consejo Pro
                </p>
                <p className={`text-sm ${textSecondaryClass}`}>
                  Revisa tus gastos regularmente y ajusta tus presupuestos según tus necesidades. 
                  La clave del éxito financiero está en el seguimiento constante.
                </p>
              </div>
            </div>
          </div>

          <div className={`mt-4 p-4 rounded-xl ${
            darkMode ? "bg-purple-900/30 border-purple-800" : "bg-purple-50 border-purple-200"
          } border`}>
            <div className="flex items-start gap-3">
              <CheckCircle className={`w-5 h-5 ${darkMode ? "text-purple-400" : "text-purple-600"} flex-shrink-0 mt-0.5`} />
              <div>
                <p className={`font-semibold ${textClass} mb-1`}>
                  🍎 Consejo Pro para iOS
                </p>
                <p className={`text-sm ${textSecondaryClass} mb-2`}>
                  ¿Usas Apple Pay o la cartera NFC? Crea un atajo automático que te recuerde añadir tus gastos a Clarity cada vez que uses el pago contactless.
                </p>
                <p className={`text-xs ${textSecondaryClass} italic`}>
                  Ve a la app Atajos → Automatización → Crear nueva → Cuando se detecta NFC → Añade una notificación &quot;¡No olvides añadir el gasto a Clarity!&quot;
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className={`px-6 pb-6 flex justify-end`}>
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-lg transition-all"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default TipsModal;

