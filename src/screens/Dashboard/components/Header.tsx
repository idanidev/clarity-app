import { memo } from "react";
import {
  BellRing,
  ChevronDown,
  DollarSign,
  Download,
  Lightbulb,
  LogOut,
  Menu as MenuIcon,
  Repeat,
  Settings as SettingsIcon,
  Target,
  WifiOff,
  FolderOpen,
} from "@/components/icons";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "../../../contexts/LanguageContext";

interface HeaderProps {
  darkMode: boolean;
  textClass: string;
  textSecondaryClass: string;
  userEmail: string;
  showCategories: boolean;
  showSettings: boolean;
  showRecurring: boolean;
  showManagement: boolean;
  overBudgetCount: number;
  isOnline: boolean;
  onToggleManagement: () => void;
  onSelectCategories: () => void;
  onSelectGoals: () => void;
  onSelectRecurring: () => void;
  onOpenSettings: () => void;
  onOpenTips: () => void;
  onExportCSV: () => void;
  onLogout: () => void;
  onOpenMenu: () => void;
}

const Header = memo<HeaderProps>(({
  darkMode,
  textClass,
  textSecondaryClass,
  userEmail,
  showCategories,
  showSettings,
  showRecurring,
  showManagement,
  overBudgetCount,
  isOnline,
  onToggleManagement,
  onSelectCategories,
  onSelectGoals,
  onSelectRecurring,
  onOpenSettings,
  onOpenTips,
  onExportCSV,
  onLogout,
  onOpenMenu,
}) => {
  const { t } = useTranslation();
  const headerClasses = darkMode ? "bg-gray-800/95" : "bg-white/60";
  const borderClasses = darkMode ? "border-gray-700" : "border-white/60";
  const desktopButtonBase = darkMode
    ? "text-gray-300 hover:bg-gray-700"
    : "text-purple-600 hover:bg-white/60";

  return (
    <div
      className={`${headerClasses} backdrop-blur-md border-b ${borderClasses} sticky top-0 z-40`}
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
        marginTop: 0,
        top: 0,
        backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.95)' : undefined,
      }}
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-4">
        <div className="flex justify-between items-center gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent truncate">
              Clarity
            </h1>
            <div className="flex items-center gap-2 min-w-0">
              <p className={`text-[10px] sm:text-xs ${textSecondaryClass} truncate`}>{userEmail}</p>
              {!isOnline && (
                <div className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs flex items-center gap-1">
                  <WifiOff className="w-3 h-3" />
                  Offline
                </div>
              )}
            </div>
          </div>

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-4">
            {/* Alertas de presupuesto */}
            {overBudgetCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="relative"
              >
                <button
                  onClick={onSelectGoals}
                  className={`p-2 rounded-xl transition-colors ${
                    darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                  }`}
                >
                  <BellRing className="w-5 h-5 text-red-500" />
                </button>
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {overBudgetCount}
                </span>
              </motion.div>
            )}

            {/* Menú desplegable */}
            <div className="relative">
              <button
                onClick={onToggleManagement}
                className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  showCategories || showRecurring
                    ? "bg-purple-600 text-white"
                    : desktopButtonBase
                }`}
              >
                {t("dashboard.manage")}
                <ChevronDown className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {showManagement && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`absolute right-0 top-full mt-2 w-56 ${
                      darkMode ? 'bg-gray-800' : 'bg-white'
                    } rounded-xl shadow-xl border ${
                      darkMode ? 'border-gray-700' : 'border-gray-200'
                    } overflow-hidden z-50`}
                  >
                    <button
                      onClick={onSelectCategories}
                      className={`w-full flex items-center gap-3 px-4 py-3 ${
                        darkMode ? 'hover:bg-gray-750' : 'hover:bg-gray-50'
                      } transition-colors`}
                    >
                      <FolderOpen className="w-5 h-5 text-purple-500" />
                      <span className={textClass}>Categorías</span>
                    </button>

                    <button
                      onClick={onSelectGoals}
                      className={`w-full flex items-center gap-3 px-4 py-3 ${
                        darkMode ? 'hover:bg-gray-750' : 'hover:bg-gray-50'
                      } transition-colors`}
                    >
                      <DollarSign className="w-5 h-5 text-green-500" />
                      <span className={textClass}>Ingresos y Objetivos</span>
                    </button>

                    <button
                      onClick={onSelectRecurring}
                      className={`w-full flex items-center gap-3 px-4 py-3 ${
                        darkMode ? 'hover:bg-gray-750' : 'hover:bg-gray-50'
                      } transition-colors`}
                    >
                      <Repeat className="w-5 h-5 text-blue-500" />
                      <span className={textClass}>Gastos Recurrentes</span>
                    </button>

                    <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />

                    <button
                      onClick={onOpenTips}
                      className={`w-full flex items-center gap-3 px-4 py-3 ${
                        darkMode ? 'hover:bg-gray-750' : 'hover:bg-gray-50'
                      } transition-colors`}
                    >
                      <Lightbulb className="w-5 h-5 text-yellow-500" />
                      <span className={textClass}>Consejos</span>
                    </button>

                    <button
                      onClick={onExportCSV}
                      className={`w-full flex items-center gap-3 px-4 py-3 ${
                        darkMode ? 'hover:bg-gray-750' : 'hover:bg-gray-50'
                      } transition-colors`}
                    >
                      <Download className="w-5 h-5 text-indigo-500" />
                      <span className={textClass}>Exportar CSV</span>
                    </button>

                    <button
                      onClick={onOpenSettings}
                      className={`w-full flex items-center gap-3 px-4 py-3 ${
                        darkMode ? 'hover:bg-gray-750' : 'hover:bg-gray-50'
                      } transition-colors`}
                    >
                      <SettingsIcon className="w-5 h-5 text-gray-500" />
                      <span className={textClass}>Configuración</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={onSelectGoals}
              className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${desktopButtonBase}`}
            >
              <Target className="w-4 h-4" />
              {t("views.goals")}
            </button>

            <button
              onClick={onOpenSettings}
              className={`p-2.5 rounded-xl font-medium transition-all ${
                showSettings ? "bg-purple-600 text-white" : desktopButtonBase
              }`}
              title={t("dashboard.settings")}
            >
              <SettingsIcon className="w-5 h-5" />
            </button>

            <button
              onClick={onLogout}
              className={`p-2.5 rounded-xl font-medium transition-all ${
                darkMode
                  ? "text-red-400 hover:bg-gray-700"
                  : "text-red-600 hover:bg-red-50"
              }`}
              title={t("auth.logout")}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile */}
          <div className="md:hidden flex items-center gap-2">
            {overBudgetCount > 0 && (
              <button
                onClick={onSelectGoals}
                className="relative p-2 rounded-xl bg-red-100 hover:bg-red-200 border border-red-200 transition-all"
                title={t("budgets.overBudget")}
              >
                <BellRing className="w-5 h-5 text-red-600" />
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
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
                className={`w-5 h-5 ${
                  darkMode ? "text-purple-400" : "text-purple-600"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

Header.displayName = "Header";

export default Header;
