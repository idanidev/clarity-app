import {
  IconChartBar,
  IconChartPie,
  IconClock,
  IconFilter,
  IconPlus,
  IconTable,
  IconTarget,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ExpensePieChart } from "../components/charts/ExpensePieChart";
import { AddExpenseDialog } from "../components/expenses/AddExpenseDialog";
import { ExpenseFilters } from "../components/expenses/ExpenseFilters";
import { ExpenseTable } from "../components/expenses/ExpenseTable";
import { Button } from "../components/ui/Button";
import { cn, formatCurrency, getMonthName } from "../lib/utils";
import { useExpenseStore } from "../store/expenseStore";

export const HomePage = () => {
  const { t } = useTranslation();
  const [activeView, setActiveView] = useState("table");
  const [showFilters, setShowFilters] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);

  const darkMode = useExpenseStore((state) => state.darkMode);
  const getFilteredExpenses = useExpenseStore(
    (state) => state.getFilteredExpenses
  );
  const getTotalExpenses = useExpenseStore((state) => state.getTotalExpenses);
  const getRecentExpenses = useExpenseStore((state) => state.getRecentExpenses);
  const selectedMonth = useExpenseStore((state) => state.selectedMonth);

  const filteredExpenses = getFilteredExpenses();
  const totalExpenses = getTotalExpenses();
  const recentExpenses = getRecentExpenses();
  
  const averagePerDay =
    filteredExpenses.length > 0 ? totalExpenses / new Date().getDate() : 0;

  const cardClass = cn(
    "rounded-2xl p-4 border shadow-lg",
    darkMode
      ? "bg-gray-800 border-gray-700"
      : "bg-white/80 backdrop-blur-sm border-white/60"
  );

  const textClass = darkMode ? "text-gray-100" : "text-purple-900";
  const textSecondaryClass = darkMode ? "text-gray-400" : "text-purple-600";

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cardClass}
        >
          <div className="flex flex-col items-center text-center">
            <IconTarget className={`w-5 h-5 mb-2 ${textSecondaryClass}`} />
            <span className={`text-xs font-medium mb-1 ${textSecondaryClass}`}>
              {t("total")}
            </span>
            <p className={`text-xl md:text-2xl font-bold ${textClass}`}>
              {formatCurrency(totalExpenses)}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={cardClass}
        >
          <div className="flex flex-col items-center text-center">
            <IconChartBar className={`w-5 h-5 mb-2 ${textSecondaryClass}`} />
            <span className={`text-xs font-medium mb-1 ${textSecondaryClass}`}>
              {t("expenses")}
            </span>
            <p className={`text-xl md:text-2xl font-bold ${textClass}`}>
              {filteredExpenses.length}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={cardClass}
        >
          <div className="flex flex-col items-center text-center">
            <IconClock className={`w-5 h-5 mb-2 ${textSecondaryClass}`} />
            <span className={`text-xs font-medium mb-1 ${textSecondaryClass}`}>
              {t("average")}
            </span>
            <p className={`text-xl md:text-2xl font-bold ${textClass}`}>
              {formatCurrency(averagePerDay)}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={() => setShowAddExpense(true)}
          className="flex-1 gap-2"
        >
          <IconPlus className="w-5 h-5" />
          <span className="hidden sm:inline">{t("addExpense")}</span>
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
        >
          <IconFilter className="w-5 h-5" />
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <ExpenseFilters />
        </motion.div>
      )}

      {/* View Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <Button
          variant={activeView === "table" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveView("table")}
          className="gap-2 whitespace-nowrap"
        >
          <IconTable className="w-5 h-5" />
          <span className="hidden sm:inline">{t("table")}</span>
        </Button>

        <Button
          variant={activeView === "chart" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveView("chart")}
          className="gap-2 whitespace-nowrap"
        >
          <IconChartPie className="w-5 h-5" />
          <span className="hidden sm:inline">{t("chart")}</span>
        </Button>

        <Button
          variant={activeView === "recent" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveView("recent")}
          className="gap-2 whitespace-nowrap"
        >
          <IconClock className="w-5 h-5" />
          <span className="hidden sm:inline">{t("recent")}</span>
        </Button>
      </div>

      {/* Content Views */}
      <motion.div
        key={activeView}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
      >
        {activeView === "table" && <ExpenseTable expenses={filteredExpenses} />}
        {activeView === "chart" && (
          <div className={cardClass}>
            <h3 className={`text-xl font-bold ${textClass} mb-6`}>
              {t("distribution")} - {getMonthName(selectedMonth)}
            </h3>
            <ExpensePieChart />
          </div>
        )}
        {activeView === "recent" && (
          <div className={cardClass}>
            <h3 className={`text-xl font-bold ${textClass} mb-4`}>
              {t("recent")} ({recentExpenses.length})
            </h3>
            <ExpenseTable expenses={recentExpenses} />
          </div>
        )}
      </motion.div>

      {/* Add Expense Dialog */}
      <AddExpenseDialog
        open={showAddExpense}
        onOpenChange={setShowAddExpense}
      />
    </div>
  );
};
