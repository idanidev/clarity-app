import { useState } from "react";
import { X, Plus, Target, BarChart3, Calendar, Bell, Sparkles, ArrowRight, ArrowLeft } from "lucide-react";
import { useDisableBodyScroll } from "../../../hooks/useDisableBodyScroll";

const OnboardingModal = ({ visible, darkMode, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  // Deshabilitar scroll del body cuando el modal está abierto
  useDisableBodyScroll(visible);

  if (!visible) {
    return null;
  }

  const cardClass = darkMode
    ? "bg-gray-800/95 border-gray-700 text-white"
    : "bg-white/95 border-purple-200 text-gray-900";
  const textClass = darkMode ? "text-white" : "text-gray-900";
  const textSecondaryClass = darkMode ? "text-gray-400" : "text-gray-600";
  const buttonClass = darkMode
    ? "bg-purple-600 hover:bg-purple-700 text-white"
    : "bg-purple-600 hover:bg-purple-700 text-white";

  const steps = [
    {
      icon: Sparkles,
      title: "¡Bienvenido a Clarity! 👋",
      description: "Tu gestor de gastos personal. Te guiaremos en los primeros pasos para que empieces a controlar tus finanzas.",
      content: (
        <div className="space-y-4">
          <p className={textSecondaryClass}>
            Clarity te ayuda a:
          </p>
          <ul className={`space-y-2 ${textSecondaryClass} list-disc list-inside`}>
            <li>Registrar y organizar tus gastos</li>
            <li>Establecer presupuestos por categoría</li>
            <li>Visualizar tus gastos con gráficos</li>
            <li>Alcanzar tus objetivos de ahorro</li>
          </ul>
        </div>
      ),
    },
    {
      icon: Plus,
      title: "1️⃣ Añade tu primer gasto",
      description: "Empieza registrando tus gastos diarios. Puedes añadir nombre, cantidad, categoría y método de pago.",
      content: (
        <div className="space-y-4">
          <div className={`p-4 rounded-xl ${darkMode ? "bg-purple-900/30" : "bg-purple-50"} border ${darkMode ? "border-purple-700" : "border-purple-200"}`}>
            <p className={`font-semibold ${textClass} mb-2`}>💡 Consejo:</p>
            <p className={textSecondaryClass}>
              Haz clic en el botón <span className="font-semibold text-purple-600">"+ Añadir Gasto"</span> en la parte superior para empezar.
            </p>
          </div>
          <div className={`p-4 rounded-xl ${darkMode ? "bg-blue-900/30" : "bg-blue-50"} border ${darkMode ? "border-blue-700" : "border-blue-200"}`}>
            <p className={`font-semibold ${textClass} mb-2`}>📝 Tip:</p>
            <p className={textSecondaryClass}>
              Puedes crear categorías personalizadas mientras añades gastos. ¡Organiza tus gastos como prefieras!
            </p>
          </div>
        </div>
      ),
    },
    {
      icon: Target,
      title: "2️⃣ Establece tus objetivos",
      description: "Define tus ingresos mensuales y objetivos de ahorro para que Clarity te ayude a alcanzarlos.",
      content: (
        <div className="space-y-4">
          <div className={`p-4 rounded-xl ${darkMode ? "bg-green-900/30" : "bg-green-50"} border ${darkMode ? "border-green-700" : "border-green-200"}`}>
            <p className={`font-semibold ${textClass} mb-2`}>💰 Ingresos:</p>
            <p className={textSecondaryClass}>
              Ve a <span className="font-semibold">Ajustes → General</span> y establece tus ingresos mensuales.
            </p>
          </div>
          <div className={`p-4 rounded-xl ${darkMode ? "bg-purple-900/30" : "bg-purple-50"} border ${darkMode ? "border-purple-700" : "border-purple-200"}`}>
            <p className={`font-semibold ${textClass} mb-2`}>🎯 Objetivos:</p>
            <p className={textSecondaryClass}>
              En la vista <span className="font-semibold">"Objetivos"</span> puedes establecer cuánto quieres ahorrar este mes.
            </p>
          </div>
        </div>
      ),
    },
    {
      icon: Calendar,
      title: "3️⃣ Explora las vistas",
      description: "Clarity ofrece diferentes formas de visualizar tus gastos: tabla, gráficos y más.",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className={`p-3 rounded-xl ${darkMode ? "bg-gray-700/50" : "bg-gray-50"} border ${darkMode ? "border-gray-600" : "border-gray-200"}`}>
              <p className={`font-semibold ${textClass} text-sm mb-1`}>📋 Tabla</p>
              <p className={`text-xs ${textSecondaryClass}`}>Vista detallada de todos tus gastos</p>
            </div>
            <div className={`p-3 rounded-xl ${darkMode ? "bg-gray-700/50" : "bg-gray-50"} border ${darkMode ? "border-gray-600" : "border-gray-200"}`}>
              <p className={`font-semibold ${textClass} text-sm mb-1`}>📊 Gráficos</p>
              <p className={`text-xs ${textSecondaryClass}`}>Visualiza tus gastos por categoría</p>
            </div>
            <div className={`p-3 rounded-xl ${darkMode ? "bg-gray-700/50" : "bg-gray-50"} border ${darkMode ? "border-gray-600" : "border-gray-200"}`}>
              <p className={`font-semibold ${textClass} text-sm mb-1`}>🎯 Objetivos</p>
              <p className={`text-xs ${textSecondaryClass}`}>Sigue tu progreso de ahorro</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      icon: Bell,
      title: "4️⃣ Configura notificaciones",
      description: "Activa recordatorios para no olvidar registrar tus gastos y mantener tus finanzas al día.",
      content: (
        <div className="space-y-4">
          <div className={`p-4 rounded-xl ${darkMode ? "bg-blue-900/30" : "bg-blue-50"} border ${darkMode ? "border-blue-700" : "border-blue-200"}`}>
            <p className={`font-semibold ${textClass} mb-2`}>🔔 Recordatorios:</p>
            <p className={textSecondaryClass}>
              Ve a <span className="font-semibold">Ajustes → Notificaciones</span> y activa los recordatorios que prefieras.
            </p>
          </div>
          <div className={`p-4 rounded-xl ${darkMode ? "bg-purple-900/30" : "bg-purple-50"} border ${darkMode ? "border-purple-700" : "border-purple-200"}`}>
            <p className={`font-semibold ${textClass} mb-2`}>📱 Push Notifications:</p>
            <p className={textSecondaryClass}>
              Activa las notificaciones push para recibir recordatorios incluso cuando la app está cerrada.
            </p>
          </div>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    }
    onClose();
  };

  const handleSkip = () => {
    handleComplete();
  };

  const currentStepData = steps[currentStep];
  const IconComponent = currentStepData.icon;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start sm:items-center justify-center z-[100] px-3 py-4 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`${cardClass} rounded-2xl p-0 max-w-2xl w-full border shadow-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`sticky top-0 z-10 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 ${
            darkMode
              ? "bg-gray-800/95 border-b border-gray-700"
              : "bg-white/80 border-b border-purple-100"
          } backdrop-blur`}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={`p-2 rounded-xl ${darkMode ? "bg-purple-600/20" : "bg-purple-100"}`}>
              <IconComponent className={`w-5 h-5 sm:w-6 sm:h-6 ${darkMode ? "text-purple-400" : "text-purple-600"}`} />
            </div>
            <div>
              <h3 className={`text-lg sm:text-xl font-bold ${textClass}`}>{currentStepData.title}</h3>
              <p className={`text-[11px] sm:text-xs ${textSecondaryClass}`}>
                Paso {currentStep + 1} de {steps.length}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleSkip}
              className={`px-3 py-1.5 rounded-lg text-sm ${darkMode ? "hover:bg-gray-700" : "hover:bg-purple-100"} transition-all ${textSecondaryClass}`}
            >
              Omitir
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${darkMode ? "hover:bg-gray-700" : "hover:bg-purple-100"} transition-all`}
            >
              <X className={`w-5 h-5 ${textClass}`} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-6 py-5 sm:py-6">
          <p className={`text-sm sm:text-base mb-4 sm:mb-6 ${textSecondaryClass}`}>
            {currentStepData.description}
          </p>
          <div className="mb-6">
            {currentStepData.content}
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className={`h-2 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}>
              <div
                className="h-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`sticky bottom-0 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 ${
            darkMode
              ? "bg-gray-800/95 border-t border-gray-700"
              : "bg-white/80 border-t border-purple-100"
          } backdrop-blur`}
        >
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all text-sm sm:text-base ${
              currentStep === 0
                ? "opacity-50 cursor-not-allowed"
                : darkMode
                ? "hover:bg-gray-700"
                : "hover:bg-purple-100"
            } ${textClass}`}
          >
            <ArrowLeft className="w-4 h-4" />
            Anterior
          </button>

          <div className="flex justify-center gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentStep
                    ? "bg-purple-600 w-6"
                    : darkMode
                    ? "bg-gray-600"
                    : "bg-gray-300"
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className={`px-6 py-2 rounded-lg flex items-center justify-center gap-2 ${buttonClass} font-semibold transition-all shadow-lg hover:shadow-xl text-sm sm:text-base`}
          >
            {currentStep === steps.length - 1 ? "¡Empezar!" : "Siguiente"}
            {currentStep < steps.length - 1 && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;

