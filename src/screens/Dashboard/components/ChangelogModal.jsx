import {
  CheckCircle,
  LayoutDashboard,
  Palette,
  Smartphone,
  Sparkles,
  X,
} from "lucide-react";

const ChangelogModal = ({ visible, darkMode, cardClass, textClass, textSecondaryClass, onClose }) => {
  if (!visible) {
    return null;
  }

  const changes = [
    {
      icon: Smartphone,
      title: "Navegación móvil optimizada",
      description:
        "Los botones flotantes ahora te llevan al inicio automáticamente y el menú móvil se simplificó para centrarse en la gestión de categorías, presupuestos y consejos.",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      icon: LayoutDashboard,
      title: "Acciones de escritorio más limpias",
      description:
        "El encabezado en ordenador elimina accesos redundantes y mantiene el foco en la gestión, consejos, exportaciones y ajustes con una interfaz más ligera.",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      icon: Palette,
      title: "Colores personalizados para categorías",
      description:
        "Elige y personaliza el color de cada categoría. Los colores se reflejan en gráficos y en la tabla principal.",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      icon: Sparkles,
      title: "Edición de categorías",
      description:
        "Edita nombre y color de tus categorías existentes y aplica los cambios automáticamente a tus gastos relacionados.",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      icon: CheckCircle,
      title: "Menú de consejos",
      description:
        "Descubre recomendaciones prácticas y un consejo Pro para iOS para no olvidar registrar tus gastos.",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onMouseDown={onClose}
    >
      <div
        className={`${cardClass} rounded-2xl p-0 max-w-2xl w-full border shadow-2xl max-h-[90vh] overflow-y-auto`}
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
              <Sparkles className="w-6 h-6 text-amber-500" />
              ¡Nuevas Funcionalidades!
            </h3>
            <p className={`text-sm ${textSecondaryClass} mt-1`}>
              Descubre las últimas mejoras en Clarity
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
          <div className="space-y-4 mb-6">
          {changes.map((change, index) => {
            const Icon = change.icon;
            return (
              <div
                key={index}
                className={`p-4 rounded-xl border ${
                  darkMode ? "bg-gray-700/50 border-gray-600" : "bg-white/50 border-purple-100"
                } transition-all`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl ${change.bgColor} flex items-center justify-center flex-shrink-0 ${
                    darkMode ? "opacity-80" : ""
                  }`}>
                    <Icon className={`w-5 h-5 ${change.color}`} />
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-lg font-semibold ${textClass} mb-2`}>
                      {change.title}
                    </h4>
                    <p className={`text-sm ${textSecondaryClass}`}>
                      {change.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          </div>

          <div className={`p-4 rounded-xl ${
            darkMode ? "bg-green-900/30 border-green-800" : "bg-green-50 border-green-200"
          } border flex items-start gap-3 mb-6`}>
            <CheckCircle className={`w-5 h-5 ${darkMode ? "text-green-400" : "text-green-600"} flex-shrink-0 mt-0.5`} />
            <div>
              <p className={`font-semibold ${textClass} mb-1`}>
                ¿Tienes sugerencias?
              </p>
              <p className={`text-sm ${textSecondaryClass}`}>
                Tu opinión es importante para nosotros. Si tienes ideas para mejorar Clarity, 
                no dudes en contactarnos.
              </p>
            </div>
          </div>
        </div>

        <div className={`px-6 pb-6 flex justify-end`}>
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-lg transition-all"
          >
            ¡Genial, gracias!
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangelogModal;

