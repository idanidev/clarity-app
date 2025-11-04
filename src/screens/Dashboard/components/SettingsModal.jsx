import { Moon, Sun, X } from "lucide-react";

const SettingsModal = ({
  visible,
  darkMode,
  cardClass,
  textClass,
  textSecondaryClass,
  toggleDarkMode,
  onClose,
}) => {
  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`${cardClass} rounded-2xl p-6 max-w-md w-full border shadow-2xl max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className={`text-2xl font-bold ${textClass}`}>Ajustes</h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${
              darkMode ? "hover:bg-gray-700" : "hover:bg-purple-100"
            } transition-all`}
          >
            <X className={`w-6 h-6 ${textClass}`} />
          </button>
        </div>

        <div className="space-y-6">
          <div
            className={`p-4 rounded-xl ${
              darkMode ? "bg-gray-700" : "bg-purple-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {darkMode ? (
                  <Moon
                    className={`w-5 h-5 ${
                      darkMode ? "text-purple-400" : "text-purple-600"
                    }`}
                  />
                ) : (
                  <Sun
                    className={`w-5 h-5 ${
                      darkMode ? "text-purple-400" : "text-purple-600"
                    }`}
                  />
                )}
                <div>
                  <p className={`font-medium ${textClass}`}>
                    Modo {darkMode ? "Oscuro" : "Claro"}
                  </p>
                  <p className={`text-sm ${textSecondaryClass}`}>
                    Cambia el tema de la aplicación
                  </p>
                </div>
              </div>
              <button
                onClick={toggleDarkMode}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  darkMode ? "bg-purple-600" : "bg-gray-300"
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    darkMode ? "translate-x-7" : ""
                  }`}
                ></div>
              </button>
            </div>
          </div>

          <div
            className={`p-4 rounded-xl ${
              darkMode ? "bg-gray-700" : "bg-purple-50"
            }`}
          >
            <p className={`font-medium ${textClass}`}>Acerca de Clarity</p>
            <p className={`text-sm ${textSecondaryClass}`}>
              Versión 1.0.1 - Gestión de gastos personales
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
