import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  Calendar,
  // Car,

  // Dumbbell,
  Filter,
  // Gamepad2,
  // Heart,
  // Home,
  LucideIcon,
  Plus,
  RefreshCw,
  // Repeat,
  Search,
  // ShoppingBag,
  Sparkles,
  Table as TableIcon,
  Target,
  // UtensilsCrossed,
  X,
} from "@/components/icons";
import BottomSheet from "../../../components/BottomSheet";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  lazy,
  Suspense,
} from "react";
import { getTransition } from "../../../config/framerMotion";
import { useTranslation } from "../../../contexts/LanguageContext";
import { formatCurrency } from "../../../utils/currency";
// @ts-ignore - No hay tipos para estos módulos JS
import { getCategoryColor } from "../../../services/firestoreService";
// @ts-ignore - No hay tipos para estos módulos JS
import { getLongTermGoalProgress } from "../../../services/goalsService";
const AIAssistant = lazy(() => import("./AIAssistant"));
const ExpensesChart = lazy(() => import("./ExpensesChart"));
// @ts-ignore - No hay tipos para estos módulos JS

import VoiceExpenseButton from "./VoiceExpenseButton.tsx";
import FinancialSummaryWidget from "../../../components/FinancialSummaryWidget";
import TransactionList from "./TransactionList";
import { useHaptics } from "../../../hooks/useHaptics";
import { useHapticFeedback } from "../../../hooks/useHapticFeedback";

// ============================================
// TYPES & INTERFACES
// ============================================
import { Expense } from "../../../types";

interface Category {
  subcategories?: string[];
  color?: string;
  [key: string]: any;
}

interface Categories {
  [key: string]: Category;
}

interface CategoryTotal {
  category: string;
  total: number;
}

interface Budgets {
  [category: string]: number;
}

interface Goals {
  totalSavingsGoal?: number;
  monthlySavingsGoal?: number;
  categoryGoals?: { [category: string]: number };
  longTermGoals?: LongTermGoal[];
  monthlyHistory?: { [key: string]: any };
  achievements?: any;
}

interface LongTermGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  monthlyContribution?: number;
  icon?: string;
  status?: "active" | "completed" | "paused";
}

interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  category: string;
  subcategory: string;
  dayOfMonth: number;
  frequency: string;
  paymentMethod: string;
  active: boolean;
  endDate?: string;
}

interface ExpensesByCategory {
  [category: string]: {
    [subcategory: string]: Expense[];
  };
}

interface GoalsSummary {
  savings: number;
  goal: number;
  progress: number;
  isAhead: boolean;
}

interface MainContentProps {
  cardClass: string;
  textClass: string;
  textSecondaryClass: string;
  darkMode: boolean;
  totalExpenses: number;
  filteredExpenses: Expense[];
  showFilters: boolean;
  onToggleFilters: () => void;
  filterPeriodType: "month" | "year" | "all";
  onFilterPeriodTypeChange: (value: "month" | "year" | "all") => void;
  selectedMonth: string;
  onMonthChange: (value: string) => void;
  selectedYear: string;
  onYearChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  onClearFilters: () => void;
  categories: Categories;
  activeView: "table" | "chart" | "assistant" | "goals" | "budgets";
  onChangeView: (
    view: "table" | "chart" | "assistant" | "goals" | "budgets"
  ) => void;
  expensesByCategory: ExpensesByCategory;
  expandedCategories: { [category: string]: boolean };
  onToggleCategory: (category: string) => void;
  onAddExpenseClick: () => void;
  onEditExpense: (expense: Expense) => void;
  onRequestDelete: (payload: any) => void;
  categoryTotals: CategoryTotal[];
  categoryTotalsForBudgets: CategoryTotal[];
  budgets: Budgets;
  recentExpenses: Expense[];
  recurringExpenses?: RecurringExpense[];
  goals: Goals | null;
  income: number;
  onOpenGoals: () => void;
  onAddExpenseFromAI: (expense: any) => Promise<void>;
  allExpenses: Expense[];
  showNotification: (message: string, type?: string) => void;
  voiceSettings: import("./VoiceExpenseButton").VoiceSettings;
  isLoading?: boolean;
  onRefresh?: () => Promise<void>;
}

// ============================================
// SUB-COMPONENTES MEMOIZADOS
// ============================================
interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  darkMode: boolean;
  textSecondaryClass: string;
  textClass: string;
  color?: string;
}

const StatCard = memo<StatCardProps>(
  ({
    icon: Icon,
    label,
    value,
    darkMode,
    textSecondaryClass,
    textClass,
    color = "purple",
  }) => (
    <div
      className={`rounded-lg md:rounded-2xl p-1.5 md:p-5 border backdrop-blur-xl transition-all md:hover:scale-[1.02] ${darkMode
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
          className={`p-1 md:p-2.5 rounded md:rounded-xl mb-1 md:mb-3 ${darkMode ? `bg-${color}-600/20` : `bg-${color}-100/50`
            }`}
        >
          <Icon className={`w-3 h-3 md:w-5 md:h-5 ${textSecondaryClass}`} />
        </div>
        <span
          className={`text-[9px] md:text-xs font-semibold mb-0.5 md:mb-1.5 uppercase tracking-wide ${textSecondaryClass}`}
        >
          {label}
        </span>
        <p
          className={`text-xs md:text-2xl lg:text-3xl font-bold ${textClass} leading-tight`}
        >
          {value}
        </p>
      </div>
    </div>
  )
);

StatCard.displayName = "StatCard";

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
const MainContent = memo<MainContentProps>(
  ({
    // cardClass,
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
    // recentExpenses,
    // recurringExpenses,
    goals,
    income,
    onOpenGoals,
    onAddExpenseFromAI,
    allExpenses,
    showNotification,
    voiceSettings,
    isLoading = false,
    onRefresh,
  }) => {
    const { t } = useTranslation();
    const [isMobile, setIsMobile] = useState(false);
    const { lightImpact } = useHaptics();
    const haptic = useHapticFeedback();

    // Estado para visibilidad de la navbar (UX tipo X/Twitter)
    const [isNavBarVisible, setIsNavBarVisible] = useState(true);
    const lastScrollY = useRef(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const [searchQuery, setSearchQuery] = useState("");
    const [isPending, startTransition] = useTransition();
    // Subcategorías expandibles por categoría+subcategoría
    const [expandedSubcategories, setExpandedSubcategories] = useState<
      Record<string, boolean>
    >({});

    // Pull to Refresh State
    const [pullChange, setPullChange] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const pullStartPoint = useRef(0);
    const pullRate = 0.35; // Resistencia del pull
    const refreshThreshold = 80;

    const onTouchStart = (e: React.TouchEvent) => {
      if (scrollContainerRef.current?.scrollTop === 0) {
        pullStartPoint.current = e.targetTouches[0].screenY;
      }
    };

    const onTouchMove = (e: React.TouchEvent) => {
      if (!pullStartPoint.current) return;

      const currentY = e.targetTouches[0].screenY;
      const pullDistance = currentY - pullStartPoint.current;

      if (pullDistance > 0 && (scrollContainerRef.current?.scrollTop || 0) <= 0) {
        // Prevenir scroll nativo si estamos haciendo pull
        if (pullDistance < refreshThreshold * 2) {
          // Solo prevenir si estamos en la zona de pull "controlada"
          // e.preventDefault() no funciona en eventos pasivos de React, 
          // se maneja con CSS overscroll-behavior
        }
        setPullChange(pullDistance * pullRate);
      } else {
        setPullChange(0);
      }
    };

    const onTouchEnd = async () => {
      if (!pullStartPoint.current) return;

      if (pullChange >= refreshThreshold && onRefresh) {
        setIsRefreshing(true);
        setPullChange(refreshThreshold); // Mantener en posición de carga

        // Feedback háptico al soltar para refresh
        haptic.light();

        await onRefresh();

        // Feedback háptico de éxito
        haptic.success();

        setIsRefreshing(false);
      }

      setPullChange(0);
      pullStartPoint.current = 0;
    };


    // Handler optimizado para cambio de vista (con useTransition)
    const handleViewChange = useCallback(
      (view: "table" | "chart" | "assistant" | "goals" | "budgets") => {
        lightImpact();
        startTransition(() => {
          onChangeView(view);
        });
        // Scroll inmediato (urgente)
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        if (showFilters) {
          onToggleFilters();
        }
      },
      [onChangeView, showFilters, onToggleFilters]
    );

    // ============================================
    // EFFECTS
    // ============================================
    useEffect(() => {
      const checkMobile = () => setIsMobile(window.innerWidth < 640);
      checkMobile();
      window.addEventListener("resize", checkMobile);
      return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
      // Solo aplicar lógica en móvil
      if (window.innerWidth >= 640) return;

      const currentScrollY = e.currentTarget.scrollTop;

      // Umbral mínimo de scroll para evitar "jitter"
      if (Math.abs(currentScrollY - lastScrollY.current) < 10) return;

      // Lógica: 
      // 1. Si estamos arriba del todo (< 50px), mostrar siempre
      // 2. Si bajamos (current > last) y estamos más abajo de 100px, ocultar
      // 3. Si subimos (current < last), mostrar

      if (currentScrollY < 50) {
        setIsNavBarVisible(true);
      } else if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsNavBarVisible(false); // Ocultar al bajar
      } else if (currentScrollY < lastScrollY.current) {
        setIsNavBarVisible(true); // Mostrar al subir
      }

      lastScrollY.current = currentScrollY;
    }, []);


    // ============================================
    // MEMOIZED VALUES
    // ============================================
    // const categoryIcons: { [key: string]: LucideIcon } = useMemo(
    //   () => ({
    //     Salud: Heart,
    //     Gimnasio: Dumbbell,
    //     Ocio: Gamepad2,
    //     Suscripciones: Repeat,
    //     Comida: UtensilsCrossed,
    //     Transporte: Car,
    //     Compras: ShoppingBag,
    //     Hogar: Home,
    //     "Coche/Moto": Car,
    //     Alimentacion: UtensilsCrossed,
    //     Educacion: Repeat,
    //   }),
    //   []
    // );

    // _averageDaily removed

    // const frequencyLabels = useMemo(
    //   () => ({
    //     monthly: t("recurring.frequencyMonthly"),
    //     quarterly: t("recurring.frequencyQuarterly"),
    //     semiannual: t("recurring.frequencySemiannual"),
    //     annual: t("recurring.frequencyAnnual"),
    //   }),
    //   [t]
    // );

    // const recurringFrequencyMap = useMemo(() => {
    //   return (recurringExpenses || []).reduce(
    //     (acc: { [key: string]: string }, recurring) => {
    //       if (recurring?.id) {
    //         acc[recurring.id] = recurring.frequency || "monthly";
    //       }
    //       return acc;
    //     },
    //     {}
    //   );
    // }, [recurringExpenses]);

    const goalsSummary = useMemo<GoalsSummary | null>(() => {
      if (!goals?.totalSavingsGoal || !income || income === 0) {
        return null;
      }
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
      const daysPassed = today.getDate();
      const currentMonthExpenses = categoryTotalsForBudgets.reduce(
        (sum, item) => sum + item.total,
        0
      );
      const monthlySavings = income - currentMonthExpenses;
      const expectedSavingsByNow =
        (goals.totalSavingsGoal * daysPassed) / daysInMonth;
      const progress =
        expectedSavingsByNow > 0
          ? Math.min((monthlySavings / expectedSavingsByNow) * 100, 200)
          : 0;
      return {
        savings: monthlySavings,
        goal: goals.totalSavingsGoal,
        progress,
        isAhead: monthlySavings >= expectedSavingsByNow,
      };
    }, [goals, income, categoryTotalsForBudgets]);

    // Memoizar colores de categorías
    const categoryColors = useMemo(() => {
      return Object.keys(categories).reduce(
        (acc: { [key: string]: string }, cat) => {
          acc[cat] = getCategoryColor(categories[cat]);
          return acc;
        },
        {}
      );
    }, [categories]);

    // Memoizar gastos filtrados por búsqueda
    const searchFilteredCategories = useMemo(() => {
      if (!searchQuery.trim()) return expensesByCategory;

      const query = searchQuery.toLowerCase();
      return Object.entries(expensesByCategory).reduce(
        (acc: ExpensesByCategory, [category, subcategories]) => {
          const filtered = Object.entries(subcategories).reduce(
            (subAcc: { [key: string]: Expense[] }, [subcat, exps]) => {
              const matchingExpenses = exps.filter(
                (exp) =>
                  exp.name?.toLowerCase().includes(query) ||
                  category.toLowerCase().includes(query) ||
                  subcat?.toLowerCase().includes(query)
              );
              if (matchingExpenses.length > 0) {
                subAcc[subcat] = matchingExpenses;
              }
              return subAcc;
            },
            {}
          );

          if (Object.keys(filtered).length > 0) {
            acc[category] = filtered;
          }
          return acc;
        },
        {}
      );
    }, [expensesByCategory, searchQuery]);

    // ============================================
    // CALLBACKS
    // ============================================
    const handleClearSearch = useCallback(() => {
      setSearchQuery("");
    }, []);

    const handleDeleteExpense = useCallback(
      (exp: Expense) => {
        onRequestDelete({
          type: "expense",
          id: exp.id,
        });
      },
      [onRequestDelete]
    );

    // const handlePieClick = useCallback(
    //   (data: any, index: number) => {
    //     if (activeIndex === index) {
    //       setActiveIndex(null);
    //       setClickedCategory(null);
    //     } else {
    //       setActiveIndex(index);
    //       setClickedCategory(data);
    //     }
    //   },
    //   [activeIndex]
    // );

    // const handleCloseTooltip = useCallback((e: React.MouseEvent) => {
    //   e.stopPropagation();
    //   setActiveIndex(null);
    //   setClickedCategory(null);
    // }, []);

    // ============================================
    // RENDER
    // ============================================
    return (
      <>
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="max-w-7xl mx-auto px-2 md:px-4 py-2 md:py-6 main-content-container relative content-scrollable flex-1 w-full"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Pull to Refresh Indicator */}
          <div
            className="fixed top-0 left-0 w-full flex justify-center items-center pointer-events-none z-50"
            style={{
              height: `${Math.max(pullChange, isRefreshing ? 80 : 0)}px`,
              opacity: Math.min(pullChange / 50, 1),
              transition: isRefreshing ? 'height 0.3s ease' : pullChange === 0 ? 'height 0.3s ease' : 'none',
              overflow: 'hidden'
            }}
          >
            <div className="bg-white/90 dark:bg-gray-800/90 rounded-full p-2 shadow-lg backdrop-blur mb-4 transform translate-y-4">
              <RefreshCw
                className={`w-6 h-6 text-purple-600 ${isRefreshing ? 'animate-spin' : ''}`}
                style={{ transform: `rotate(${pullChange * 2}deg)` }}
              />
            </div>
          </div>
          {/* Estadísticas con estilo Liquid Glass - Solo en vista principal */}
          {activeView === "table" && (
            <div className="relative mb-3 md:mb-6">
              <div className="grid grid-cols-4 gap-1.5 md:gap-4">
                <StatCard
                  icon={Target}
                  label={t("common.total")}
                  value={formatCurrency(totalExpenses)}
                  darkMode={darkMode}
                  textClass={textClass}
                  textSecondaryClass={textSecondaryClass}
                  color="purple"
                />
                <StatCard
                  icon={BarChart3}
                  label={t("common.expenses")}
                  value={filteredExpenses.length}
                  darkMode={darkMode}
                  textClass={textClass}
                  textSecondaryClass={textSecondaryClass}
                  color="blue"
                />

                {goalsSummary ? (
                  <div
                    className={`rounded-lg md:rounded-2xl p-1.5 md:p-5 border backdrop-blur-xl transition-all md:hover:scale-[1.02] ${darkMode
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
                        className={`p-1 md:p-2.5 rounded md:rounded-xl mb-1 md:mb-3 ${darkMode ? "bg-green-600/20" : "bg-green-100/50"
                          }`}
                      >
                        <Sparkles
                          className={`w-3 h-3 md:w-5 md:h-5 ${goalsSummary.isAhead
                            ? darkMode
                              ? "text-green-400"
                              : "text-green-500"
                            : darkMode
                              ? "text-gray-400"
                              : "text-gray-500"
                            }`}
                        />
                      </div>
                      <span
                        className={`text-[9px] md:text-xs font-semibold mb-0.5 md:mb-1.5 uppercase tracking-wide ${textSecondaryClass}`}
                      >
                        Objetivos
                      </span>
                      <p
                        className={`text-xs md:text-2xl lg:text-3xl font-bold ${goalsSummary.isAhead
                          ? darkMode
                            ? "text-green-400"
                            : "text-green-500"
                          : goalsSummary.progress >= 80
                            ? darkMode
                              ? "text-yellow-400"
                              : "text-yellow-500"
                            : darkMode
                              ? "text-purple-400"
                              : "text-purple-600"
                          } leading-tight`}
                      >
                        {formatCurrency(goalsSummary.savings)}
                      </p>
                      <p
                        className={`text-[8px] md:text-xs ${textSecondaryClass} mt-0.5`}
                      >
                        {goalsSummary.progress.toFixed(0)}%
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`rounded-lg md:rounded-2xl p-1.5 md:p-5 border backdrop-blur-xl opacity-50 ${darkMode
                      ? "bg-gray-800/30 border-gray-700/20"
                      : "bg-white/30 border-white/20"
                      }`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div
                        className={`p-1 md:p-2.5 rounded md:rounded-xl mb-1 md:mb-3 ${darkMode ? "bg-gray-700/20" : "bg-gray-100/50"
                          }`}
                      >
                        <Target
                          className={`w-3 h-3 md:w-5 md:h-5 ${textSecondaryClass}`}
                        />
                      </div>
                      <span
                        className={`text-[9px] md:text-xs font-semibold mb-0.5 md:mb-1.5 uppercase tracking-wide ${textSecondaryClass}`}
                      >
                        Objetivos
                      </span>
                      <p
                        className={`text-xs md:text-2xl lg:text-3xl font-bold ${textSecondaryClass} leading-tight`}
                      >
                        --
                      </p>
                    </div>
                  </div>
                )}

                {/* Resumen mensual - 4ª tarjeta clickable */}
                <div className="flex items-center justify-center">
                  <FinancialSummaryWidget
                    income={income}
                    totalExpenses={totalExpenses}
                    darkMode={darkMode}
                    onEditIncome={onOpenGoals}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Botón de filtros avanzados - Ahora con bottom calculado desde la barra */}
          {(activeView === "table" || activeView === "chart") && (
            <div
              className="fixed right-4 z-40 md:hidden"
              style={{
                bottom: "calc(5rem + env(safe-area-inset-bottom, 0px))",
              }}
            >
              <button
                onClick={onToggleFilters}
                className={`p-4 rounded-full shadow-2xl border transition-all active:scale-95 ${showFilters
                  ? darkMode
                    ? "bg-purple-600 border-purple-500/40 text-white"
                    : "bg-purple-600 border-purple-400/40 text-white"
                  : darkMode
                    ? "bg-gray-800 border-gray-700/40 text-gray-300"
                    : "bg-white border-gray-200/40 text-purple-600"
                  }`}
              >
                <Filter className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* ✅ Botón de voz ahora está en el navbar - No se necesita flotante */}
          {/* Panel de filtros avanzados para móvil - Bottom sheet style */}
          {showFilters &&
            (activeView === "table" || activeView === "chart") && (
              <BottomSheet
                visible={showFilters}
                onClose={onToggleFilters}
                title={t("filters.title")}
                darkMode={darkMode}
                maxHeight="90vh"
              >
                <div className="px-4 py-4 space-y-4">
                  {/* Filtros rápidos */}
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${textClass}`}
                    >
                      Filtros rápidos
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          const today = new Date();
                          onFilterPeriodTypeChange("month");
                          onMonthChange(today.toISOString().slice(0, 7));
                          onToggleFilters();
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${filterPeriodType === "month" &&
                          selectedMonth ===
                          new Date().toISOString().slice(0, 7)
                          ? darkMode
                            ? "bg-purple-600 text-white"
                            : "bg-purple-600 text-white"
                          : darkMode
                            ? "bg-gray-700 text-gray-300"
                            : "bg-white/80 text-purple-700 border border-purple-200"
                          }`}
                      >
                        Este mes
                      </button>
                      <button
                        onClick={() => {
                          const today = new Date();
                          const lastMonth = new Date(
                            today.getFullYear(),
                            today.getMonth() - 1,
                            1
                          );
                          onFilterPeriodTypeChange("month");
                          onMonthChange(
                            lastMonth.toISOString().slice(0, 7)
                          );
                          onToggleFilters();
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${filterPeriodType === "month" &&
                          selectedMonth !==
                          new Date().toISOString().slice(0, 7)
                          ? darkMode
                            ? "bg-purple-600 text-white"
                            : "bg-purple-600 text-white"
                          : darkMode
                            ? "bg-gray-700 text-gray-300"
                            : "bg-white/80 text-purple-700 border border-purple-200"
                          }`}
                      >
                        Mes anterior
                      </button>
                      <button
                        onClick={() => {
                          onFilterPeriodTypeChange("year");
                          onYearChange(new Date().getFullYear().toString());
                          onToggleFilters();
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${filterPeriodType === "year"
                          ? darkMode
                            ? "bg-purple-600 text-white"
                            : "bg-purple-600 text-white"
                          : darkMode
                            ? "bg-gray-700 text-gray-300"
                            : "bg-white/80 text-purple-700 border border-purple-200"
                          }`}
                      >
                        Este año
                      </button>
                      <button
                        onClick={() => {
                          onFilterPeriodTypeChange("all");
                          onToggleFilters();
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${filterPeriodType === "all"
                          ? darkMode
                            ? "bg-purple-600 text-white"
                            : "bg-purple-600 text-white"
                          : darkMode
                            ? "bg-gray-700 text-gray-300"
                            : "bg-white/80 text-purple-700 border border-purple-200"
                          }`}
                      >
                        Todos
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${textClass}`}
                    >
                      {t("filters.period")}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => {
                          const today = new Date();
                          onFilterPeriodTypeChange("month");
                          onMonthChange(today.toISOString().slice(0, 7));
                          onToggleFilters();
                        }}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${filterPeriodType === "month"
                          ? darkMode
                            ? "bg-purple-600 text-white"
                            : "bg-purple-600 text-white"
                          : darkMode
                            ? "bg-gray-700 text-gray-300"
                            : "bg-gray-100 text-gray-700"
                          }`}
                      >
                        Mes
                      </button>
                      <button
                        onClick={() => {
                          onFilterPeriodTypeChange("year");
                          onYearChange(new Date().getFullYear().toString());
                          onToggleFilters();
                        }}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${filterPeriodType === "year"
                          ? darkMode
                            ? "bg-purple-600 text-white"
                            : "bg-purple-600 text-white"
                          : darkMode
                            ? "bg-gray-700 text-gray-300"
                            : "bg-gray-100 text-gray-700"
                          }`}
                      >
                        Año
                      </button>
                      <button
                        onClick={() => {
                          onFilterPeriodTypeChange("all");
                          onToggleFilters();
                        }}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${filterPeriodType === "all"
                          ? darkMode
                            ? "bg-purple-600 text-white"
                            : "bg-purple-600 text-white"
                          : darkMode
                            ? "bg-gray-700 text-gray-300"
                            : "bg-gray-100 text-gray-700"
                          }`}
                      >
                        Todos
                      </button>
                    </div>
                  </div>

                  {filterPeriodType === "month" && (
                    <div>
                      <label
                        className={`block text-sm font-medium mb-2 ${textClass}`}
                      >
                        {t("filters.selectMonth")}
                      </label>
                      <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => {
                          onMonthChange(e.target.value);
                          onToggleFilters();
                        }}
                        className={`w-full px-4 py-2.5 rounded-xl border text-base transition-all ${darkMode
                          ? "bg-gray-800 border-gray-700 text-gray-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40"
                          : "bg-white border-purple-200 text-purple-900 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/40"
                          }`}
                      />
                    </div>
                  )}

                  {filterPeriodType === "year" && (
                    <div>
                      <label
                        className={`block text-sm font-medium mb-2 ${textClass}`}
                      >
                        {t("filters.selectYear")}
                      </label>
                      <input
                        type="number"
                        min="2020"
                        max={new Date().getFullYear()}
                        value={selectedYear}
                        onChange={(e) => {
                          onYearChange(e.target.value);
                          onToggleFilters();
                        }}
                        className={`w-full px-4 py-2.5 rounded-xl border text-base transition-all ${darkMode
                          ? "bg-gray-800 border-gray-700 text-gray-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40"
                          : "bg-white border-purple-200 text-purple-900 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/40"
                          }`}
                      />
                    </div>
                  )}

                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${textClass}`}
                    >
                      {t("filters.category")}
                    </label>
                    <select
                      value={selectedCategory}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        onCategoryChange(e.target.value);
                        onToggleFilters();
                      }}
                      className={`w-full px-4 py-2.5 rounded-xl border text-base transition-all ${darkMode
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

                  {onClearFilters && (
                    <div className="pt-4">
                      <button
                        onClick={() => {
                          onClearFilters();
                          onToggleFilters();
                        }}
                        className={`w-full px-4 py-3 rounded-xl text-sm font-medium transition-all ${darkMode
                          ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                          : "bg-purple-100 hover:bg-purple-200 text-purple-700"
                          }`}
                      >
                        {t("filters.clear")}
                      </button>
                    </div>
                  )}
                </div>
              </BottomSheet>
            )}

          {/* Barra superior estilo Liquid Glass para desktop */}
          {(activeView === "table" || activeView === "chart") && (
            <div className="hidden md:block mb-6">
              <div
                className={`rounded-3xl border backdrop-blur-2xl p-4 shadow-xl ${darkMode
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
                  <div className="flex items-center gap-3 flex-1 min-w-0 flex-wrap">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/50 dark:bg-gray-700/50 border border-white/60 dark:border-gray-600/40">
                      <Filter className={`w-4 h-4 ${textSecondaryClass}`} />
                      <span
                        className={`text-xs font-medium ${textSecondaryClass}`}
                      >
                        {t("filters.title")}
                      </span>
                    </div>

                    <select
                      value={filterPeriodType}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        onFilterPeriodTypeChange(
                          e.target.value as "month" | "year" | "all"
                        )
                      }
                      className={`px-3 py-2 rounded-xl border text-sm transition-all ${darkMode
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
                        className={`min-w-[140px] px-3 py-2 rounded-xl border text-sm transition-all ${darkMode
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
                        className={`min-w-[100px] px-3 py-2 rounded-xl border text-sm transition-all ${darkMode
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
                      className={`min-w-[140px] px-3 py-2 rounded-xl border text-sm transition-all ${darkMode
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
                        className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${darkMode
                          ? "bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/40 text-gray-200"
                          : "bg-white/70 hover:bg-white border border-white/60 text-purple-700"
                          } focus:ring-2 focus:ring-purple-500/20 focus:outline-none`}
                      >
                        {t("filters.clear")}
                      </button>
                    )}
                  </div>

                  {activeView === "table" && (
                    <button
                      onClick={onAddExpenseClick}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-xl transition-all active:scale-95 whitespace-nowrap"
                      style={{
                        boxShadow:
                          "0 4px 16px rgba(139, 92, 246, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset",
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
              className={`inline-flex gap-1 p-1.5 rounded-2xl border backdrop-blur-xl ${darkMode
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
              {[
                {
                  view: "table" as const,
                  icon: TableIcon,
                  label: t("views.table"),
                },
                {
                  view: "chart" as const,
                  icon: BarChart3,
                  label: t("views.chart"),
                },
                {
                  view: "assistant" as const,
                  icon: Bot,
                  label: t("views.assistant"),
                },
                {
                  view: "goals" as const,
                  icon: Target,
                  label: t("views.goals"),
                },
              ].map(({ view, icon: Icon, label }) => (
                <button
                  key={view}
                  onClick={() => handleViewChange(view)}
                  disabled={isPending}
                  className={`relative flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${activeView === view
                    ? darkMode
                      ? "bg-purple-600/90 text-white shadow-lg"
                      : "bg-white text-purple-600 shadow-md"
                    : darkMode
                      ? "text-gray-300 hover:text-white hover:bg-gray-700/30"
                      : "text-purple-600 hover:text-purple-700 hover:bg-white/50"
                    }`}
                  style={
                    activeView === view
                      ? {
                        boxShadow: darkMode
                          ? "0 2px 8px rgba(139, 92, 246, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset"
                          : "0 2px 8px rgba(139, 92, 246, 0.2), 0 0 0 1px rgba(139, 92, 246, 0.1) inset",
                      }
                      : {}
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
          {/* VISTAS CON ANIMATEPRESENECE */}
          <AnimatePresence mode="wait">
            {activeView === "table" && (
              <motion.div
                key="table"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={getTransition("smooth")}
                className="max-w-7xl mx-auto"
              >
                {/* Buscador */}
                {/* Buscador - Mostrar si hay gastos (expensesByCategory) O si hay una búsqueda activa */}
                {(Object.keys(expensesByCategory).length > 0 || searchQuery) && (
                  <div className="mb-3 sm:mb-4">
                    <div
                      className={`relative ${darkMode ? "bg-gray-800/50" : "bg-white/60"
                        } rounded-lg md:rounded-xl border ${darkMode ? "border-gray-700/40" : "border-white/40"
                        } backdrop-blur-xl`}
                    >
                      <Search
                        className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 ${textSecondaryClass}`}
                      />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar gastos por nombre, categoría o subcategoría..."
                        className={`w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-lg md:rounded-xl bg-transparent ${textClass} placeholder:${textSecondaryClass} focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm sm:text-base`}
                      />
                      {searchQuery && (
                        <button
                          onClick={handleClearSearch}
                          className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${textSecondaryClass} hover:opacity-70 transition-opacity`}
                        >
                          <X className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <TransactionList
                  expensesByCategory={searchFilteredCategories}
                  categories={categories}
                  expandedCategories={expandedCategories}
                  onToggleCategory={onToggleCategory}
                  expandedSubcategories={expandedSubcategories}
                  setExpandedSubcategories={setExpandedSubcategories}
                  searchQuery={searchQuery}
                  darkMode={darkMode}
                  textClass={textClass}
                  textSecondaryClass={textSecondaryClass}
                  onEditExpense={onEditExpense}
                  onDeleteExpense={handleDeleteExpense}
                  categoryColors={categoryColors}
                  isMobile={isMobile}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* VISTA DE GRÁFICOS */}
          <AnimatePresence mode="wait">
            {activeView === "chart" && (
              <motion.div
                key="chart"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={getTransition("smooth")}
              >
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center h-96">
                      <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
                    </div>
                  }
                >
                  <ExpensesChart
                    categoryTotals={categoryTotals}
                    categories={categories}
                    totalExpenses={totalExpenses}
                    darkMode={darkMode}
                    textClass={textClass}
                    textSecondaryClass={textSecondaryClass}
                    expandedCategories={expandedCategories}
                    onToggleCategory={onToggleCategory}
                    expensesByCategory={expensesByCategory}
                    filteredExpenses={filteredExpenses}
                    filterPeriodType={filterPeriodType}
                    selectedMonth={selectedMonth || ""}
                  />
                </Suspense>
              </motion.div>
            )}
          </AnimatePresence>

          {/* VISTA DEL ASISTENTE IA - CON onClose CRÍTICO */}
          {activeView === "assistant" && (
            <motion.div
              key="assistant"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={getTransition("smooth")}
              className="w-full"
              style={{ minHeight: "calc(100vh - 200px)" }}
            >
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-full py-10">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-b-4 border-purple-500" />
                      <p className={`text-sm ${textSecondaryClass}`}>
                        Cargando asistente IA...
                      </p>
                    </div>
                  </div>
                }
              >
                <AIAssistant
                  darkMode={darkMode}
                  textClass={textClass}
                  textSecondaryClass={textSecondaryClass}
                  categories={categories}
                  addExpense={onAddExpenseFromAI}
                  isActive={true}
                  allExpenses={allExpenses}
                  income={income}
                  budgets={budgets}
                  goals={goals}
                  categoryTotals={categoryTotalsForBudgets}
                  isLoading={isLoading}
                />
              </Suspense>
            </motion.div>
          )}

          {/* VISTA DE OBJETIVOS */}
          <AnimatePresence mode="wait">
            {activeView === "goals" && (
              <motion.div
                key="goals"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={getTransition("smooth")}
                className="space-y-4 sm:space-y-6 animate-in"
              >
                {/* Header - Optimizado para móvil */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3
                      className={`text-xl sm:text-2xl md:text-3xl font-bold ${textClass}`}
                    >
                      {t("goals.title")}
                    </h3>
                    <p
                      className={`text-xs sm:text-sm ${textSecondaryClass} mt-1`}
                    >
                      {t("goals.progress")}
                    </p>
                  </div>
                  <button
                    onClick={onOpenGoals}
                    className="px-4 py-2.5 sm:px-5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 touch-manipulation"
                    style={{ WebkitTapHighlightColor: "transparent" }}
                  >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-sm sm:text-base">
                      Gestionar Objetivos
                    </span>
                  </button>
                </div>

                {/* Objetivo de Ahorro Mensual - Diseño Simplificado y Visual */}
                {(goals?.totalSavingsGoal ?? 0) > 0 &&
                  income > 0 &&
                  (() => {
                    const today = new Date();
                    const currentYear = today.getFullYear();
                    const currentMonth = today.getMonth() + 1;
                    const daysInMonth = new Date(
                      currentYear,
                      currentMonth,
                      0
                    ).getDate();
                    const daysPassed = today.getDate();

                    const currentMonthExpenses =
                      categoryTotalsForBudgets.reduce(
                        (sum, item) => sum + item.total,
                        0
                      );

                    // Lógica corregida: calcular límite de gasto máximo
                    const savingsGoal = goals?.totalSavingsGoal ?? 0;
                    const maxSpendingAllowed = income - savingsGoal; // Máximo que puede gastar
                    const monthlySavings = income - currentMonthExpenses; // Ahorro actual
                    const overspending = Math.max(
                      0,
                      currentMonthExpenses - maxSpendingAllowed
                    ); // Cuánto se ha pasado
                    const remainingSpending = Math.max(
                      0,
                      maxSpendingAllowed - currentMonthExpenses
                    ); // Cuánto puede gastar aún

                    // Estados
                    const hasOverspent =
                      currentMonthExpenses > maxSpendingAllowed; // Se ha pasado del límite
                    const isOnTrack = monthlySavings >= savingsGoal; // Ha alcanzado el objetivo
                    const isCloseToLimit =
                      currentMonthExpenses >= maxSpendingAllowed * 0.9; // Cerca del límite (90%)

                    // Progreso basado en el límite de gasto (no en el ahorro)
                    const spendingProgress =
                      maxSpendingAllowed > 0
                        ? Math.min(
                          (currentMonthExpenses / maxSpendingAllowed) * 100,
                          100
                        )
                        : 0;

                    return (
                      <div
                        className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border-2 ${darkMode
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
                        <div
                          className={`absolute top-2 right-2 sm:top-4 sm:right-4 opacity-10 ${darkMode ? "text-purple-400" : "text-purple-600"
                            }`}
                        >
                          <Target
                            className="w-20 h-20 sm:w-32 sm:h-32"
                            strokeWidth={1}
                          />
                        </div>

                        <div className="relative z-10">
                          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                            <div
                              className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl ${darkMode ? "bg-purple-600/30" : "bg-purple-100"
                                }`}
                            >
                              <Target
                                className={`w-5 h-5 sm:w-6 sm:h-6 ${darkMode
                                  ? "text-purple-300"
                                  : "text-purple-600"
                                  }`}
                              />
                            </div>
                            <div>
                              <h4
                                className={`text-base sm:text-lg font-bold ${textClass}`}
                              >
                                Ahorro Mensual
                              </h4>
                              <p
                                className={`text-xs sm:text-sm ${textSecondaryClass}`}
                              >
                                Objetivo: {formatCurrency(savingsGoal)} este mes
                              </p>
                            </div>
                          </div>

                          {/* Números grandes y claros - Optimizado para móvil */}
                          <div className="mb-4 sm:mb-6">
                            <div className="flex items-baseline gap-2 sm:gap-3 mb-2">
                              <span
                                className={`text-4xl sm:text-5xl md:text-6xl font-bold leading-tight ${hasOverspent
                                  ? "text-red-500"
                                  : isOnTrack
                                    ? "text-green-500"
                                    : isCloseToLimit
                                      ? "text-yellow-500"
                                      : "text-purple-600"
                                  }`}
                              >
                                {hasOverspent
                                  ? `+€${overspending.toFixed(0)}`
                                  : isOnTrack
                                    ? `€${monthlySavings.toFixed(0)}`
                                    : `€${currentMonthExpenses.toFixed(0)}`}
                              </span>
                              <span
                                className={`text-xl sm:text-2xl ${textSecondaryClass}`}
                              >
                                /{" "}
                                {formatCurrency(maxSpendingAllowed).replace(
                                  ".00",
                                  ""
                                )}
                              </span>
                            </div>
                            <p
                              className={`text-xs sm:text-sm font-medium ${hasOverspent
                                ? "text-red-400"
                                : isOnTrack
                                  ? "text-green-500"
                                  : isCloseToLimit
                                    ? "text-yellow-500"
                                    : textSecondaryClass
                                }`}
                            >
                              {hasOverspent
                                ? `⚠️ Te has pasado €${overspending.toFixed(
                                  2
                                )} del límite. No podrás ahorrar ${savingsGoal.toFixed(
                                  0
                                )}€ este mes.`
                                : isOnTrack
                                  ? `✅ ¡Objetivo alcanzado! Has ahorrado €${monthlySavings.toFixed(
                                    2
                                  )} este mes 🎉`
                                  : isCloseToLimit
                                    ? `⚠️ Cuidado: Te quedan €${remainingSpending.toFixed(
                                      2
                                    )} disponibles. Estás cerca del límite.`
                                    : `Puedes gastar €${remainingSpending.toFixed(
                                      2
                                    )} más este mes para alcanzar tu objetivo de ahorro`}
                            </p>
                          </div>

                          {/* Barra de progreso grande y visual - Responsive */}
                          <div className="mb-4">
                            <div
                              className={`h-5 sm:h-6 rounded-full overflow-hidden ${darkMode ? "bg-gray-800/50" : "bg-white/60"
                                } shadow-inner`}
                            >
                              <div
                                className={`h-full transition-all duration-700 ease-out ${hasOverspent
                                  ? "bg-gradient-to-r from-red-500 to-red-600"
                                  : isOnTrack
                                    ? "bg-gradient-to-r from-green-500 to-green-600"
                                    : isCloseToLimit
                                      ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                                      : "bg-gradient-to-r from-purple-600 to-blue-600"
                                  } flex items-center justify-end pr-2`}
                                style={{
                                  width: `${Math.min(spendingProgress, 100)}%`,
                                }}
                              >
                                {spendingProgress > 15 && (
                                  <span className="text-[10px] sm:text-xs font-bold text-white">
                                    {spendingProgress.toFixed(0)}%
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <p
                                className={`text-[10px] sm:text-xs ${textSecondaryClass}`}
                              >
                                {hasOverspent
                                  ? `⚠️ ${spendingProgress.toFixed(
                                    0
                                  )}% del límite (te has pasado)`
                                  : `${spendingProgress.toFixed(
                                    0
                                  )}% del límite de gasto usado`}
                              </p>
                              {!hasOverspent && (
                                <p
                                  className={`text-[10px] sm:text-xs font-medium ${isCloseToLimit
                                    ? "text-yellow-500"
                                    : "text-green-500"
                                    }`}
                                >
                                  {remainingSpending.toFixed(0)}€ disponibles
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Info rápida - Grid responsive */}
                          <div className="grid grid-cols-2 gap-2 sm:gap-4">
                            <div
                              className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all active:scale-95 ${darkMode ? "bg-gray-800/50" : "bg-white/60"
                                }`}
                            >
                              <p
                                className={`text-[10px] sm:text-xs ${textSecondaryClass} mb-1`}
                              >
                                Día {daysPassed}/{daysInMonth}
                              </p>
                              <p
                                className={`text-xs sm:text-sm font-semibold ${textClass}`}
                              >
                                {((daysPassed / daysInMonth) * 100).toFixed(0)}%
                                del mes
                              </p>
                            </div>
                            <div
                              className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all active:scale-95 ${darkMode ? "bg-gray-800/50" : "bg-white/60"
                                }`}
                            >
                              <p
                                className={`text-[10px] sm:text-xs ${textSecondaryClass} mb-1`}
                              >
                                {hasOverspent
                                  ? "Te has pasado"
                                  : "Ahorro actual"}
                              </p>
                              <p
                                className={`text-xs sm:text-sm font-semibold ${hasOverspent
                                  ? "text-red-500"
                                  : isOnTrack
                                    ? "text-green-500"
                                    : textClass
                                  }`}
                              >
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
                {goals?.categoryGoals &&
                  Object.keys(goals.categoryGoals).length > 0 && (
                    <div
                      className="animate-in"
                      style={{ animationDelay: "0.2s" }}
                    >
                      <div className="flex items-center gap-2 mb-3 sm:mb-4">
                        <div
                          className={`p-1.5 sm:p-2 rounded-lg ${darkMode ? "bg-orange-600/20" : "bg-orange-100"
                            }`}
                        >
                          <AlertTriangle
                            className={`w-4 h-4 sm:w-5 sm:h-5 ${darkMode ? "text-orange-400" : "text-orange-600"
                              }`}
                          />
                        </div>
                        <h4
                          className={`text-lg sm:text-xl font-bold ${textClass}`}
                        >
                          Límites de Gasto
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                        {Object.entries(goals.categoryGoals).map(
                          ([category, goalAmount]) => {
                            const today = new Date();
                            const currentYear = today.getFullYear();
                            const currentMonth = today.getMonth() + 1;
                            const daysInMonth = new Date(
                              currentYear,
                              currentMonth,
                              0
                            ).getDate();
                            const daysPassed = today.getDate();

                            const categoryTotal =
                              categoryTotalsForBudgets.find(
                                (ct) => ct.category === category
                              )?.total || 0;
                            const expectedSpendingByNow =
                              (goalAmount * daysPassed) / daysInMonth;
                            const progress =
                              expectedSpendingByNow > 0
                                ? Math.min(
                                  (categoryTotal / expectedSpendingByNow) *
                                  100,
                                  200
                                )
                                : 0;
                            const dailySpendingRate =
                              daysPassed > 0 ? categoryTotal / daysPassed : 0;
                            const projectedMonthlySpending =
                              dailySpendingRate * daysInMonth;

                            const isExceeded = categoryTotal > goalAmount;
                            const isOnTrack =
                              projectedMonthlySpending <= goalAmount;
                            const isAhead =
                              categoryTotal <= expectedSpendingByNow;

                            const status = isExceeded
                              ? "exceeded"
                              : progress >= 100
                                ? "warning"
                                : isAhead
                                  ? "ok"
                                  : "warning";
                            const categoryColor = getCategoryColor(
                              categories[category]
                            );
                            const percentageUsed =
                              (categoryTotal / goalAmount) * 100;

                            return (
                              <div
                                key={category}
                                className={`relative overflow-hidden rounded-xl sm:rounded-2xl border-2 ${status === "exceeded"
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
                                style={{
                                  WebkitTapHighlightColor: "transparent",
                                }}
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
                                        style={{
                                          backgroundColor: `${categoryColor}20`,
                                        }}
                                      >
                                        <span className="text-base sm:text-lg">
                                          📊
                                        </span>
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p
                                          className={`font-bold text-base sm:text-lg ${textClass} truncate`}
                                        >
                                          {category}
                                        </p>
                                        <p
                                          className={`text-[10px] sm:text-xs ${textSecondaryClass}`}
                                        >
                                          No gastar más de €
                                          {goalAmount.toFixed(0)}
                                          /mes
                                        </p>
                                      </div>
                                    </div>
                                    <div
                                      className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold flex-shrink-0 ${status === "exceeded"
                                        ? "bg-red-500 text-white"
                                        : status === "warning"
                                          ? "bg-yellow-500 text-white"
                                          : "bg-green-500 text-white"
                                        }`}
                                    >
                                      {status === "exceeded"
                                        ? "⚠️"
                                        : status === "warning"
                                          ? "⚠️"
                                          : "✓"}
                                    </div>
                                  </div>

                                  {/* Números grandes - Responsive */}
                                  <div className="mb-3 sm:mb-4">
                                    <div className="flex items-baseline gap-1.5 sm:gap-2 mb-1">
                                      <span
                                        className={`text-2xl sm:text-3xl font-bold ${status === "exceeded"
                                          ? "text-red-500"
                                          : status === "warning"
                                            ? "text-yellow-500"
                                            : "text-green-500"
                                          }`}
                                      >
                                        {formatCurrency(categoryTotal).replace(
                                          ".00",
                                          ""
                                        )}
                                      </span>
                                      <span
                                        className={`text-sm sm:text-lg ${textSecondaryClass}`}
                                      >
                                        /{" "}
                                        {formatCurrency(goalAmount).replace(
                                          ".00",
                                          ""
                                        )}
                                      </span>
                                    </div>
                                    <p
                                      className={`text-xs sm:text-sm font-medium ${status === "exceeded"
                                        ? "text-red-500"
                                        : status === "warning"
                                          ? "text-yellow-500"
                                          : "text-green-500"
                                        }`}
                                    >
                                      {isExceeded
                                        ? `Has superado por €${(
                                          categoryTotal - goalAmount
                                        ).toFixed(2)}`
                                        : `Te quedan €${Math.max(
                                          0,
                                          goalAmount - categoryTotal
                                        ).toFixed(2)} disponibles`}
                                    </p>
                                  </div>

                                  {/* Barra de progreso - Responsive */}
                                  <div
                                    className={`h-3 sm:h-4 rounded-full overflow-hidden mb-3 ${darkMode
                                      ? "bg-gray-700/50"
                                      : "bg-gray-200"
                                      }`}
                                  >
                                    <div
                                      className={`h-full transition-all duration-500 ${status === "exceeded"
                                        ? "bg-gradient-to-r from-red-500 to-red-600"
                                        : status === "warning"
                                          ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                                          : "bg-gradient-to-r from-green-500 to-green-600"
                                        }`}
                                      style={{
                                        width: `${Math.min(
                                          percentageUsed,
                                          100
                                        )}%`,
                                      }}
                                    />
                                  </div>

                                  {/* Info rápida */}
                                  <div className="flex justify-between items-center text-xs">
                                    <span className={textSecondaryClass}>
                                      {percentageUsed.toFixed(0)}% usado
                                    </span>
                                    {!isOnTrack && !isExceeded && (
                                      <span
                                        className={`font-medium ${darkMode
                                          ? "text-orange-400"
                                          : "text-orange-600"
                                          }`}
                                      >
                                        Proyección: €
                                        {projectedMonthlySpending.toFixed(0)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )}

                {/* Objetivos a Largo Plazo */}
                {goals?.longTermGoals &&
                  goals.longTermGoals.filter(
                    (g) => g && g.name && (g.status === "active" || !g.status)
                  ).length > 0 && (
                    <div
                      className="animate-in"
                      style={{ animationDelay: "0.3s" }}
                    >
                      <div className="flex items-center gap-2 mb-3 sm:mb-4">
                        <div
                          className={`p-1.5 sm:p-2 rounded-lg ${darkMode ? "bg-blue-600/20" : "bg-blue-100"
                            }`}
                        >
                          <Target
                            className={`w-4 h-4 sm:w-5 sm:h-5 ${darkMode ? "text-blue-400" : "text-blue-600"
                              }`}
                          />
                        </div>
                        <h4
                          className={`text-lg sm:text-xl font-bold ${textClass}`}
                        >
                          Objetivos a Largo Plazo
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                        {goals.longTermGoals
                          .filter(
                            (g) =>
                              g &&
                              g.name &&
                              (g.status === "active" ||
                                !g.status ||
                                g.status !== "completed")
                          )
                          .map((goal) => {
                            if (!goal || !goal.name) return null;

                            // Manejo seguro de datos
                            const currentAmount =
                              typeof goal.currentAmount === "number"
                                ? goal.currentAmount
                                : parseFloat(String(goal.currentAmount)) || 0;
                            const targetAmount =
                              typeof goal.targetAmount === "number"
                                ? goal.targetAmount
                                : parseFloat(String(goal.targetAmount)) || 0;
                            if (targetAmount === 0) return null; // No mostrar objetivos sin objetivo definido

                            const progress = getLongTermGoalProgress(goal);
                            const isComplete = currentAmount >= targetAmount;
                            const progressPercentage = progress.progress || 0;

                            return (
                              <div
                                key={goal.id}
                                className={`relative overflow-hidden rounded-xl sm:rounded-2xl border-2 ${isComplete
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
                                style={{
                                  WebkitTapHighlightColor: "transparent",
                                }}
                              >
                                {/* Icono grande de fondo - Responsive */}
                                <div
                                  className={`absolute top-2 right-2 sm:top-4 sm:right-4 opacity-10 ${darkMode
                                    ? "text-purple-400"
                                    : "text-purple-600"
                                    }`}
                                >
                                  <Target
                                    className="w-16 h-16 sm:w-24 sm:h-24"
                                    strokeWidth={1}
                                  />
                                </div>

                                <div className="relative z-10">
                                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                      <span className="text-3xl sm:text-4xl flex-shrink-0">
                                        {goal.icon || "🎯"}
                                      </span>
                                      <div className="min-w-0 flex-1">
                                        <h4
                                          className={`font-bold text-base sm:text-lg ${textClass} truncate`}
                                        >
                                          {goal.name}
                                        </h4>
                                        {progress.daysRemaining !== null && (
                                          <p
                                            className={`text-[10px] sm:text-xs flex items-center gap-1 ${textSecondaryClass} mt-1`}
                                          >
                                            <Calendar className="w-3 h-3 flex-shrink-0" />
                                            <span className="truncate">
                                              {progress.daysRemaining} días
                                              restantes
                                            </span>
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
                                      <span
                                        className={`text-3xl sm:text-4xl font-bold ${isComplete
                                          ? "text-green-500"
                                          : progressPercentage >= 80
                                            ? "text-yellow-500"
                                            : "text-purple-600"
                                          }`}
                                      >
                                        {formatCurrency(currentAmount).replace(
                                          ".00",
                                          ""
                                        )}
                                      </span>
                                      <span
                                        className={`text-lg sm:text-xl ${textSecondaryClass}`}
                                      >
                                        /{" "}
                                        {formatCurrency(targetAmount).replace(
                                          ".00",
                                          ""
                                        )}
                                      </span>
                                    </div>
                                    <p
                                      className={`text-xs sm:text-sm font-medium ${isComplete
                                        ? "text-green-500"
                                        : progressPercentage >= 80
                                          ? "text-yellow-500"
                                          : textSecondaryClass
                                        }`}
                                    >
                                      {isComplete
                                        ? "¡Objetivo completado! 🎉"
                                        : `Faltan €${progress.remaining.toFixed(
                                          2
                                        )}`}
                                    </p>
                                  </div>

                                  {/* Barra de progreso grande - Responsive */}
                                  <div
                                    className={`h-4 sm:h-5 rounded-full overflow-hidden mb-3 sm:mb-4 ${darkMode
                                      ? "bg-gray-700/50"
                                      : "bg-gray-200"
                                      }`}
                                  >
                                    <div
                                      className={`h-full transition-all duration-700 ease-out ${isComplete
                                        ? "bg-gradient-to-r from-green-500 to-green-600"
                                        : progressPercentage >= 80
                                          ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                                          : "bg-gradient-to-r from-purple-600 to-blue-600"
                                        } flex items-center justify-end pr-2`}
                                      style={{
                                        width: `${Math.min(
                                          progressPercentage,
                                          100
                                        )}%`,
                                      }}
                                    >
                                      {progressPercentage > 20 && (
                                        <span className="text-[10px] sm:text-xs font-bold text-white">
                                          {progressPercentage.toFixed(0)}%
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {progressPercentage <= 20 && (
                                    <p
                                      className={`text-[10px] sm:text-xs text-center mb-3 sm:mb-4 ${textSecondaryClass}`}
                                    >
                                      {progressPercentage.toFixed(0)}%
                                      completado
                                    </p>
                                  )}

                                  {/* Info rápida - Responsive */}
                                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                    <div
                                      className={`p-2 rounded-lg transition-all active:scale-95 ${darkMode
                                        ? "bg-gray-700/50"
                                        : "bg-gray-100"
                                        }`}
                                    >
                                      <p
                                        className={`text-[10px] sm:text-xs ${textSecondaryClass} mb-1`}
                                      >
                                        Mensual
                                      </p>
                                      <p
                                        className={`text-xs sm:text-sm font-bold ${textClass}`}
                                      >
                                        €
                                        {(
                                          goal.monthlyContribution ||
                                          progress.monthlyContribution ||
                                          0
                                        ).toFixed(0)}
                                      </p>
                                    </div>
                                    <div
                                      className={`p-2 rounded-lg transition-all active:scale-95 ${darkMode
                                        ? "bg-gray-700/50"
                                        : "bg-gray-100"
                                        }`}
                                    >
                                      <p
                                        className={`text-[10px] sm:text-xs ${textSecondaryClass} mb-1`}
                                      >
                                        Restante
                                      </p>
                                      <p
                                        className={`text-xs sm:text-sm font-bold ${textClass}`}
                                      >
                                        {formatCurrency(
                                          progress.remaining
                                        ).replace(".00", "")}
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
                {(!goals?.totalSavingsGoal || goals.totalSavingsGoal === 0) &&
                  (!goals?.categoryGoals ||
                    Object.keys(goals.categoryGoals).length === 0) &&
                  (!goals?.longTermGoals ||
                    goals.longTermGoals.filter(
                      (g) =>
                        g &&
                        g.name &&
                        (g.status === "active" ||
                          !g.status ||
                          g.status !== "completed")
                    ).length === 0) && (
                    <div
                      className={`text-center py-16 rounded-2xl border ${darkMode
                        ? "bg-gray-800 border-gray-700"
                        : "bg-white border-purple-200"
                        }`}
                    >
                      <Target
                        className={`w-20 h-20 ${textSecondaryClass} mx-auto mb-4 opacity-50`}
                      />
                      <p className={`text-xl font-semibold ${textClass} mb-2`}>
                        No tienes objetivos configurados
                      </p>
                      <p className={`${textSecondaryClass} mb-6`}>
                        Crea límites de gasto o objetivos de ahorro para
                        comenzar
                      </p>
                      <button
                        onClick={onOpenGoals}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-lg transition-all"
                      >
                        Crear Objetivo
                      </button>
                    </div>
                  )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* NAVBAR MÓVIL - FIJA AL FONDO */}
        <div
          className="md:hidden"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            width: '100%',
            zIndex: 999999,
            backgroundColor: darkMode ? '#0f172a' : '#ffffff',
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))',
            margin: 0,
            transform: isNavBarVisible ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 0.3s ease-in-out',
          }}
        >
          <div
            className={`max-w-md mx-auto rounded-t-2xl shadow-xl border-t border-l border-r backdrop-blur-xl ${darkMode
              ? "bg-gray-900/95 border-gray-700/50"
              : "bg-white/95 border-white/40"
              }`}
            style={{
              boxShadow: darkMode
                ? "0 -4px 20px 0 rgba(0, 0, 0, 0.4), 0 0 0 0.5px rgba(255, 255, 255, 0.05) inset"
                : "0 -4px 20px 0 rgba(31, 38, 135, 0.15), 0 0 0 0.5px rgba(255, 255, 255, 0.8) inset",
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
            }}
          >
            <div className="grid grid-cols-5 gap-0.5 p-1.5">
              <button
                onClick={() => handleViewChange("table")}
                disabled={isPending}
                className={`navbar-button flex flex-col items-center justify-center gap-0.5 px-0.5 py-1.5 rounded-xl font-medium transition-all relative ${activeView === "table"
                  ? darkMode
                    ? "bg-purple-600/90 text-white"
                    : "bg-purple-600/90 text-white"
                  : darkMode
                    ? "text-gray-300 hover:bg-gray-800/50"
                    : "text-purple-600 hover:bg-white/50"
                  }`}
              >
                <TableIcon className="w-4 h-4 flex-shrink-0" />
                <span className="text-[9px] leading-tight font-medium truncate max-w-full">
                  {t("views.table")}
                </span>
                {activeView === "table" && (
                  <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-white"></div>
                )}
              </button>

              <button
                onClick={() => handleViewChange("chart")}
                disabled={isPending}
                className={`navbar-button flex flex-col items-center justify-center gap-0.5 px-0.5 py-1.5 rounded-xl font-medium transition-all relative ${activeView === "chart"
                  ? darkMode
                    ? "bg-purple-600/90 text-white"
                    : "bg-purple-600/90 text-white"
                  : darkMode
                    ? "text-gray-300 hover:bg-gray-800/50"
                    : "text-purple-600 hover:bg-white/50"
                  }`}
              >
                <BarChart3 className="w-4 h-4 flex-shrink-0" />
                <span className="text-[9px] leading-tight font-medium truncate max-w-full">
                  {t("views.chart")}
                </span>
                {activeView === "chart" && (
                  <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-white"></div>
                )}
              </button>

              {/* ✅ Botones de acción centrales - Bien centrados */}
              <div className="flex items-center gap-2 justify-center">
                {/* Botón manual (+) */}
                <button
                  onClick={() => {
                    lightImpact();
                    onAddExpenseClick();
                  }}
                  className="navbar-button flex items-center justify-center p-3 rounded-xl bg-gradient-to-br from-purple-600 via-purple-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all active:scale-95 hover:scale-105"
                  style={{
                    WebkitTapHighlightColor: "transparent",
                    boxShadow: "0 4px 16px rgba(139, 92, 246, 0.4)"
                  }}
                  aria-label="Añadir gasto manual"
                >
                  <Plus className="w-6 h-6" strokeWidth={2.5} />
                </button>

                {/* Botón de voz (mic) */}
                <VoiceExpenseButton
                  darkMode={darkMode}
                  categories={Object.keys(categories)}
                  onAddExpense={onAddExpenseFromAI}
                  showNotification={showNotification}
                  hasFilterButton={false}
                  voiceSettings={voiceSettings}
                  isNavbarButton={true}
                />
              </div>

              {/* Asistente IA */}
              <button
                onClick={() => handleViewChange("assistant")}
                disabled={isPending}
                className={`navbar-button flex flex-col items-center justify-center gap-0.5 px-0.5 py-1.5 rounded-xl font-medium transition-all relative ${activeView === "assistant"
                  ? darkMode
                    ? "bg-purple-600/90 text-white"
                    : "bg-purple-600/90 text-white"
                  : darkMode
                    ? "text-gray-300 hover:bg-gray-800/50"
                    : "text-purple-600 hover:bg-white/50"
                  }`}
              >
                <Bot className="w-4 h-4 flex-shrink-0" />
                <span className="text-[9px] leading-tight font-medium truncate max-w-full">
                  {t("views.assistant")}
                </span>
                {activeView === "assistant" && (
                  <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-white"></div>
                )}
              </button>

              <button
                onClick={() => handleViewChange("goals")}
                disabled={isPending}
                className={`navbar-button flex flex-col items-center justify-center gap-0.5 px-0.5 py-1.5 rounded-xl font-medium transition-all relative ${activeView === "goals"
                  ? darkMode
                    ? "bg-purple-600/90 text-white"
                    : "bg-purple-600/90 text-white"
                  : darkMode
                    ? "text-gray-300 hover:bg-gray-800/50"
                    : "text-purple-600 hover:bg-white/50"
                  }`}
              >
                <Target className="w-4 h-4 flex-shrink-0" />
                <span className="text-[9px] leading-tight font-medium truncate max-w-full">
                  {t("views.goals")}
                </span>
                {activeView === "goals" && (
                  <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-white"></div>
                )}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }
);

MainContent.displayName = "MainContent";

export default MainContent;
