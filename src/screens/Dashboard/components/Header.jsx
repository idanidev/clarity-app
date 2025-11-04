import {
  BellRing,
  ChevronDown,
  LogOut,
  Menu as MenuIcon,
  Settings as SettingsIcon,
} from "lucide-react";

const Header = ({
  darkMode,
  textClass,
  textSecondaryClass,
  userEmail,
  showAddExpense,
  showBudgets,
  showCategories,
  showSettings,
  showRecurring,
  showManagement,
  overBudgetCount,
  onSelectHome,
  onOpenAddExpense,
  onToggleManagement,
  onSelectCategories,
  onSelectBudgets,
  onSelectRecurring,
  onOpenSettings,
  onLogout,
  onOpenMenu,
}) => {
  const headerClasses = darkMode ? "bg-gray-800/95" : "bg-white/60";
  const borderClasses = darkMode ? "border-gray-700" : "border-white/60";
  const desktopButtonBase = darkMode
    ? "text-gray-300 hover:bg-gray-700"
    : "text-purple-600 hover:bg-white/60";

  return (
    <div
      className={`${headerClasses} backdrop-blur-md border-b ${borderClasses} sticky top-0 z-40`}
    >
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Clarity
            </h1>
            <p className={`text-xs ${textSecondaryClass}`}>{userEmail}</p>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={onSelectHome}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                !showAddExpense &&
                !showBudgets &&
                !showCategories &&
                !showSettings &&
                !showRecurring
                  ? "bg-purple-600 text-white"
                  : desktopButtonBase
              }`}
            >
              Inicio
            </button>

            <button
              onClick={onOpenAddExpense}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                showAddExpense ? "bg-purple-600 text-white" : desktopButtonBase
              }`}
            >
              Gastos
            </button>

            <div className="relative">
              <button
                onClick={onToggleManagement}
                className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  showBudgets || showCategories || showRecurring
                    ? "bg-purple-600 text-white"
                    : desktopButtonBase
                }`}
              >
                Gestión
                <ChevronDown className="w-4 h-4" />
              </button>

              {showManagement && (
                <div
                  className={`absolute top-full mt-2 right-0 ${
                    darkMode ? "bg-gray-800" : "bg-white"
                  } rounded-xl shadow-2xl border ${
                    darkMode ? "border-gray-700" : "border-purple-100"
                  } py-2 min-w-[200px] z-50`}
                >
                  <button
                    onClick={onSelectCategories}
                    className={`w-full px-4 py-2 text-left hover:bg-purple-50 ${
                      darkMode ? "hover:bg-gray-700" : ""
                    } transition-all ${textClass} font-medium`}
                  >
                    Categorías
                  </button>
                  <button
                    onClick={onSelectBudgets}
                    className={`w-full px-4 py-2 text-left hover:bg-purple-50 ${
                      darkMode ? "hover:bg-gray-700" : ""
                    } transition-all ${textClass} font-medium`}
                  >
                    Presupuestos
                  </button>
                  <button
                    onClick={onSelectRecurring}
                    className={`w-full px-4 py-2 text-left hover:bg-purple-50 ${
                      darkMode ? "hover:bg-gray-700" : ""
                    } transition-all ${textClass} font-medium`}
                  >
                    Gastos Recurrentes
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={onOpenSettings}
              className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                showSettings ? "bg-purple-600 text-white" : desktopButtonBase
              }`}
            >
              <SettingsIcon className="w-4 h-4" />
              Ajustes
            </button>

            <button
              onClick={onLogout}
              className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                darkMode
                  ? "text-red-400 hover:bg-gray-700"
                  : "text-red-600 hover:bg-red-50"
              }`}
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>

          <div className="md:hidden flex items-center gap-3">
            {overBudgetCount > 0 && (
              <button
                onClick={onSelectBudgets}
                className="relative p-2 rounded-xl bg-red-100 hover:bg-red-200 border border-red-200 transition-all"
                title="Presupuesto superado"
              >
                <BellRing className="w-6 h-6 text-red-600" />
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {overBudgetCount}
                </span>
              </button>
            )}
            <button
              onClick={onOpenMenu}
              className={`p-2 rounded-xl ${
                darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-white/60 hover:bg-white/80"
              } border ${darkMode ? "border-gray-600" : "border-white/60"} transition-all`}
            >
              <MenuIcon
                className={`w-6 h-6 ${
                  darkMode ? "text-purple-400" : "text-purple-600"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
