import {
  Clock,
  Filter,
  LogOut,
  Plus,
  Settings as SettingsIcon,
  Table as TableIcon,
  Target,
  X,
} from "lucide-react";

const MobileMenu = ({
  visible,
  darkMode,
  textClass,
  onClose,
  onNavigateHome,
  onOpenAddExpense,
  onShowCategories,
  onShowBudgets,
  onShowRecurring,
  onShowSettings,
  onLogout,
}) => {
  if (!visible) {
    return null;
  }

  const panelClasses = darkMode ? "bg-gray-800" : "bg-white";
  const buttonBase = darkMode
    ? "bg-gray-700 hover:bg-gray-600"
    : "bg-purple-50 hover:bg-purple-100";

  const handleAction = (action) => {
    action();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div
        className={`absolute right-0 top-0 h-full w-80 ${panelClasses} shadow-2xl p-6 overflow-y-auto`}
      >
        <div className="flex justify-between items-center mb-8">
          <h3 className={`text-2xl font-bold ${textClass}`}>Menú</h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${
              darkMode ? "hover:bg-gray-700" : "hover:bg-purple-100"
            } transition-all`}
          >
            <X className={`w-6 h-6 ${textClass}`} />
          </button>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handleAction(onNavigateHome)}
            className={`w-full flex items-center gap-3 p-4 rounded-xl ${buttonBase} transition-all`}
          >
            <TableIcon
              className={`w-5 h-5 ${
                darkMode ? "text-purple-400" : "text-purple-600"
              }`}
            />
            <span className={`font-medium ${textClass}`}>Inicio</span>
          </button>

          <button
            onClick={() => handleAction(onOpenAddExpense)}
            className={`w-full flex items-center gap-3 p-4 rounded-xl ${buttonBase} transition-all`}
          >
            <Plus
              className={`w-5 h-5 ${
                darkMode ? "text-purple-400" : "text-purple-600"
              }`}
            />
            <span className={`font-medium ${textClass}`}>Añadir Gasto</span>
          </button>

          <div
            className={`h-px ${darkMode ? "bg-gray-700" : "bg-gray-200"} my-2`}
          ></div>

          <button
            onClick={() => handleAction(onShowCategories)}
            className={`w-full flex items-center gap-3 p-4 rounded-xl ${buttonBase} transition-all`}
          >
            <Filter
              className={`w-5 h-5 ${
                darkMode ? "text-purple-400" : "text-purple-600"
              }`}
            />
            <span className={`font-medium ${textClass}`}>Categorías</span>
          </button>

          <button
            onClick={() => handleAction(onShowBudgets)}
            className={`w-full flex items-center gap-3 p-4 rounded-xl ${buttonBase} transition-all`}
          >
            <Target
              className={`w-5 h-5 ${
                darkMode ? "text-purple-400" : "text-purple-600"
              }`}
            />
            <span className={`font-medium ${textClass}`}>Presupuestos</span>
          </button>

          <button
            onClick={() => handleAction(onShowRecurring)}
            className={`w-full flex items-center gap-3 p-4 rounded-xl ${buttonBase} transition-all`}
          >
            <Clock
              className={`w-5 h-5 ${
                darkMode ? "text-purple-400" : "text-purple-600"
              }`}
            />
            <span className={`font-medium ${textClass}`}>
              Gastos Recurrentes
            </span>
          </button>

          <div
            className={`h-px ${darkMode ? "bg-gray-700" : "bg-gray-200"} my-2`}
          ></div>

          <button
            onClick={() => handleAction(onShowSettings)}
            className={`w-full flex items-center gap-3 p-4 rounded-xl ${buttonBase} transition-all`}
          >
            <SettingsIcon
              className={`w-5 h-5 ${
                darkMode ? "text-purple-400" : "text-purple-600"
              }`}
            />
            <span className={`font-medium ${textClass}`}>Ajustes</span>
          </button>

          <button
            onClick={() => handleAction(onLogout)}
            className={`w-full flex items-center gap-3 p-4 rounded-xl ${
              darkMode
                ? "bg-red-900/50 hover:bg-red-900"
                : "bg-red-50 hover:bg-red-100"
            } transition-all`}
          >
            <LogOut className="w-5 h-5 text-red-600" />
            <span
              className={`font-medium ${
                darkMode ? "text-red-400" : "text-red-600"
              }`}
            >
              Cerrar Sesión
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
