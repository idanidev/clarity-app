import { memo, useMemo } from "react";
import {
  AlertTriangle,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Clock,
  Filter,
  Pencil,
  Plus,
  Table as TableIcon,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { getCategoryColor } from "../../../services/firestoreService";
import { useTranslation } from "../../../contexts/LanguageContext";

const MainContent = memo(({
  cardClass,
  textClass,
  textSecondaryClass,
  darkMode,
  totalExpenses,
  filteredExpenses,
  showFilters,
  onToggleFilters,
  selectedMonth,
  onMonthChange,
  selectedCategory,
  onCategoryChange,
  categories,
  activeView,
  onChangeView,
  expensesByCategory,
  expandedCategories,
  onToggleCategory,
  onAddExpenseClick,
  onEditExpense,
  onRequestDelete,
  categoryTotals,
  budgets,
  recentExpenses,
  recurringExpenses = [],
}) => {
  const { t } = useTranslation();
  
  // Calcular promedio diario del mes actual
  const averageDaily = useMemo(() => {
    if (filteredExpenses.length === 0 || !selectedMonth) return 0;
    try {
      const [year, month] = selectedMonth.split("-").map(Number);
      if (!year || !month) return 0;
      const daysInMonth = new Date(year, month, 0).getDate();
      const today = new Date();
      const isCurrentMonth = 
        today.getFullYear() === year && 
        (today.getMonth() + 1) === month;
      const daysPassed = isCurrentMonth 
        ? Math.min(today.getDate(), daysInMonth)
        : daysInMonth;
      return daysPassed > 0 ? totalExpenses / daysPassed : 0;
    } catch (error) {
      console.error("Error calculating average:", error);
      return 0;
    }
  }, [totalExpenses, selectedMonth, filteredExpenses.length]);

  const frequencyLabels = useMemo(
    () => ({
      monthly: t("recurring.frequencyMonthly"),
      quarterly: t("recurring.frequencyQuarterly"),
      semiannual: t("recurring.frequencySemiannual"),
      annual: t("recurring.frequencyAnnual"),
    }),
    [t]
  );

  const recurringFrequencyMap = useMemo(() => {
    return (recurringExpenses || []).reduce((acc, recurring) => {
      if (recurring?.id) {
        acc[recurring.id] = recurring.frequency || "monthly";
      }
      return acc;
    }, {});
  }, [recurringExpenses]);

  return (
    <div className="max-w-7xl mx-auto px-2 md:px-4 py-6 pb-32 md:pb-6">
      {/* Estadísticas con estilo Liquid Glass mejorado - Compactas en móvil */}
      <div className="relative mb-4 md:mb-6">
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          <div
            className={`rounded-xl md:rounded-2xl p-2.5 md:p-5 border backdrop-blur-xl transition-all md:hover:scale-[1.02] ${
              darkMode
                ? "bg-gray-800/50 border-gray-700/40"
                : "bg-white/60 border-white/40"
            }`}
            style={{
              boxShadow: darkMode
                ? "0 4px 20px 0 rgba(0, 0, 0, 0.25), 0 0 0 0.5px rgba(255, 255, 255, 0.05) inset"
                : "0 4px 20px 0 rgba(31, 38, 135, 0.1), 0 0 0 0.5px rgba(255, 255, 255, 0.6) inset",
              backdropFilter: "blur(16px) saturate(180%)",
              WebkitBackdropFilter: "blur(16px) saturate(180%)",
            }}
          >
            <div className="flex flex-col items-center text-center">
              <div
                className={`p-1.5 md:p-2.5 rounded-lg md:rounded-xl mb-1.5 md:mb-3 ${
                  darkMode ? "bg-purple-600/20" : "bg-purple-100/50"
                }`}
              >
                <Target className={`w-3.5 h-3.5 md:w-5 md:h-5 ${textSecondaryClass}`} />
              </div>
              <span className={`text-[10px] md:text-xs font-semibold mb-0.5 md:mb-1.5 uppercase tracking-wide ${textSecondaryClass}`}>
                {t("common.total")}
              </span>
              <p className={`text-sm md:text-2xl lg:text-3xl font-bold ${textClass} leading-tight`}>
                €{totalExpenses.toFixed(2)}
              </p>
            </div>
          </div>

          <div
            className={`rounded-xl md:rounded-2xl p-2.5 md:p-5 border backdrop-blur-xl transition-all md:hover:scale-[1.02] ${
              darkMode
                ? "bg-gray-800/50 border-gray-700/40"
                : "bg-white/60 border-white/40"
            }`}
            style={{
              boxShadow: darkMode
                ? "0 4px 20px 0 rgba(0, 0, 0, 0.25), 0 0 0 0.5px rgba(255, 255, 255, 0.05) inset"
                : "0 4px 20px 0 rgba(31, 38, 135, 0.1), 0 0 0 0.5px rgba(255, 255, 255, 0.6) inset",
              backdropFilter: "blur(16px) saturate(180%)",
              WebkitBackdropFilter: "blur(16px) saturate(180%)",
            }}
          >
            <div className="flex flex-col items-center text-center">
              <div
                className={`p-1.5 md:p-2.5 rounded-lg md:rounded-xl mb-1.5 md:mb-3 ${
                  darkMode ? "bg-blue-600/20" : "bg-blue-100/50"
                }`}
              >
                <BarChart3 className={`w-3.5 h-3.5 md:w-5 md:h-5 ${textSecondaryClass}`} />
              </div>
              <span className={`text-[10px] md:text-xs font-semibold mb-0.5 md:mb-1.5 uppercase tracking-wide ${textSecondaryClass}`}>
                {t("common.expenses")}
              </span>
              <p className={`text-sm md:text-2xl lg:text-3xl font-bold ${textClass} leading-tight`}>
                {filteredExpenses.length}
              </p>
            </div>
          </div>

          <div
            className={`rounded-xl md:rounded-2xl p-2.5 md:p-5 border backdrop-blur-xl transition-all md:hover:scale-[1.02] ${
              darkMode
                ? "bg-gray-800/50 border-gray-700/40"
                : "bg-white/60 border-white/40"
            }`}
            style={{
              boxShadow: darkMode
                ? "0 4px 20px 0 rgba(0, 0, 0, 0.25), 0 0 0 0.5px rgba(255, 255, 255, 0.05) inset"
                : "0 4px 20px 0 rgba(31, 38, 135, 0.1), 0 0 0 0.5px rgba(255, 255, 255, 0.6) inset",
              backdropFilter: "blur(16px) saturate(180%)",
              WebkitBackdropFilter: "blur(16px) saturate(180%)",
            }}
          >
            <div className="flex flex-col items-center text-center">
              <div
                className={`p-1.5 md:p-2.5 rounded-lg md:rounded-xl mb-1.5 md:mb-3 ${
                  darkMode ? "bg-pink-600/20" : "bg-pink-100/50"
                }`}
              >
                <Clock className={`w-3.5 h-3.5 md:w-5 md:h-5 ${textSecondaryClass}`} />
              </div>
              <span className={`text-[10px] md:text-xs font-semibold mb-0.5 md:mb-1.5 uppercase tracking-wide ${textSecondaryClass}`}>
                {t("common.average")}
              </span>
              <p className={`text-sm md:text-2xl lg:text-3xl font-bold ${textClass} leading-tight`}>
                €{averageDaily.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        
        {/* Botón de filtrar en móvil - arriba a la derecha */}
        <button
          onClick={onToggleFilters}
          className={`md:hidden absolute -top-2 -right-2 p-3 rounded-full shadow-xl backdrop-blur-xl border transition-all active:scale-95 z-10 ${
            showFilters
              ? darkMode
                ? "bg-purple-600/90 border-purple-500/50 text-white"
                : "bg-purple-600/90 border-purple-400/50 text-white"
              : darkMode
              ? "bg-gray-800/80 backdrop-blur-xl border-gray-700/50 text-gray-300"
              : "bg-white/80 backdrop-blur-xl border-white/60 text-purple-600"
          }`}
        >
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {/* Panel de filtros para móvil */}
      {showFilters && (
        <div className="md:hidden mb-4">
          <div
            className={`mt-2 rounded-2xl border shadow-xl ${
              darkMode
                ? "bg-gray-800/90 border-gray-700/70"
                : "bg-white/90 border-purple-100"
            } backdrop-blur-xl p-4 space-y-4`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className={`w-4 h-4 ${textSecondaryClass}`} />
                <h4 className={`text-sm font-semibold ${textClass}`}>
                  {t("filters.title")}
                </h4>
              </div>
              <button
                onClick={onToggleFilters}
                className={`p-2 rounded-lg ${
                  darkMode ? "hover:bg-gray-700" : "hover:bg-purple-100"
                } transition-all`}
              >
                <X className={`w-4 h-4 ${textSecondaryClass}`} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className={`block text-xs font-medium mb-1 ${textSecondaryClass}`}>
                  {t("filters.month")}
                </label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => onMonthChange(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-sm transition-all ${
                    darkMode
                      ? "bg-gray-800 border-gray-700 text-gray-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40"
                      : "bg-white border-purple-200 text-purple-900 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/40"
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1 ${textSecondaryClass}`}>
                  {t("filters.category")}
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => onCategoryChange(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-sm transition-all ${
                    darkMode
                      ? "bg-gray-800 border-gray-700 text-gray-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40"
                      : "bg-white border-purple-200 text-purple-900 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/40"
                  }`}
                >
                  <option value="all">{t("filters.all")}</option>
                  {Object.keys(categories).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barra superior estilo Liquid Glass para desktop */}
      <div className="hidden md:block mb-6">
        <div
          className={`rounded-3xl border backdrop-blur-2xl p-4 shadow-xl ${
            darkMode
              ? "bg-gray-800/60 border-gray-700/40"
              : "bg-white/60 border-white/40"
          }`}
          style={{
            boxShadow: darkMode
              ? "0 8px 32px 0 rgba(0, 0, 0, 0.3), 0 0 0 0.5px rgba(255, 255, 255, 0.05) inset"
              : "0 8px 32px 0 rgba(31, 38, 135, 0.12), 0 0 0 0.5px rgba(255, 255, 255, 0.6) inset",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
          }}
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Sección izquierda: Filtros integrados */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/50 dark:bg-gray-700/50 border border-white/60 dark:border-gray-600/40">
                <Filter className={`w-4 h-4 ${textSecondaryClass}`} />
                <span className={`text-xs font-medium ${textSecondaryClass}`}>
                  {t("filters.title")}
                </span>
              </div>
              
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => onMonthChange(e.target.value)}
                  className={`flex-1 min-w-[140px] px-3 py-2 rounded-xl border text-sm transition-all ${
                    darkMode
                      ? "bg-gray-700/50 border-gray-600/40 text-gray-100 focus:bg-gray-700 focus:border-purple-500/50"
                      : "bg-white/70 border-white/60 text-purple-900 focus:bg-white focus:border-purple-400"
                  } focus:ring-2 focus:ring-purple-500/20 focus:outline-none`}
                />
                
                <select
                  value={selectedCategory}
                  onChange={(e) => onCategoryChange(e.target.value)}
                  className={`flex-1 min-w-[140px] px-3 py-2 rounded-xl border text-sm transition-all ${
                    darkMode
                      ? "bg-gray-700/50 border-gray-600/40 text-gray-100 focus:bg-gray-700 focus:border-purple-500/50"
                      : "bg-white/70 border-white/60 text-purple-900 focus:bg-white focus:border-purple-400"
                  } focus:ring-2 focus:ring-purple-500/20 focus:outline-none`}
                >
                  <option value="all">{t("filters.all")}</option>
                  {Object.keys(categories).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sección derecha: Botón Añadir Gasto */}
            <button
              onClick={onAddExpenseClick}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-xl transition-all active:scale-95 whitespace-nowrap"
              style={{
                boxShadow: "0 4px 16px rgba(139, 92, 246, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset",
              }}
            >
              <Plus className="w-5 h-5" strokeWidth={2.5} />
              <span>{t("dashboard.addExpense")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pestañas de vistas estilo iOS para desktop */}
      <div className="hidden md:block mb-6">
        <div
          className={`inline-flex gap-1 p-1.5 rounded-2xl border backdrop-blur-xl ${
            darkMode
              ? "bg-gray-800/40 border-gray-700/30"
              : "bg-white/50 border-white/40"
          }`}
          style={{
            boxShadow: darkMode
              ? "0 4px 16px 0 rgba(0, 0, 0, 0.2), 0 0 0 0.5px rgba(255, 255, 255, 0.03) inset"
              : "0 4px 16px 0 rgba(31, 38, 135, 0.1), 0 0 0 0.5px rgba(255, 255, 255, 0.5) inset",
            backdropFilter: "blur(12px) saturate(180%)",
            WebkitBackdropFilter: "blur(12px) saturate(180%)",
          }}
        >
          <button
            onClick={() => onChangeView("table")}
            className={`relative flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
              activeView === "table"
                ? darkMode
                  ? "bg-purple-600/90 text-white shadow-lg"
                  : "bg-white text-purple-600 shadow-md"
                : darkMode
                ? "text-gray-300 hover:text-white hover:bg-gray-700/30"
                : "text-purple-600 hover:text-purple-700 hover:bg-white/50"
            }`}
            style={
              activeView === "table"
                ? {
                    boxShadow: darkMode
                      ? "0 2px 8px rgba(139, 92, 246, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset"
                      : "0 2px 8px rgba(139, 92, 246, 0.2), 0 0 0 1px rgba(139, 92, 246, 0.1) inset",
                  }
                : {}
            }
          >
            <TableIcon className="w-4 h-4" />
            <span>{t("views.table")}</span>
          </button>

          <button
            onClick={() => onChangeView("chart")}
            className={`relative flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
              activeView === "chart"
                ? darkMode
                  ? "bg-purple-600/90 text-white shadow-lg"
                  : "bg-white text-purple-600 shadow-md"
                : darkMode
                ? "text-gray-300 hover:text-white hover:bg-gray-700/30"
                : "text-purple-600 hover:text-purple-700 hover:bg-white/50"
            }`}
            style={
              activeView === "chart"
                ? {
                    boxShadow: darkMode
                      ? "0 2px 8px rgba(139, 92, 246, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset"
                      : "0 2px 8px rgba(139, 92, 246, 0.2), 0 0 0 1px rgba(139, 92, 246, 0.1) inset",
                  }
                : {}
            }
          >
            <BarChart3 className="w-4 h-4" />
            <span>{t("views.chart")}</span>
          </button>

          <button
            onClick={() => onChangeView("recent")}
            className={`relative flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
              activeView === "recent"
                ? darkMode
                  ? "bg-purple-600/90 text-white shadow-lg"
                  : "bg-white text-purple-600 shadow-md"
                : darkMode
                ? "text-gray-300 hover:text-white hover:bg-gray-700/30"
                : "text-purple-600 hover:text-purple-700 hover:bg-white/50"
            }`}
            style={
              activeView === "recent"
                ? {
                    boxShadow: darkMode
                      ? "0 2px 8px rgba(139, 92, 246, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset"
                      : "0 2px 8px rgba(139, 92, 246, 0.2), 0 0 0 1px rgba(139, 92, 246, 0.1) inset",
                  }
                : {}
            }
          >
            <Clock className="w-4 h-4" />
            <span>{t("views.recent")}</span>
          </button>

          <button
            onClick={() => onChangeView("budgets")}
            className={`relative flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
              activeView === "budgets"
                ? darkMode
                  ? "bg-purple-600/90 text-white shadow-lg"
                  : "bg-white text-purple-600 shadow-md"
                : darkMode
                ? "text-gray-300 hover:text-white hover:bg-gray-700/30"
                : "text-purple-600 hover:text-purple-700 hover:bg-white/50"
            }`}
            style={
              activeView === "budgets"
                ? {
                    boxShadow: darkMode
                      ? "0 2px 8px rgba(139, 92, 246, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset"
                      : "0 2px 8px rgba(139, 92, 246, 0.2), 0 0 0 1px rgba(139, 92, 246, 0.1) inset",
                  }
                : {}
            }
          >
            <Target className="w-4 h-4" />
            <span>{t("views.budgets")}</span>
          </button>
        </div>
      </div>

      {/* Barra inferior flotante estilo Liquid Glass para móvil */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pb-6 pt-3 pointer-events-none safe-area-inset-bottom">
        <div
          className={`max-w-md mx-auto rounded-3xl shadow-2xl border backdrop-blur-2xl pointer-events-auto ${
            darkMode
              ? "bg-gray-900/75 border-gray-700/40"
              : "bg-white/75 border-white/30"
          }`}
          style={{
            boxShadow: darkMode
              ? "0 8px 32px 0 rgba(0, 0, 0, 0.37), 0 0 0 0.5px rgba(255, 255, 255, 0.05) inset"
              : "0 8px 32px 0 rgba(31, 38, 135, 0.15), 0 0 0 0.5px rgba(255, 255, 255, 0.7) inset",
            backdropFilter: "blur(40px) saturate(180%)",
            WebkitBackdropFilter: "blur(40px) saturate(180%)",
          }}
        >
          <div className="grid grid-cols-4 gap-1 p-2">
            <button
              onClick={() => {
                onChangeView("table");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`flex flex-col items-center justify-center gap-1.5 px-2 py-3 rounded-2xl font-medium transition-all relative ${
                activeView === "table"
                  ? darkMode
                    ? "bg-purple-600/90 text-white shadow-lg"
                    : "bg-purple-600/90 text-white shadow-lg"
                  : darkMode
                  ? "text-gray-300 hover:bg-gray-800/50"
                  : "text-purple-600 hover:bg-white/50"
              }`}
            >
              <TableIcon className="w-5 h-5" />
              <span className="text-xs font-semibold">{t("views.table")}</span>
              {activeView === "table" && (
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-white"></div>
              )}
            </button>

            <button
              onClick={() => {
                onChangeView("chart");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`flex flex-col items-center justify-center gap-1.5 px-2 py-3 rounded-2xl font-medium transition-all relative ${
                activeView === "chart"
                  ? darkMode
                    ? "bg-purple-600/90 text-white shadow-lg"
                    : "bg-purple-600/90 text-white shadow-lg"
                  : darkMode
                  ? "text-gray-300 hover:bg-gray-800/50"
                  : "text-purple-600 hover:bg-white/50"
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span className="text-xs font-semibold">{t("views.chart")}</span>
              {activeView === "chart" && (
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-white"></div>
              )}
            </button>

            <button
              onClick={() => {
                onChangeView("recent");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`flex flex-col items-center justify-center gap-1.5 px-2 py-3 rounded-2xl font-medium transition-all relative ${
                activeView === "recent"
                  ? darkMode
                    ? "bg-purple-600/90 text-white shadow-lg"
                    : "bg-purple-600/90 text-white shadow-lg"
                  : darkMode
                  ? "text-gray-300 hover:bg-gray-800/50"
                  : "text-purple-600 hover:bg-white/50"
              }`}
            >
              <Clock className="w-5 h-5" />
              <span className="text-xs font-semibold">{t("views.recent")}</span>
              {activeView === "recent" && (
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-white"></div>
              )}
            </button>

            <button
              onClick={() => {
                onChangeView("budgets");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`flex flex-col items-center justify-center gap-1.5 px-2 py-3 rounded-2xl font-medium transition-all relative ${
                activeView === "budgets"
                  ? darkMode
                    ? "bg-purple-600/90 text-white shadow-lg"
                    : "bg-purple-600/90 text-white shadow-lg"
                  : darkMode
                  ? "text-gray-300 hover:bg-gray-800/50"
                  : "text-purple-600 hover:bg-white/50"
              }`}
            >
              <Target className="w-5 h-5" />
              <span className="text-xs font-semibold">{t("views.budgets")}</span>
              {activeView === "budgets" && (
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-white"></div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Botón FAB flotante para añadir gasto en móvil */}
      <button
        onClick={onAddExpenseClick}
        className="md:hidden fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-2xl flex items-center justify-center transition-all active:scale-95 hover:scale-105"
        style={{
          boxShadow: "0 8px 24px rgba(139, 92, 246, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.2) inset, 0 2px 8px rgba(0, 0, 0, 0.15)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
      >
        <Plus className="w-6 h-6" strokeWidth={3} />
      </button>

      {activeView === "table" && (
        <div className={`${cardClass} rounded-2xl border shadow-lg overflow-hidden`}>
          {Object.keys(expensesByCategory).length === 0 ? (
            <div className="p-12 text-center">
              <AlertTriangle
                className={`w-16 h-16 ${textSecondaryClass} mx-auto mb-4`}
              />
              <p className={`text-xl font-semibold ${textClass} mb-2`}>
                No hay gastos
              </p>
              <p className={textSecondaryClass}>
                Añade tu primer gasto para comenzar
              </p>
            </div>
          ) : (
            <div className="divide-y divide-purple-100">
              {Object.entries(expensesByCategory).map(
                ([category, subcategories]) => {
                  const categoryTotal = Object.values(subcategories)
                    .flat()
                    .reduce((sum, exp) => sum + exp.amount, 0);
                  const isExpanded = expandedCategories[category];

                  return (
                    <div key={category}>
                      <button
                        onClick={() => onToggleCategory(category)}
                        className={`w-full ${
                          darkMode
                            ? "bg-gray-700/50 hover:bg-gray-700"
                            : "bg-purple-100/80 hover:bg-purple-100"
                        } px-6 py-4 flex justify-between items-center transition-all`}
                      >
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronUp className={`w-5 h-5 ${textSecondaryClass}`} />
                          ) : (
                            <ChevronDown
                              className={`w-5 h-5 ${textSecondaryClass}`}
                            />
                          )}
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: getCategoryColor(categories[category]) }}
                            title={`Color: ${getCategoryColor(categories[category])}`}
                          />
                          <div>
                            <p className={`font-semibold ${textClass}`}>{category}</p>
                            <p className={`text-sm ${textSecondaryClass}`}>
                              €{categoryTotal.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              darkMode
                                ? "bg-gray-800 text-gray-300"
                                : "bg-white text-purple-600"
                            }`}
                          >
                            {Object.values(subcategories).flat().length} {t("expenses.expenseCount")}
                          </span>
                        </div>
                      </button>

                      {isExpanded && (
                        <div
                          className={`px-4 py-4 space-y-4 ${
                            darkMode ? "bg-gray-800" : "bg-white"
                          }`}
                        >
                          {Object.entries(subcategories).map(
                            ([subcategory, exps]) => (
                              <div key={subcategory} className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className={`font-semibold ${textClass}`}>
                                    {subcategory}
                                  </h4>
                                  <span
                                    className={`text-sm ${textSecondaryClass}`}
                                  >
                                    €
                                    {exps
                                      .reduce((sum, exp) => sum + exp.amount, 0)
                                      .toFixed(2)}
                                  </span>
                                </div>
                                <div className="divide-y divide-purple-100">
                                  {exps.map((expense) => {
                                    const isRecurring = !!expense.isRecurring;
                                    const frequencyKey = isRecurring
                                      ? recurringFrequencyMap[expense.recurringId] || expense.frequency || "monthly"
                                      : null;
                                    const frequencyLabel = frequencyKey
                                      ? frequencyLabels[frequencyKey] || frequencyLabels.monthly
                                      : null;
                                    const rowClasses = [
                                      "px-4 py-3 transition-all flex justify-between items-center rounded-xl border",
                                      darkMode ? "hover:bg-gray-700/30" : "hover:bg-purple-50/40",
                                      isRecurring
                                        ? darkMode
                                          ? "bg-blue-900/30 border-blue-800/50 shadow-sm"
                                          : "bg-blue-50/70 border-blue-200/70 shadow-sm"
                                        : "border-transparent",
                                    ].join(" ");

                                    return (
                                      <div key={expense.id} className={rowClasses}>
                                        <div className="flex-1">
                                          <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <p className={`text-sm font-semibold ${textClass}`}>
                                              {expense.name || "Gasto sin nombre"}
                                            </p>
                                            {isRecurring && (
                                              <span
                                                className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${
                                                  darkMode
                                                    ? "bg-blue-900/60 text-blue-300"
                                                    : "bg-blue-100 text-blue-700"
                                                }`}
                                                title={frequencyLabel || undefined}
                                              >
                                                <Clock className="w-3 h-3" />
                                                {frequencyLabel
                                                  ? `${t("recurring.badge")} • ${frequencyLabel}`
                                                  : t("recurring.badge")}
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <span className={`text-sm ${textSecondaryClass}`}>
                                              {new Date(expense.date).toLocaleDateString("es-ES")}
                                            </span>
                                            <span
                                              className={`text-xs ${
                                                darkMode
                                                  ? "bg-gray-700"
                                                  : "bg-white/60"
                                              } px-2 py-1 rounded-full ${textSecondaryClass}`}
                                            >
                                              {expense.paymentMethod}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <span className={`font-bold ${textClass}`}>
                                            €{expense.amount.toFixed(2)}
                                          </span>
                                          <button
                                            onClick={() => onEditExpense(expense)}
                                            className={`p-2 rounded-lg ${
                                              darkMode
                                                ? "hover:bg-purple-900/50"
                                                : "hover:bg-purple-100"
                                            } transition-all`}
                                          >
                                            <Pencil
                                              className={`w-4 h-4 ${
                                                darkMode
                                                  ? "text-purple-400"
                                                  : "text-purple-600"
                                              }`}
                                            />
                                          </button>
                                          <button
                                            onClick={() =>
                                              onRequestDelete({
                                                type: "expense",
                                                id: expense.id,
                                              })
                                            }
                                            className={`p-2 rounded-lg ${
                                              darkMode
                                                ? "hover:bg-red-900/50"
                                                : "hover:bg-red-100"
                                            } transition-all`}
                                          >
                                            <Trash2 className="w-4 h-4 text-red-600" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      )}

      {activeView === "chart" && (
        <div className={`${cardClass} rounded-2xl p-6 border shadow-lg`}>
          <h3 className={`text-xl font-bold ${textClass} mb-6`}>
            Distribución por Categoría
          </h3>

          {categoryTotals.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle
                className={`w-16 h-16 ${textSecondaryClass} mx-auto mb-4`}
              />
              <p className={textSecondaryClass}>
                No hay gastos en este período
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative">
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <defs>
                      {categoryTotals.map((item, index) => {
                        return (
                          <filter key={`shadow-${index}`} id={`shadow-${index}`} x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2" />
                          </filter>
                        );
                      })}
                    </defs>
                    <Pie
                      data={categoryTotals
                        .sort((a, b) => b.total - a.total)
                        .map((item) => ({
                          name: item.category,
                          value: item.total,
                          percentage: ((item.total / totalExpenses) * 100).toFixed(1),
                          color: getCategoryColor(categories[item.category]),
                        }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ percentage }) => {
                        // Solo mostrar label si el porcentaje es >= 5%
                        return parseFloat(percentage) >= 5 ? `${percentage}%` : "";
                      }}
                      outerRadius={140}
                      innerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={800}
                      animationEasing="ease-out"
                    >
                      {categoryTotals.map((item, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={getCategoryColor(categories[item.category])}
                          stroke={darkMode ? "#1f2937" : "#ffffff"}
                          strokeWidth={3}
                          style={{
                            filter: `url(#shadow-${index})`,
                            cursor: "pointer",
                          }}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: darkMode ? "1px solid #374151" : "1px solid #e9d5ff",
                        backgroundColor: darkMode ? "#1f2937" : "#ffffff",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                      }}
                      itemStyle={{
                        color: darkMode ? "#f3f4f6" : "#7c3aed",
                      }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0];
                          return (
                            <div className="p-3">
                              <p className={`font-semibold ${textClass} mb-2`}>
                                {data.payload.name}
                              </p>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: data.payload.color }}
                                />
                                <p className={`text-sm font-bold ${textClass}`}>
                                  €{data.value?.toFixed(2)}
                                </p>
                                <p className={`text-xs ${textSecondaryClass}`}>
                                  ({data.payload.percentage}%)
                                </p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Total en el centro */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className={`text-xs ${textSecondaryClass} mb-1`}>
                      Total
                    </p>
                    <p className={`text-3xl font-bold ${textClass}`}>
                      €{totalExpenses.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Leyenda personalizada */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {categoryTotals
                  .sort((a, b) => b.total - a.total)
                  .map((item, index) => {
                    const color = getCategoryColor(categories[item.category]);
                    const percentage = ((item.total / totalExpenses) * 100).toFixed(1);
                    return (
                      <div
                        key={index}
                        className={`p-3 rounded-xl border ${
                          darkMode
                            ? "bg-gray-800/50 border-gray-700"
                            : "bg-purple-50/50 border-purple-100"
                        } transition-all hover:shadow-md`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold ${textClass} truncate`}>
                              {item.category}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className={`text-xs font-bold ${textClass}`}>
                                €{item.total.toFixed(2)}
                              </p>
                              <p className={`text-xs ${textSecondaryClass}`}>
                                ({percentage}%)
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              <div className="space-y-3">
                {Object.entries(expensesByCategory)
                  .sort(([, subsA], [, subsB]) => {
                    const totalA = Object.values(subsA)
                      .flat()
                      .reduce((sum, exp) => sum + exp.amount, 0);
                    const totalB = Object.values(subsB)
                      .flat()
                      .reduce((sum, exp) => sum + exp.amount, 0);
                    return totalB - totalA;
                  })
                  .map(([category, subcategories]) => {
                    const categoryTotal = Object.values(subcategories)
                      .flat()
                      .reduce((sum, exp) => sum + exp.amount, 0);
                    const percentage = (categoryTotal / totalExpenses) * 100;
                    const isExpanded = expandedCategories[category];

                    const categoryColor = getCategoryColor(categories[category]);

                    return (
                      <div
                        key={category}
                        className={`${
                          darkMode ? "bg-gray-700/30" : "bg-white/50"
                        } rounded-2xl border ${
                          darkMode ? "border-gray-600" : "border-purple-100"
                        } p-4 sm:p-5 transition-all`}
                      >
                        <button
                          onClick={() => onToggleCategory(category)}
                          className="w-full flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3 sm:gap-4">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: categoryColor }}
                            ></span>
                            <div className="text-left">
                              <p className={`font-semibold ${textClass}`}>
                                {category}
                              </p>
                              <p
                                className={`text-sm ${textSecondaryClass} opacity-80`}
                              >
                                {percentage.toFixed(1)}% del total
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`font-semibold ${textClass}`}>
                              €{categoryTotal.toFixed(2)}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className={`w-5 h-5 ${textSecondaryClass}`} />
                            ) : (
                              <ChevronDown
                                className={`w-5 h-5 ${textSecondaryClass}`}
                              />
                            )}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="mt-3 space-y-2 pl-5">
                            {Object.entries(subcategories)
                              .sort(([, expsA], [, expsB]) => {
                                const totalA = expsA
                                  .reduce((sum, exp) => sum + exp.amount, 0);
                                const totalB = expsB
                                  .reduce((sum, exp) => sum + exp.amount, 0);
                                return totalB - totalA;
                              })
                              .map(([subcategory, exps]) => {
                                const spent = exps
                                  .reduce((sum, exp) => sum + exp.amount, 0);
                                const subPercentage = (spent / totalExpenses) * 100;

                                return (
                                  <div
                                    key={subcategory}
                                    className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-3"
                                  >
                                    <div className="flex justify-between items-center mb-2">
                                      <p className={`font-medium ${textClass}`}>
                                        {subcategory}
                                      </p>
                                      <span
                                        className={`text-sm ${textSecondaryClass}`}
                                      >
                                        €{spent.toFixed(2)}
                                      </span>
                                    </div>
                                    <div className="h-2 rounded-full bg-purple-100 dark:bg-gray-700 overflow-hidden">
                                      <div
                                        className="h-full"
                                        style={{ 
                                          width: `${Math.min(subPercentage, 100)}%`,
                                          backgroundColor: categoryColor,
                                          opacity: 0.8
                                        }}
                                      ></div>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {activeView === "budgets" && (
        <div className={`${cardClass} rounded-2xl p-4 sm:p-6 border shadow-lg`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
            <div>
              <h3 className={`text-lg sm:text-xl font-bold ${textClass}`}>
                Presupuestos Actuales
              </h3>
              <p className={`text-sm ${textSecondaryClass}`}>
                Controla tus gastos por categoría
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className={textSecondaryClass}>Dentro del límite</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                <span className={textSecondaryClass}>Cerca del límite</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span className={textSecondaryClass}>Superado</span>
              </div>
            </div>
          </div>

          {Object.keys(budgets).length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle
                className={`w-16 h-16 ${textSecondaryClass} mx-auto mb-4`}
              />
              <p className={`text-xl font-semibold ${textClass} mb-2`}>
                No tienes presupuestos configurados
              </p>
              <p className={textSecondaryClass}>
                Crea un presupuesto para comenzar a controlar tus gastos
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(budgets).map(([category, budget]) => {
                const totalSpent =
                  categoryTotals.find((item) => item.category === category)?.total || 0;
                const percentage = Math.min((totalSpent / budget) * 100, 100);
                const status =
                  totalSpent > budget
                    ? "over"
                    : totalSpent > budget * 0.8
                    ? "warning"
                    : "ok";

                const statusColors = {
                  over: "bg-red-500",
                  warning: "bg-yellow-500",
                  ok: "bg-green-500",
                };

                return (
                  <div
                    key={category}
                    className={`p-4 sm:p-5 rounded-2xl border ${
                      darkMode ? "border-gray-700 bg-gray-800" : "border-purple-100 bg-white"
                    } shadow-sm`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                      <div>
                        <p className={`text-lg font-semibold ${textClass}`}>
                          {category}
                        </p>
                        <p className={`text-sm ${textSecondaryClass}`}>
                          Presupuesto: €{budget.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-bold ${textClass}`}>
                          €{totalSpent.toFixed(2)} gastados
                        </span>
                        <button
                          onClick={() =>
                            onRequestDelete({ type: "budget", category })
                          }
                          className={`p-2 rounded-lg ${
                            darkMode
                              ? "hover:bg-red-900/50"
                              : "hover:bg-red-100"
                          } transition-all`}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>

                    <div className="h-2.5 rounded-full bg-purple-100 dark:bg-gray-700 overflow-hidden">
                      <div
                        className={`h-full ${statusColors[status]}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>

                    {status === "over" && (
                      <p className="mt-2 text-sm text-red-500 font-medium">
                        Has superado tu presupuesto por €{(totalSpent - budget).toFixed(2)}!
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeView === "recent" && (
        <div className={`${cardClass} rounded-2xl p-4 sm:p-6 border shadow-lg`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg sm:text-xl font-bold ${textClass}`}>
              Últimos Gastos Añadidos
            </h3>
            <span className={`text-sm ${textSecondaryClass}`}>
              ({recentExpenses.length})
            </span>
          </div>

          {recentExpenses.length === 0 ? (
            <div className="text-center py-12">
              <Clock className={`w-16 h-16 ${textSecondaryClass} mx-auto mb-4`} />
              <p className={`text-xl font-semibold ${textClass} mb-2`}>
                No hay gastos todavía
              </p>
              <p className={textSecondaryClass}>
                Añade tu primer gasto para comenzar
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className={`p-3 sm:p-4 rounded-xl ${
                    darkMode ? "bg-gray-700" : "bg-white"
                  } border ${
                    darkMode ? "border-gray-600" : "border-purple-100"
                  } hover:shadow-md transition-all`}
                >
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className={`font-semibold ${textClass} truncate`}>
                          {expense.name}
                        </p>
                        {expense.isRecurring && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 flex-shrink-0 ${
                              darkMode
                                ? "bg-blue-900/50 text-blue-400"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            <span className="hidden sm:inline">Recurrente</span>
                          </span>
                        )}
                      </div>
                      <p className={`text-xs sm:text-sm ${textSecondaryClass} truncate`}>
                        {expense.category} • {expense.subcategory}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`font-bold ${textClass} text-sm sm:text-base`}>
                        €{expense.amount.toFixed(2)}
                      </span>
                      <button
                        onClick={() => onEditExpense(expense)}
                        className={`p-1.5 sm:p-2 rounded-lg ${
                          darkMode
                            ? "hover:bg-purple-900/50"
                            : "hover:bg-purple-100"
                        } transition-all`}
                      >
                        <Pencil
                          className={`w-3 h-3 sm:w-4 sm:h-4 ${
                            darkMode ? "text-purple-400" : "text-purple-600"
                          }`}
                        />
                      </button>
                      <button
                        onClick={() =>
                          onRequestDelete({ type: "expense", id: expense.id })
                        }
                        className={`p-1.5 sm:p-2 rounded-lg ${
                          darkMode
                            ? "hover:bg-red-900/50"
                            : "hover:bg-red-100"
                        } transition-all`}
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    <span className={textSecondaryClass}>
                      {new Date(expense.date).toLocaleDateString("es-ES")}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full ${
                        darkMode ? "bg-gray-600" : "bg-purple-100"
                      } ${textSecondaryClass}`}
                    >
                      {expense.paymentMethod}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

MainContent.displayName = "MainContent";

export default MainContent;
