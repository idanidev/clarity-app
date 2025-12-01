import { memo, useMemo, useState, useEffect } from "react";
import {
  AlertTriangle,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Clock,
  Filter,
  Pencil,
  Plus,
  Search,
  Table as TableIcon,
  Target,
  Trash2,
  X,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Calendar,
  Heart,
  Dumbbell,
  Gamepad2,
  Repeat,
  UtensilsCrossed,
  Car,
  ShoppingBag,
  Home,
  Wallet,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { getCategoryColor } from "../../../services/firestoreService";
import { getLongTermGoalProgress } from "../../../services/goalsService";
import { useTranslation } from "../../../contexts/LanguageContext";
import ExpenseCard from "./ExpenseCard";

const MainContent = memo(({
  cardClass,
  textClass,
  textSecondaryClass,
  darkMode,
  totalExpenses,
  filteredExpenses,
  showFilters,
  onToggleFilters,
  filterPeriodType,
  onFilterPeriodTypeChange,
  selectedMonth,
  onMonthChange,
  selectedYear,
  onYearChange,
  selectedCategory,
  onCategoryChange,
  onClearFilters,
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
  categoryTotalsForBudgets,
  budgets,
  recentExpenses,
  recurringExpenses = [],
  goals,
  income,
  onOpenGoals,
}) => {
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);
  const [clickedCategory, setClickedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Iconos por categoría
  const categoryIcons = {
    Salud: Heart,
    Gimnasio: Dumbbell,
    Ocio: Gamepad2,
    Suscripciones: Repeat,
    Comida: UtensilsCrossed,
    Transporte: Car,
    Compras: ShoppingBag,
    Hogar: Home,
    "Coche/Moto": Car,
    Alimentacion: UtensilsCrossed,
    Educacion: Repeat,
  };
  
  // Calcular promedio diario según el tipo de filtro
  const averageDaily = useMemo(() => {
    if (filteredExpenses.length === 0) return 0;
    const today = new Date();
    
    try {
      switch (filterPeriodType) {
        case "all": {
          // Promedio desde los inicios: calcular días desde el primer gasto
          const firstExpense = filteredExpenses.reduce((earliest, exp) => 
            exp.date < earliest.date ? exp : earliest
          );
          const firstDate = new Date(firstExpense.date);
          const daysDiff = Math.ceil((today - firstDate) / (1000 * 60 * 60 * 24));
          return daysDiff > 0 ? totalExpenses / daysDiff : 0;
        }
        
        case "year": {
          // Promedio diario del año
          const yearNum = parseInt(selectedYear);
          const isCurrentYear = today.getFullYear() === yearNum;
          const startOfYear = new Date(yearNum, 0, 1);
          const daysInYear = isCurrentYear
            ? Math.ceil((today - startOfYear) / (1000 * 60 * 60 * 24))
            : (yearNum % 4 === 0 && (yearNum % 100 !== 0 || yearNum % 400 === 0)) ? 366 : 365;
          return daysInYear > 0 ? totalExpenses / daysInYear : 0;
        }
        
        case "month":
        default: {
          // Promedio del mes
          if (!selectedMonth) return 0;
          const [yearNum, month] = selectedMonth.split("-").map(Number);
          if (!yearNum || !month) return 0;
          const daysInMonth = new Date(yearNum, month, 0).getDate();
          const isCurrentMonth = 
            today.getFullYear() === yearNum && 
            (today.getMonth() + 1) === month;
          const daysPassed = isCurrentMonth 
            ? Math.min(today.getDate(), daysInMonth)
            : daysInMonth;
          return daysPassed > 0 ? totalExpenses / daysPassed : 0;
        }
      }
    } catch (error) {
      console.error("Error calculating average:", error);
      return 0;
    }
  }, [totalExpenses, filterPeriodType, selectedMonth, selectedYear, filteredExpenses]);

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



  // Calcular información de objetivos para la tarjeta de resumen
  const goalsSummary = useMemo(() => {
    if (!goals?.totalSavingsGoal || !income || income === 0) {
      return null;
    }
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const daysPassed = today.getDate();
    const currentMonthExpenses = categoryTotalsForBudgets.reduce((sum, item) => sum + item.total, 0);
    const monthlySavings = income - currentMonthExpenses;
    const expectedSavingsByNow = (goals.totalSavingsGoal * daysPassed) / daysInMonth;
    const progress = expectedSavingsByNow > 0 
      ? Math.min((monthlySavings / expectedSavingsByNow) * 100, 200) 
      : 0;
    return {
      savings: monthlySavings,
      goal: goals.totalSavingsGoal,
      progress,
      isAhead: monthlySavings >= expectedSavingsByNow,
    };
  }, [goals, income, categoryTotalsForBudgets]);

  return (
    <div className="max-w-7xl mx-auto px-2 md:px-4 py-2 md:py-6 md:pb-6" style={{ paddingBottom: 'max(5.5rem, calc(5.5rem + env(safe-area-inset-bottom)))' }}>
      {/* Estadísticas con estilo Liquid Glass mejorado - Solo en vista principal, más compactas en móvil */}
      {activeView === "table" && (
        <div className="relative mb-3 md:mb-6">
          <div className="grid grid-cols-4 gap-1.5 md:gap-4">
            {/* TOTAL - Más pequeño en móvil */}
            <div
              className={`rounded-lg md:rounded-2xl p-1.5 md:p-5 border backdrop-blur-xl transition-all md:hover:scale-[1.02] ${
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
                  className={`p-1 md:p-2.5 rounded md:rounded-xl mb-1 md:mb-3 ${
                    darkMode ? "bg-purple-600/20" : "bg-purple-100/50"
                  }`}
                >
                  <Target className={`w-3 h-3 md:w-5 md:h-5 ${textSecondaryClass}`} />
                </div>
                <span className={`text-[9px] md:text-xs font-semibold mb-0.5 md:mb-1.5 uppercase tracking-wide ${textSecondaryClass}`}>
                  {t("common.total")}
                </span>
                <p className={`text-xs md:text-2xl lg:text-3xl font-bold ${textClass} leading-tight`}>
                  €{totalExpenses.toFixed(2)}
                </p>
              </div>
            </div>

            {/* GASTOS - Más pequeño en móvil */}
            <div
              className={`rounded-lg md:rounded-2xl p-1.5 md:p-5 border backdrop-blur-xl transition-all md:hover:scale-[1.02] ${
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
                  className={`p-1 md:p-2.5 rounded md:rounded-xl mb-1 md:mb-3 ${
                    darkMode ? "bg-blue-600/20" : "bg-blue-100/50"
                  }`}
                >
                  <BarChart3 className={`w-3 h-3 md:w-5 md:h-5 ${textSecondaryClass}`} />
                </div>
                <span className={`text-[9px] md:text-xs font-semibold mb-0.5 md:mb-1.5 uppercase tracking-wide ${textSecondaryClass}`}>
                  {t("common.expenses")}
                </span>
                <p className={`text-xs md:text-2xl lg:text-3xl font-bold ${textClass} leading-tight`}>
                  {filteredExpenses.length}
                </p>
              </div>
            </div>

            {/* PROMEDIO - Más pequeño en móvil */}
            <div
              className={`rounded-lg md:rounded-2xl p-1.5 md:p-5 border backdrop-blur-xl transition-all md:hover:scale-[1.02] ${
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
                  className={`p-1 md:p-2.5 rounded md:rounded-xl mb-1 md:mb-3 ${
                    darkMode ? "bg-pink-600/20" : "bg-pink-100/50"
                  }`}
                >
                  <Clock className={`w-3 h-3 md:w-5 md:h-5 ${textSecondaryClass}`} />
                </div>
                <span className={`text-[9px] md:text-xs font-semibold mb-0.5 md:mb-1.5 uppercase tracking-wide ${textSecondaryClass}`}>
                  {t("common.average")}
                </span>
                <p className={`text-xs md:text-2xl lg:text-3xl font-bold ${textClass} leading-tight`}>
                  €{averageDaily.toFixed(2)}
                </p>
              </div>
            </div>

            {/* OBJETIVOS - Nueva tarjeta */}
            {goalsSummary && (
              <div
                className={`rounded-lg md:rounded-2xl p-1.5 md:p-5 border backdrop-blur-xl transition-all md:hover:scale-[1.02] ${
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
                    className={`p-1 md:p-2.5 rounded md:rounded-xl mb-1 md:mb-3 ${
                      darkMode ? "bg-green-600/20" : "bg-green-100/50"
                    }`}
                  >
                    <Sparkles className={`w-3 h-3 md:w-5 md:h-5 ${
                      goalsSummary.isAhead 
                        ? darkMode ? "text-green-400" : "text-green-500"
                        : darkMode ? "text-gray-400" : "text-gray-500"
                    }`} />
                  </div>
                  <span className={`text-[9px] md:text-xs font-semibold mb-0.5 md:mb-1.5 uppercase tracking-wide ${textSecondaryClass}`}>
                    Objetivos
                  </span>
                  <p className={`text-xs md:text-2xl lg:text-3xl font-bold ${
                    goalsSummary.isAhead
                      ? darkMode ? "text-green-400" : "text-green-500"
                      : goalsSummary.progress >= 80
                      ? darkMode ? "text-yellow-400" : "text-yellow-500"
                      : darkMode ? "text-purple-400" : "text-purple-600"
                  } leading-tight`}>
                    €{goalsSummary.savings.toFixed(2)}
                  </p>
                  <p className={`text-[8px] md:text-xs ${textSecondaryClass} mt-0.5`}>
                    {goalsSummary.progress.toFixed(0)}%
                  </p>
                </div>
              </div>
            )}
            
            {/* Si no hay objetivos, mostrar espacio vacío o tarjeta deshabilitada */}
            {!goalsSummary && (
              <div
                className={`rounded-lg md:rounded-2xl p-1.5 md:p-5 border backdrop-blur-xl opacity-50 ${
                  darkMode
                    ? "bg-gray-800/30 border-gray-700/20"
                    : "bg-white/30 border-white/20"
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <div
                    className={`p-1 md:p-2.5 rounded md:rounded-xl mb-1 md:mb-3 ${
                      darkMode ? "bg-gray-700/20" : "bg-gray-100/50"
                    }`}
                  >
                    <Target className={`w-3 h-3 md:w-5 md:h-5 ${textSecondaryClass}`} />
                  </div>
                  <span className={`text-[9px] md:text-xs font-semibold mb-0.5 md:mb-1.5 uppercase tracking-wide ${textSecondaryClass}`}>
                    Objetivos
                  </span>
                  <p className={`text-xs md:text-2xl lg:text-3xl font-bold ${textSecondaryClass} leading-tight`}>
                    --
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Botón de filtrar en móvil - arriba a la derecha - Solo en table y chart */}
      {(activeView === "table" || activeView === "chart") && (
        <div className="md:hidden relative mb-2">
          <button
            onClick={onToggleFilters}
            className={`absolute -top-2 -right-2 p-3 rounded-full shadow-xl backdrop-blur-xl border transition-all active:scale-95 z-10 ${
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
      )}

      {/* Panel de filtros para móvil - Solo en table y chart */}
      {showFilters && (activeView === "table" || activeView === "chart") && (
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
              <div className="flex items-center gap-2">
                {onClearFilters && (
                  <button
                    onClick={onClearFilters}
                    className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                      darkMode
                        ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                        : "bg-purple-100 hover:bg-purple-200 text-purple-700"
                    }`}
                  >
                    {t("filters.clear")}
                  </button>
                )}
                <button
                  onClick={onToggleFilters}
                  className={`p-2 rounded-lg ${
                    darkMode ? "hover:bg-gray-700" : "hover:bg-purple-100"
                  } transition-all`}
                >
                  <X className={`w-4 h-4 ${textSecondaryClass}`} />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className={`block text-xs font-medium mb-1 ${textSecondaryClass}`}>
                  {t("filters.period")}
                </label>
                <select
                  value={filterPeriodType}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onChange={(e) => onFilterPeriodTypeChange(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-sm transition-all ${
                    darkMode
                      ? "bg-gray-800 border-gray-700 text-gray-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40"
                      : "bg-white border-purple-200 text-purple-900 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/40"
                  }`}
                >
                  <option value="month">{t("filters.monthly")}</option>
                  <option value="year">{t("filters.yearly")}</option>
                  <option value="all">{t("filters.allTime")}</option>
                </select>
              </div>

              {filterPeriodType === "month" && (
                <div>
                  <label className={`block text-xs font-medium mb-1 ${textSecondaryClass}`}>
                    {t("filters.selectMonth")}
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
              )}

              {filterPeriodType === "year" && (
                <div>
                  <label className={`block text-xs font-medium mb-1 ${textSecondaryClass}`}>
                    {t("filters.selectYear")}
                  </label>
                  <input
                    type="number"
                    min="2020"
                    max={new Date().getFullYear()}
                    value={selectedYear}
                    onChange={(e) => onYearChange(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-sm transition-all ${
                      darkMode
                        ? "bg-gray-800 border-gray-700 text-gray-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40"
                        : "bg-white border-purple-200 text-purple-900 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/40"
                    }`}
                  />
                </div>
              )}


              <div>
                <label className={`block text-xs font-medium mb-1 ${textSecondaryClass}`}>
                  {t("filters.category")}
                </label>
                <select
                  value={selectedCategory}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
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

      {/* Barra superior estilo Liquid Glass para desktop - Solo en table y chart */}
      {(activeView === "table" || activeView === "chart") && (
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
              <div className="flex items-center gap-3 flex-1 min-w-0 flex-wrap">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/50 dark:bg-gray-700/50 border border-white/60 dark:border-gray-600/40">
                  <Filter className={`w-4 h-4 ${textSecondaryClass}`} />
                  <span className={`text-xs font-medium ${textSecondaryClass}`}>
                    {t("filters.title")}
                  </span>
                </div>
                
                <select
                  value={filterPeriodType}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onChange={(e) => onFilterPeriodTypeChange(e.target.value)}
                  className={`px-3 py-2 rounded-xl border text-sm transition-all ${
                    darkMode
                      ? "bg-gray-700/50 border-gray-600/40 text-gray-100 focus:bg-gray-700 focus:border-purple-500/50"
                      : "bg-white/70 border-white/60 text-purple-900 focus:bg-white focus:border-purple-400"
                  } focus:ring-2 focus:ring-purple-500/20 focus:outline-none`}
                >
                  <option value="month">{t("filters.monthly")}</option>
                  <option value="year">{t("filters.yearly")}</option>
                  <option value="all">{t("filters.allTime")}</option>
                </select>

                {filterPeriodType === "month" && (
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => onMonthChange(e.target.value)}
                    className={`min-w-[140px] px-3 py-2 rounded-xl border text-sm transition-all ${
                      darkMode
                        ? "bg-gray-700/50 border-gray-600/40 text-gray-100 focus:bg-gray-700 focus:border-purple-500/50"
                        : "bg-white/70 border-white/60 text-purple-900 focus:bg-white focus:border-purple-400"
                    } focus:ring-2 focus:ring-purple-500/20 focus:outline-none`}
                  />
                )}

                {filterPeriodType === "year" && (
                  <input
                    type="number"
                    min="2020"
                    max={new Date().getFullYear()}
                    value={selectedYear}
                    onChange={(e) => onYearChange(e.target.value)}
                    className={`min-w-[100px] px-3 py-2 rounded-xl border text-sm transition-all ${
                      darkMode
                        ? "bg-gray-700/50 border-gray-600/40 text-gray-100 focus:bg-gray-700 focus:border-purple-500/50"
                        : "bg-white/70 border-white/60 text-purple-900 focus:bg-white focus:border-purple-400"
                    } focus:ring-2 focus:ring-purple-500/20 focus:outline-none`}
                  />
                )}

                
                <select
                  value={selectedCategory}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onChange={(e) => onCategoryChange(e.target.value)}
                  className={`min-w-[140px] px-3 py-2 rounded-xl border text-sm transition-all ${
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

                {onClearFilters && (
                  <button
                    onClick={onClearFilters}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      darkMode
                        ? "bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/40 text-gray-200"
                        : "bg-white/70 hover:bg-white border border-white/60 text-purple-700"
                    } focus:ring-2 focus:ring-purple-500/20 focus:outline-none`}
                  >
                    {t("filters.clear")}
                  </button>
                )}
              </div>

              {/* Sección derecha: Botón Añadir Gasto - Solo en vista de tabla */}
              {activeView === "table" && (
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
              )}
            </div>
          </div>
        </div>
      )}

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
            onClick={() => onChangeView("goals")}
            className={`relative flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
              activeView === "goals"
                ? darkMode
                  ? "bg-purple-600/90 text-white shadow-lg"
                  : "bg-white text-purple-600 shadow-md"
                : darkMode
                ? "text-gray-300 hover:text-white hover:bg-gray-700/30"
                : "text-purple-600 hover:text-purple-700 hover:bg-white/50"
            }`}
            style={
              activeView === "goals"
                ? {
                    boxShadow: darkMode
                      ? "0 2px 8px rgba(139, 92, 246, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset"
                      : "0 2px 8px rgba(139, 92, 246, 0.2), 0 0 0 1px rgba(139, 92, 246, 0.1) inset",
                  }
                : {}
            }
          >
            <Target className="w-4 h-4" />
            <span>{t("views.goals")}</span>
          </button>
        </div>
      </div>

      {/* Barra inferior flotante estilo Liquid Glass para móvil - Fija siempre */}
      <div 
        className="md:hidden fixed bottom-0 left-0 right-0 z-[100] px-2 pt-1 pointer-events-none" 
        style={{ 
          paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
        }}
      >
        <div
          className={`max-w-md mx-auto rounded-t-2xl shadow-xl border-t border-l border-r backdrop-blur-xl pointer-events-auto ${
            darkMode
              ? "bg-gray-900/90 border-gray-700/50"
              : "bg-white/90 border-white/40"
          }`}
          style={{
            boxShadow: darkMode
              ? "0 -4px 20px 0 rgba(0, 0, 0, 0.4), 0 0 0 0.5px rgba(255, 255, 255, 0.05) inset"
              : "0 -4px 20px 0 rgba(31, 38, 135, 0.15), 0 0 0 0.5px rgba(255, 255, 255, 0.8) inset",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            position: 'relative',
          }}
        >
          <div className="grid grid-cols-5 gap-0.5 p-1" style={{ paddingBottom: 'max(0.5rem, calc(0.5rem + env(safe-area-inset-bottom)))' }}>
            {/* Botón Tabla */}
            <button
              onClick={() => {
                onChangeView("table");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 rounded-xl font-medium transition-all relative ${
                activeView === "table"
                  ? darkMode
                    ? "bg-purple-600/90 text-white"
                    : "bg-purple-600/90 text-white"
                  : darkMode
                  ? "text-gray-300 hover:bg-gray-800/50"
                  : "text-purple-600 hover:bg-white/50"
              }`}
            >
              <TableIcon className="w-4 h-4" />
              <span className="text-[10px] font-medium">{t("views.table")}</span>
              {activeView === "table" && (
                <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-white"></div>
              )}
            </button>

            {/* Botón Gráfica */}
            <button
              onClick={() => {
                onChangeView("chart");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 rounded-xl font-medium transition-all relative ${
                activeView === "chart"
                  ? darkMode
                    ? "bg-purple-600/90 text-white"
                    : "bg-purple-600/90 text-white"
                  : darkMode
                  ? "text-gray-300 hover:bg-gray-800/50"
                  : "text-purple-600 hover:bg-white/50"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="text-[10px] font-medium">{t("views.chart")}</span>
              {activeView === "chart" && (
                <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-white"></div>
              )}
            </button>

            {/* Botón Añadir Gasto - CENTRO */}
            <button
              onClick={onAddExpenseClick}
              className="flex items-center justify-center p-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg transition-all active:scale-95 -mt-2 z-10"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <Plus className="w-6 h-6" />
            </button>

            {/* Botón Recientes */}
            <button
              onClick={() => {
                onChangeView("recent");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 rounded-xl font-medium transition-all relative ${
                activeView === "recent"
                  ? darkMode
                    ? "bg-purple-600/90 text-white"
                    : "bg-purple-600/90 text-white"
                  : darkMode
                  ? "text-gray-300 hover:bg-gray-800/50"
                  : "text-purple-600 hover:bg-white/50"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span className="text-[10px] font-medium">{t("views.recent")}</span>
              {activeView === "recent" && (
                <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-white"></div>
              )}
            </button>

            {/* Botón Objetivos */}
            <button
              onClick={() => {
                onChangeView("goals");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 rounded-xl font-medium transition-all relative ${
                activeView === "goals"
                  ? darkMode
                    ? "bg-purple-600/90 text-white"
                    : "bg-purple-600/90 text-white"
                  : darkMode
                  ? "text-gray-300 hover:bg-gray-800/50"
                  : "text-purple-600 hover:bg-white/50"
              }`}
            >
              <Target className="w-4 h-4" />
              <span className="text-[10px] font-medium">{t("views.goals")}</span>
              {activeView === "goals" && (
                <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-white"></div>
              )}
            </button>
          </div>
        </div>
      </div>


      {activeView === "table" && (
        <div className="max-w-7xl mx-auto">
          {/* Buscador */}
          {Object.keys(expensesByCategory).length > 0 && (
            <div className="mb-3 sm:mb-4">
              <div className={`relative ${darkMode ? "bg-gray-800/50" : "bg-white/60"} rounded-lg md:rounded-xl border ${
                darkMode ? "border-gray-700/40" : "border-white/40"
              } backdrop-blur-xl`}>
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 ${textSecondaryClass}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar gastos por nombre, categoría o subcategoría..."
                  className={`w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-lg md:rounded-xl bg-transparent ${textClass} placeholder:${textSecondaryClass} focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm sm:text-base`}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${textSecondaryClass} hover:opacity-70 transition-opacity`}
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {Object.keys(expensesByCategory).length === 0 ? (
            <div className="text-center py-16">
              <Wallet className={`w-16 h-16 mx-auto ${textSecondaryClass} mb-4`} />
              <h3 className={`text-xl font-medium mb-2 ${textClass}`}>
                No hay gastos
              </h3>
              <p className={`${textSecondaryClass} mb-6`}>
                Añade tu primer gasto para comenzar
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 sm:space-y-6">
              {(() => {
                const filteredCategories = Object.entries(expensesByCategory)
                  .filter(([category, subcategories]) => {
                    if (!searchQuery.trim()) return true;
                    const query = searchQuery.toLowerCase();
                    // Buscar en nombre de categoría
                    if (category.toLowerCase().includes(query)) return true;
                    // Buscar en gastos
                    const allExpenses = Object.values(subcategories).flat();
                    return allExpenses.some(exp => 
                      (exp.name && exp.name.toLowerCase().includes(query)) ||
                      (exp.subcategory && exp.subcategory.toLowerCase().includes(query))
                    );
                  })
                  .map(([category, subcategories]) => {
                  const categoryTotal = Object.values(subcategories)
                    .flat()
                    .reduce((sum, exp) => sum + exp.amount, 0);
                  const isExpanded = expandedCategories[category];
                  const expenseCount = Object.values(subcategories).flat().length;
                  const CategoryIcon = categoryIcons[category] || Wallet;

                  // Filtrar gastos según búsqueda
                  const filteredSubcategories = Object.entries(subcategories).reduce((acc, [subcategory, exps]) => {
                    if (!searchQuery.trim()) {
                      acc[subcategory] = exps;
                      return acc;
                    }
                    const query = searchQuery.toLowerCase();
                    const filtered = exps.filter(exp => 
                      (exp.name && exp.name.toLowerCase().includes(query)) ||
                      (exp.subcategory && exp.subcategory.toLowerCase().includes(query)) ||
                      category.toLowerCase().includes(query)
                    );
                    if (filtered.length > 0) {
                      acc[subcategory] = filtered;
                    }
                    return acc;
                  }, {});

                  // Si no hay gastos después del filtro, no mostrar la categoría
                  if (searchQuery.trim() && Object.keys(filteredSubcategories).length === 0) {
                    return null;
                  }

                  const categoryData = categories[category];
                  const categoryColor = getCategoryColor(categoryData);
                  const filteredTotal = Object.values(filteredSubcategories).flat().reduce((sum, exp) => sum + exp.amount, 0);
                  const filteredCount = Object.values(filteredSubcategories).flat().length;

                  return (
                    <div key={category} className="mb-2 sm:mb-3">
                      <button
                        onClick={() => onToggleCategory(category)}
                        className={`w-full rounded-xl sm:rounded-2xl ${
                          darkMode
                            ? "bg-gray-800/60 hover:bg-gray-800 border border-gray-700/50"
                            : "bg-white hover:bg-purple-50/50 border border-purple-200/50 shadow-sm"
                        } px-3 py-2.5 sm:px-4 sm:py-3.5 flex items-center justify-between gap-2 transition-all hover:shadow-md`}
                        style={{
                          // Hacer la línea de color de categoría más visible
                          borderLeftWidth: "6px",
                          borderLeftColor: categoryColor,
                        }}
                      >
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          {isExpanded ? (
                            <ChevronUp className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${textSecondaryClass}`} />
                          ) : (
                            <ChevronDown
                              className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${textSecondaryClass}`}
                            />
                          )}
                          <div
                            className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0 shadow-sm"
                            style={{ backgroundColor: categoryColor }}
                            title={`Color: ${categoryColor}`}
                          />
                          <div className="flex-1 min-w-0 flex items-center gap-2">
                            <p className={`text-xs sm:text-sm font-bold truncate ${textClass}`}>{category}</p>
                            <span className={`text-xs ${textSecondaryClass} whitespace-nowrap`}>
                              {filteredCount} {filteredCount === 1 ? "gasto" : "gastos"}
                            </span>
                          </div>
                          <div className="flex flex-col items-end flex-shrink-0">
                            <span className={`text-sm sm:text-base font-bold ${textClass}`}>
                              €{filteredTotal.toFixed(2)}
                            </span>
                            {searchQuery.trim() && categoryTotal !== filteredTotal && (
                              <span className={`text-xs ${textSecondaryClass} line-through opacity-60`}>
                                €{categoryTotal.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Gastos expandidos - con mejor espaciado */}
                      {isExpanded && (
                        <div
                          className="mt-2 sm:mt-3 ml-2 sm:ml-4 space-y-1.5 sm:space-y-2 transition-all duration-300 border-l-4 pl-3 sm:pl-4"
                          // Línea de color interior más gruesa y con más opacidad
                          style={{ borderColor: `${categoryColor}A0` }}
                        >
                          {Object.entries(filteredSubcategories).map(
                            ([subcategory, exps]) => (
                              <div key={subcategory} className="space-y-1.5 sm:space-y-2">
                                {exps.map((expense) => (
                                  <ExpenseCard
                                    key={expense.id}
                                    expense={{
                                      ...expense,
                                      category: category,
                                    }}
                                    onEdit={onEditExpense}
                                    onDelete={(exp) => onRequestDelete({
                                      type: "expense",
                                      id: exp.id,
                                    })}
                                    darkMode={darkMode}
                                    isMobile={isMobile}
                                  />
                                ))}
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  );
                  })
                  .filter(Boolean);

                // Mostrar mensaje si hay búsqueda pero no hay resultados
                if (searchQuery.trim() && filteredCategories.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <Search className={`w-12 h-12 mx-auto ${textSecondaryClass} mb-4 opacity-50`} />
                      <h3 className={`text-lg font-medium mb-2 ${textClass}`}>
                        No se encontraron resultados
                      </h3>
                      <p className={`${textSecondaryClass} text-sm`}>
                        Intenta con otros términos de búsqueda
                      </p>
                    </div>
                  );
                }

                return filteredCategories;
              })()}
            </div>
          )}
        </div>
      )}

      {activeView === "chart" && (
        <div className={`${cardClass} rounded-2xl p-3 md:p-6 border shadow-lg`}>
          {categoryTotals.length === 0 ? (
            <div className="text-center py-8 md:py-12">
              <AlertTriangle
                className={`w-12 md:w-16 h-12 md:h-16 ${textSecondaryClass} mx-auto mb-3 md:mb-4`}
              />
              <p className={`text-sm md:text-base ${textSecondaryClass}`}>
                No hay gastos en este período
              </p>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-6">
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
                        .map((item, index) => {
                          const categoryData = categories[item.category];
                          const color = getCategoryColor(categoryData);
                          return {
                            name: item.category,
                            value: item.total,
                            percentage: ((item.total / totalExpenses) * 100).toFixed(1),
                            color: color,
                            index,
                          };
                        })}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={false}
                      outerRadius={140}
                      innerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={800}
                      animationEasing="ease-out"
                      activeIndex={activeIndex}
                      onClick={(data, index) => {
                        if (activeIndex === index) {
                          setActiveIndex(null);
                          setClickedCategory(null);
                        } else {
                          setActiveIndex(index);
                          setClickedCategory(data);
                        }
                      }}
                    >
                      {categoryTotals.map((item, index) => {
                        const categoryData = categories[item.category];
                        const color = getCategoryColor(categoryData);
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={color}
                            stroke={activeIndex === index ? (darkMode ? "#ffffff" : "#000000") : (darkMode ? "#1f2937" : "#ffffff")}
                            strokeWidth={activeIndex === index ? 5 : 3}
                            filter={activeIndex === index ? `url(#shadow-${index})` : undefined}
                            style={{
                              cursor: "pointer",
                              transition: "all 0.3s ease",
                            }}
                          />
                        );
                      })}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Total en el centro */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className={`text-xs ${textSecondaryClass} mb-1`}>
                      Total
                    </p>
                    <p className={`text-3xl font-bold ${textClass} leading-tight`}>
                      €{totalExpenses.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Tooltip personalizado que aparece al hacer click */}
                {clickedCategory && (
                  <div
                    className="absolute z-50"
                    style={{
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      marginTop: "-60px",
                    }}
                  >
                    <div
                      className={`p-4 rounded-xl border shadow-2xl ${
                        darkMode
                          ? "bg-gray-800 border-gray-700"
                          : "bg-white border-purple-200"
                      }`}
                      style={{
                        boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
                        minWidth: "180px",
                      }}
                    >
                      <p
                        className={`text-lg font-bold mb-3 ${
                          darkMode ? "text-white" : "text-purple-900"
                        }`}
                      >
                        {clickedCategory.name}
                      </p>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-5 h-5 rounded-full flex-shrink-0 border-2"
                          style={{
                            backgroundColor: clickedCategory.color,
                            borderColor: darkMode ? "#ffffff" : "#000000",
                          }}
                        />
                        <div className="flex items-baseline gap-2">
                          <p
                            className={`text-xl font-bold ${
                              darkMode ? "text-white" : "text-purple-900"
                            }`}
                          >
                            €{clickedCategory.value?.toFixed(2)}
                          </p>
                          <p
                            className={`text-sm ${
                              darkMode ? "text-gray-200" : "text-gray-600"
                            }`}
                          >
                            ({clickedCategory.percentage}%)
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveIndex(null);
                          setClickedCategory(null);
                        }}
                        className={`absolute top-2 right-2 p-1 rounded-full ${
                          darkMode
                            ? "hover:bg-gray-700 text-gray-200"
                            : "hover:bg-purple-100 text-gray-600"
                        } transition-all`}
                        aria-label="Cerrar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Leyenda personalizada - Compacta en móvil */}
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
                {categoryTotals
                  .sort((a, b) => b.total - a.total)
                  .map((item, index) => {
                    const categoryData = categories[item.category];
                    const color = getCategoryColor(categoryData);
                    const percentage = ((item.total / totalExpenses) * 100).toFixed(1);
                    return (
                      <div
                        key={index}
                        className={`p-2 md:p-3 rounded-lg md:rounded-xl border ${
                          darkMode
                            ? "bg-gray-800/50 border-gray-700"
                            : "bg-purple-50/50 border-purple-100"
                        } transition-all hover:shadow-md`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 md:w-4 md:h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs md:text-sm font-semibold ${textClass} truncate`}>
                              {item.category}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <p className={`text-[10px] md:text-xs font-bold ${textClass}`}>
                                €{item.total.toFixed(2)}
                              </p>
                              <p className={`text-[10px] md:text-xs ${textSecondaryClass}`}>
                                ({percentage}%)
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              <div className="space-y-2 md:space-y-3">
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

                    const categoryData = categories[category];
                    const categoryColor = getCategoryColor(categoryData);

                    return (
                      <div
                        key={category}
                        className={`${
                          darkMode ? "bg-gray-900/60 border-gray-800/60" : "bg-white/50"
                        } rounded-xl md:rounded-2xl border ${
                          darkMode ? "border-gray-800/60" : "border-purple-100"
                        } p-2.5 md:p-4 sm:p-5 transition-all`}
                      >
                        <button
                          onClick={() => onToggleCategory(category)}
                          className="w-full flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2 md:gap-3 sm:gap-4">
                            <span
                              className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: categoryColor }}
                            ></span>
                            <div className="text-left min-w-0 flex-1">
                              <p className={`text-sm md:text-base font-semibold ${textClass} truncate`}>
                                {category}
                              </p>
                              <p
                                className={`text-xs md:text-sm ${textSecondaryClass} opacity-80`}
                              >
                                {percentage.toFixed(1)}% del total
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                            <span className={`text-sm md:text-base font-semibold ${textClass}`}>
                              €{categoryTotal.toFixed(2)}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className={`w-4 h-4 md:w-5 md:h-5 ${textSecondaryClass}`} />
                            ) : (
                              <ChevronDown
                                className={`w-4 h-4 md:w-5 md:h-5 ${textSecondaryClass}`}
                              />
                            )}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="mt-2 md:mt-3 space-y-1.5 md:space-y-2 pl-3 md:pl-5">
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
                                    className={`${
                                      darkMode ? "bg-gray-900/50 border border-gray-700/50" : "bg-white/60"
                                    } rounded-lg md:rounded-xl p-2 md:p-3`}
                                  >
                                    <div className="flex justify-between items-center mb-1.5 md:mb-2">
                                      <p className={`text-sm md:text-base font-medium ${textClass} truncate`}>
                                        {subcategory}
                                      </p>
                                      <span
                                        className={`text-xs md:text-sm font-semibold flex-shrink-0 ml-2 ${textSecondaryClass}`}
                                      >
                                        €{spent.toFixed(2)}
                                      </span>
                                    </div>
                                    <div className={`h-1.5 md:h-2 rounded-full ${
                                      darkMode ? "bg-gray-800" : "bg-purple-100"
                                    } overflow-hidden`}>
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
                  categoryTotalsForBudgets.find((item) => item.category === category)?.total || 0;
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

      {activeView === "goals" && (
        <div className="space-y-4 sm:space-y-6 animate-in">
          {/* Header - Optimizado para móvil */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className={`text-xl sm:text-2xl md:text-3xl font-bold ${textClass}`}>
                {t("goals.title")}
              </h3>
              <p className={`text-xs sm:text-sm ${textSecondaryClass} mt-1`}>
                {t("goals.progress")}
              </p>
            </div>
            <button
              onClick={onOpenGoals}
              className="px-4 py-2.5 sm:px-5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 touch-manipulation"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Gestionar Objetivos</span>
            </button>
          </div>

          {/* Objetivo de Ahorro Mensual - Diseño Simplificado y Visual */}
          {goals?.totalSavingsGoal > 0 && income > 0 && (() => {
                const today = new Date();
                const currentYear = today.getFullYear();
                const currentMonth = today.getMonth() + 1;
                const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
                const daysPassed = today.getDate();
                
                const currentMonthExpenses = categoryTotalsForBudgets.reduce((sum, item) => sum + item.total, 0);
                
            // Lógica corregida: calcular límite de gasto máximo
            const maxSpendingAllowed = income - goals.totalSavingsGoal; // Máximo que puede gastar
            const monthlySavings = income - currentMonthExpenses; // Ahorro actual
            const overspending = Math.max(0, currentMonthExpenses - maxSpendingAllowed); // Cuánto se ha pasado
            const remainingSpending = Math.max(0, maxSpendingAllowed - currentMonthExpenses); // Cuánto puede gastar aún
            
            // Estados
            const hasOverspent = currentMonthExpenses > maxSpendingAllowed; // Se ha pasado del límite
            const isOnTrack = monthlySavings >= goals.totalSavingsGoal; // Ha alcanzado el objetivo
            const isCloseToLimit = currentMonthExpenses >= maxSpendingAllowed * 0.9; // Cerca del límite (90%)
            
            // Progreso basado en el límite de gasto (no en el ahorro)
            const spendingProgress = maxSpendingAllowed > 0 
              ? Math.min((currentMonthExpenses / maxSpendingAllowed) * 100, 100) 
              : 0;
                
                return (
              <div
                className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border-2 ${
                      darkMode 
                    ? "bg-gradient-to-br from-purple-900/40 via-blue-900/30 to-purple-800/40 border-purple-700/50" 
                    : "bg-gradient-to-br from-purple-50 via-blue-50 to-purple-100 border-purple-200"
                } p-4 sm:p-6 md:p-8 shadow-xl transition-all duration-300 animate-in`}
                style={{
                  boxShadow: darkMode
                    ? "0 10px 40px rgba(139, 92, 246, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05) inset"
                    : "0 10px 40px rgba(139, 92, 246, 0.15), 0 0 0 1px rgba(139, 92, 246, 0.1) inset",
                  animationDelay: "0.1s",
                }}
              >
                {/* Icono decorativo de fondo - Responsive */}
                <div className={`absolute top-2 right-2 sm:top-4 sm:right-4 opacity-10 ${darkMode ? "text-purple-400" : "text-purple-600"}`}>
                  <Target className="w-20 h-20 sm:w-32 sm:h-32" strokeWidth={1} />
                        </div>
                        
                <div className="relative z-10">
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl ${
                      darkMode ? "bg-purple-600/30" : "bg-purple-100"
                    }`}>
                      <Target className={`w-5 h-5 sm:w-6 sm:h-6 ${darkMode ? "text-purple-300" : "text-purple-600"}`} />
                          </div>
                    <div>
                      <h4 className={`text-base sm:text-lg font-bold ${textClass}`}>
                        Ahorro Mensual
                      </h4>
                      <p className={`text-xs sm:text-sm ${textSecondaryClass}`}>
                        Objetivo: €{goals.totalSavingsGoal.toFixed(2)} este mes
                          </p>
                        </div>
                      </div>
                      
                  {/* Números grandes y claros - Optimizado para móvil */}
                  <div className="mb-4 sm:mb-6">
                    <div className="flex items-baseline gap-2 sm:gap-3 mb-2">
                      <span className={`text-4xl sm:text-5xl md:text-6xl font-bold leading-tight ${
                        hasOverspent 
                          ? "text-red-500" 
                          : isOnTrack 
                          ? "text-green-500" 
                          : isCloseToLimit
                          ? "text-yellow-500"
                          : "text-purple-600"
                      }`}>
                        {hasOverspent 
                          ? `+€${overspending.toFixed(0)}`
                          : isOnTrack
                          ? `€${monthlySavings.toFixed(0)}`
                          : `€${currentMonthExpenses.toFixed(0)}`}
                      </span>
                      <span className={`text-xl sm:text-2xl ${textSecondaryClass}`}>
                        / €{maxSpendingAllowed.toFixed(0)}
                        </span>
                      </div>
                    <p className={`text-xs sm:text-sm font-medium ${
                      hasOverspent 
                        ? "text-red-400" 
                        : isOnTrack 
                        ? "text-green-500" 
                        : isCloseToLimit
                        ? "text-yellow-500"
                        : textSecondaryClass
                    }`}>
                      {hasOverspent 
                        ? `⚠️ Te has pasado €${overspending.toFixed(2)} del límite. No podrás ahorrar ${goals.totalSavingsGoal.toFixed(0)}€ este mes.`
                        : isOnTrack 
                        ? `✅ ¡Objetivo alcanzado! Has ahorrado €${monthlySavings.toFixed(2)} este mes 🎉`
                        : isCloseToLimit
                        ? `⚠️ Cuidado: Te quedan €${remainingSpending.toFixed(2)} disponibles. Estás cerca del límite.`
                        : `Puedes gastar €${remainingSpending.toFixed(2)} más este mes para alcanzar tu objetivo de ahorro`}
                    </p>
                    </div>

                  {/* Barra de progreso grande y visual - Responsive */}
                  <div className="mb-4">
                    <div className={`h-5 sm:h-6 rounded-full overflow-hidden ${
                      darkMode ? "bg-gray-800/50" : "bg-white/60"
                    } shadow-inner`}>
                      <div
                        className={`h-full transition-all duration-700 ease-out ${
                          hasOverspent
                            ? "bg-gradient-to-r from-red-500 to-red-600"
                            : isOnTrack
                            ? "bg-gradient-to-r from-green-500 to-green-600"
                            : isCloseToLimit
                            ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                            : "bg-gradient-to-r from-purple-600 to-blue-600"
                        } flex items-center justify-end pr-2`}
                        style={{ width: `${Math.min(spendingProgress, 100)}%` }}
                      >
                        {spendingProgress > 15 && (
                          <span className="text-[10px] sm:text-xs font-bold text-white">
                            {spendingProgress.toFixed(0)}%
                        </span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className={`text-[10px] sm:text-xs ${textSecondaryClass}`}>
                        {hasOverspent 
                          ? `⚠️ ${spendingProgress.toFixed(0)}% del límite (te has pasado)`
                          : `${spendingProgress.toFixed(0)}% del límite de gasto usado`}
                      </p>
                      {!hasOverspent && (
                        <p className={`text-[10px] sm:text-xs font-medium ${
                          isCloseToLimit ? "text-yellow-500" : "text-green-500"
                        }`}>
                          {remainingSpending.toFixed(0)}€ disponibles
                            </p>
                          )}
                        </div>
                  </div>

                  {/* Info rápida - Grid responsive */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-4">
                    <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all active:scale-95 ${
                      darkMode ? "bg-gray-800/50" : "bg-white/60"
                    }`}>
                      <p className={`text-[10px] sm:text-xs ${textSecondaryClass} mb-1`}>Día {daysPassed}/{daysInMonth}</p>
                      <p className={`text-xs sm:text-sm font-semibold ${textClass}`}>
                        {((daysPassed / daysInMonth) * 100).toFixed(0)}% del mes
                      </p>
                    </div>
                    <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all active:scale-95 ${
                      darkMode ? "bg-gray-800/50" : "bg-white/60"
                    }`}>
                      <p className={`text-[10px] sm:text-xs ${textSecondaryClass} mb-1`}>
                        {hasOverspent ? "Te has pasado" : "Ahorro actual"}
                      </p>
                      <p className={`text-xs sm:text-sm font-semibold ${
                        hasOverspent ? "text-red-500" : isOnTrack ? "text-green-500" : textClass
                      }`}>
                        {hasOverspent 
                          ? `+€${overspending.toFixed(0)}`
                          : `€${monthlySavings.toFixed(0)}`}
                            </p>
                          </div>
                        </div>
                    </div>
              </div>
                );
              })()}

          {/* Objetivos de Límite de Gasto por Categoría */}
          {goals?.categoryGoals && Object.keys(goals.categoryGoals).length > 0 && (
            <div className="animate-in" style={{ animationDelay: "0.2s" }}>
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <div className={`p-1.5 sm:p-2 rounded-lg ${darkMode ? "bg-orange-600/20" : "bg-orange-100"}`}>
                  <AlertTriangle className={`w-4 h-4 sm:w-5 sm:h-5 ${darkMode ? "text-orange-400" : "text-orange-600"}`} />
                </div>
                <h4 className={`text-lg sm:text-xl font-bold ${textClass}`}>
                  Límites de Gasto
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {Object.entries(goals.categoryGoals).map(([category, goalAmount]) => {
                const today = new Date();
                const currentYear = today.getFullYear();
                const currentMonth = today.getMonth() + 1;
                const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
                const daysPassed = today.getDate();
                
                const categoryTotal = categoryTotalsForBudgets.find((ct) => ct.category === category)?.total || 0;
                const expectedSpendingByNow = (goalAmount * daysPassed) / daysInMonth;
                const progress = expectedSpendingByNow > 0 
                  ? Math.min((categoryTotal / expectedSpendingByNow) * 100, 200) 
                  : 0;
                const dailySpendingRate = daysPassed > 0 ? categoryTotal / daysPassed : 0;
                const projectedMonthlySpending = dailySpendingRate * daysInMonth;
                
                const isExceeded = categoryTotal > goalAmount;
                const isOnTrack = projectedMonthlySpending <= goalAmount;
                const isAhead = categoryTotal <= expectedSpendingByNow;
                
                  const status = isExceeded ? "exceeded" : progress >= 100 ? "warning" : isAhead ? "ok" : "warning";
                const categoryColor = getCategoryColor(categories[category]);
                  const percentageUsed = (categoryTotal / goalAmount) * 100;

                return (
                  <div
                    key={category}
                      className={`relative overflow-hidden rounded-xl sm:rounded-2xl border-2 ${
                        status === "exceeded"
                          ? darkMode 
                            ? "bg-red-900/20 border-red-500/50" 
                            : "bg-red-50 border-red-300"
                          : status === "warning"
                          ? darkMode
                            ? "bg-yellow-900/20 border-yellow-500/50"
                            : "bg-yellow-50 border-yellow-300"
                          : darkMode 
                            ? "bg-gray-800 border-gray-700" 
                            : "bg-white border-purple-200"
                      } p-4 sm:p-5 shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] touch-manipulation`}
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      {/* Barra de color lateral */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1"
                        style={{ backgroundColor: categoryColor }}
                      />
                      
                      <div className="ml-3">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            <div
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: `${categoryColor}20` }}
                            >
                              <span className="text-base sm:text-lg">📊</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`font-bold text-base sm:text-lg ${textClass} truncate`}>{category}</p>
                              <p className={`text-[10px] sm:text-xs ${textSecondaryClass}`}>
                                No gastar más de €{goalAmount.toFixed(0)}/mes
                        </p>
                      </div>
                          </div>
                          <div className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold flex-shrink-0 ${
                        status === "exceeded"
                              ? "bg-red-500 text-white"
                          : status === "warning"
                              ? "bg-yellow-500 text-white"
                              : "bg-green-500 text-white"
                      }`}>
                            {status === "exceeded" ? "⚠️" : status === "warning" ? "⚠️" : "✓"}
                    </div>
                        </div>

                        {/* Números grandes - Responsive */}
                        <div className="mb-3 sm:mb-4">
                          <div className="flex items-baseline gap-1.5 sm:gap-2 mb-1">
                            <span className={`text-2xl sm:text-3xl font-bold ${
                            status === "exceeded"
                                ? "text-red-500"
                              : status === "warning"
                                ? "text-yellow-500"
                                : "text-green-500"
                          }`}>
                              €{categoryTotal.toFixed(0)}
                          </span>
                            <span className={`text-sm sm:text-lg ${textSecondaryClass}`}>
                              / €{goalAmount.toFixed(0)}
                          </span>
                        </div>
                          <p className={`text-xs sm:text-sm font-medium ${
                          status === "exceeded"
                              ? "text-red-500"
                            : status === "warning"
                              ? "text-yellow-500"
                              : "text-green-500"
                          }`}>
                            {isExceeded 
                              ? `Has superado por €${(categoryTotal - goalAmount).toFixed(2)}` 
                              : `Te quedan €${Math.max(0, goalAmount - categoryTotal).toFixed(2)} disponibles`}
                        </p>
                      </div>

                        {/* Barra de progreso - Responsive */}
                        <div className={`h-3 sm:h-4 rounded-full overflow-hidden mb-3 ${
                          darkMode ? "bg-gray-700/50" : "bg-gray-200"
                        }`}>
                          <div
                            className={`h-full transition-all duration-500 ${
                          status === "exceeded"
                                ? "bg-gradient-to-r from-red-500 to-red-600"
                            : status === "warning"
                                ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                                : "bg-gradient-to-r from-green-500 to-green-600"
                            }`}
                            style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                          />
                    </div>
                    
                        {/* Info rápida */}
                        <div className="flex justify-between items-center text-xs">
                        <span className={textSecondaryClass}>
                            {percentageUsed.toFixed(0)}% usado
                        </span>
                          {!isOnTrack && !isExceeded && (
                            <span className={`font-medium ${
                              darkMode ? "text-orange-400" : "text-orange-600"
                            }`}>
                              Proyección: €{projectedMonthlySpending.toFixed(0)}
                            </span>
                          )}
                      </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Objetivos a Largo Plazo */}
          {goals?.longTermGoals && goals.longTermGoals.filter((g) => g && g.name && (g.status === "active" || !g.status)).length > 0 && (
            <div className="animate-in" style={{ animationDelay: "0.3s" }}>
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <div className={`p-1.5 sm:p-2 rounded-lg ${darkMode ? "bg-blue-600/20" : "bg-blue-100"}`}>
                  <Target className={`w-4 h-4 sm:w-5 sm:h-5 ${darkMode ? "text-blue-400" : "text-blue-600"}`} />
                </div>
                <h4 className={`text-lg sm:text-xl font-bold ${textClass}`}>
                  Objetivos a Largo Plazo
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {goals.longTermGoals
                  .filter((g) => g && g.name && (g.status === "active" || !g.status || g.status !== "completed"))
                  .map((goal) => {
                    if (!goal || !goal.name) return null;
                    
                    // Manejo seguro de datos
                    const currentAmount = parseFloat(goal.currentAmount) || 0;
                    const targetAmount = parseFloat(goal.targetAmount) || 0;
                    if (targetAmount === 0) return null; // No mostrar objetivos sin objetivo definido
                    
                    const progress = getLongTermGoalProgress(goal);
                    const isComplete = currentAmount >= targetAmount;
                    const progressPercentage = progress.progress || 0;

                    return (
                      <div
                        key={goal.id}
                        className={`relative overflow-hidden rounded-xl sm:rounded-2xl border-2 ${
                          isComplete
                            ? darkMode
                              ? "bg-green-900/20 border-green-500/50"
                              : "bg-green-50 border-green-300"
                            : progressPercentage >= 80
                            ? darkMode
                              ? "bg-yellow-900/20 border-yellow-500/50"
                              : "bg-yellow-50 border-yellow-300"
                            : darkMode
                            ? "bg-gray-800 border-gray-700"
                            : "bg-white border-purple-200"
                        } p-4 sm:p-6 shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] touch-manipulation`}
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                      >
                        {/* Icono grande de fondo - Responsive */}
                        <div className={`absolute top-2 right-2 sm:top-4 sm:right-4 opacity-10 ${
                          darkMode ? "text-purple-400" : "text-purple-600"
                        }`}>
                          <Target className="w-16 h-16 sm:w-24 sm:h-24" strokeWidth={1} />
                        </div>

                        <div className="relative z-10">
                          <div className="flex items-start justify-between mb-3 sm:mb-4">
                            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                              <span className="text-3xl sm:text-4xl flex-shrink-0">{goal.icon || "🎯"}</span>
                              <div className="min-w-0 flex-1">
                                <h4 className={`font-bold text-base sm:text-lg ${textClass} truncate`}>
                                  {goal.name}
                                </h4>
                                {progress.daysRemaining !== null && (
                                  <p className={`text-[10px] sm:text-xs flex items-center gap-1 ${textSecondaryClass} mt-1`}>
                                    <Calendar className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">{progress.daysRemaining} días restantes</span>
                                  </p>
                                )}
                              </div>
                            </div>
                            {isComplete && (
                              <div className="px-2 sm:px-3 py-1 rounded-full bg-green-500 text-white text-[10px] sm:text-xs font-bold flex-shrink-0">
                                ✓
                              </div>
                            )}
                          </div>

                          {/* Números grandes - Responsive */}
                          <div className="mb-3 sm:mb-4">
                            <div className="flex items-baseline gap-1.5 sm:gap-2 mb-1">
                              <span className={`text-3xl sm:text-4xl font-bold ${
                                isComplete
                                  ? "text-green-500"
                                  : progressPercentage >= 80
                                  ? "text-yellow-500"
                                  : "text-purple-600"
                              }`}>
                                €{currentAmount.toFixed(0)}
                              </span>
                              <span className={`text-lg sm:text-xl ${textSecondaryClass}`}>
                                / €{targetAmount.toFixed(0)}
                            </span>
                          </div>
                            <p className={`text-xs sm:text-sm font-medium ${
                              isComplete
                                ? "text-green-500"
                                : progressPercentage >= 80
                                ? "text-yellow-500"
                                : textSecondaryClass
                            }`}>
                              {isComplete 
                                ? "¡Objetivo completado! 🎉" 
                                : `Faltan €${progress.remaining.toFixed(2)}`}
                            </p>
                        </div>

                          {/* Barra de progreso grande - Responsive */}
                          <div className={`h-4 sm:h-5 rounded-full overflow-hidden mb-3 sm:mb-4 ${
                            darkMode ? "bg-gray-700/50" : "bg-gray-200"
                          }`}>
                            <div
                              className={`h-full transition-all duration-700 ease-out ${
                                isComplete
                                  ? "bg-gradient-to-r from-green-500 to-green-600"
                                  : progressPercentage >= 80
                                  ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                                  : "bg-gradient-to-r from-purple-600 to-blue-600"
                              } flex items-center justify-end pr-2`}
                              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                            >
                              {progressPercentage > 20 && (
                                <span className="text-[10px] sm:text-xs font-bold text-white">
                                  {progressPercentage.toFixed(0)}%
                                </span>
                      )}
                    </div>
                          </div>
                          {progressPercentage <= 20 && (
                            <p className={`text-[10px] sm:text-xs text-center mb-3 sm:mb-4 ${textSecondaryClass}`}>
                              {progressPercentage.toFixed(0)}% completado
                            </p>
                          )}

                          {/* Info rápida - Responsive */}
                          <div className="grid grid-cols-2 gap-2 sm:gap-3">
                            <div className={`p-2 rounded-lg transition-all active:scale-95 ${
                              darkMode ? "bg-gray-700/50" : "bg-gray-100"
                            }`}>
                              <p className={`text-[10px] sm:text-xs ${textSecondaryClass} mb-1`}>Mensual</p>
                              <p className={`text-xs sm:text-sm font-bold ${textClass}`}>
                                €{(goal.monthlyContribution || progress.monthlyContribution || 0).toFixed(0)}
                              </p>
                            </div>
                            <div className={`p-2 rounded-lg transition-all active:scale-95 ${
                              darkMode ? "bg-gray-700/50" : "bg-gray-100"
                            }`}>
                              <p className={`text-[10px] sm:text-xs ${textSecondaryClass} mb-1`}>Restante</p>
                              <p className={`text-xs sm:text-sm font-bold ${textClass}`}>
                                €{progress.remaining.toFixed(0)}
                              </p>
                            </div>
                          </div>
                        </div>
                  </div>
                );
              })}
            </div>
            </div>
          )}

          {/* Estado vacío */}
          {(!goals?.categoryGoals || Object.keys(goals.categoryGoals).length === 0) &&
           (!goals?.longTermGoals || goals.longTermGoals.filter((g) => g && g.name && (g.status === "active" || !g.status || g.status !== "completed")).length === 0) && (
            <div className={`text-center py-16 rounded-2xl border ${
              darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-purple-200"
            }`}>
              <Target className={`w-20 h-20 ${textSecondaryClass} mx-auto mb-4 opacity-50`} />
              <p className={`text-xl font-semibold ${textClass} mb-2`}>
                No tienes objetivos configurados
              </p>
              <p className={`${textSecondaryClass} mb-6`}>
                Crea límites de gasto o objetivos de ahorro para comenzar
              </p>
              <button
                onClick={onOpenGoals}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-lg transition-all"
              >
                Crear Objetivo
              </button>
            </div>
          )}
        </div>
      )}

      {activeView === "recent" && (
        <div className={`${cardClass} rounded-xl sm:rounded-2xl p-2 sm:p-4 border shadow-lg`}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h3 className={`text-sm sm:text-lg font-bold ${textClass}`}>
              Últimos Gastos Añadidos
            </h3>
            <span className={`text-xs sm:text-sm ${textSecondaryClass}`}>
              ({recentExpenses.length})
            </span>
          </div>

          {recentExpenses.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Clock className={`w-12 h-12 sm:w-16 sm:h-16 ${textSecondaryClass} mx-auto mb-3 sm:mb-4`} />
              <p className={`text-base sm:text-xl font-semibold ${textClass} mb-1 sm:mb-2`}>
                No hay gastos todavía
              </p>
              <p className={`text-xs sm:text-sm ${textSecondaryClass}`}>
                Añade tu primer gasto para comenzar
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 sm:space-y-2">
              {recentExpenses.map((expense) => (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  onEdit={onEditExpense}
                  onDelete={(exp) => onRequestDelete({
                    type: "expense",
                    id: exp.id,
                  })}
                  darkMode={darkMode}
                  isMobile={isMobile}
                />
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
