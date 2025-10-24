import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { IconReceipt, IconPlus, IconFilter } from '@tabler/icons-react';
import { useExpenseStore } from '../store/expenseStore';
import { ExpenseTable } from '../components/expenses/ExpenseTable';
import { ExpenseFilters } from '../components/expenses/ExpenseFilters';
import { AddExpenseDialog } from '../components/expenses/AddExpenseDialog';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { cn } from '../lib/utils';
import { formatCurrency, getMonthName } from '../lib/utils';

export const ExpensesPage = () => {
  const { t } = useTranslation();
  const darkMode = useExpenseStore((state) => state.darkMode);
  const filteredExpenses = useExpenseStore((state) => state.getFilteredExpenses());
  const totalExpenses = useExpenseStore((state) => state.getTotalExpenses());
  const selectedMonth = useExpenseStore((state) => state.selectedMonth);
  const selectedCategory = useExpenseStore((state) => state.selectedCategory);

  const [showFilters, setShowFilters] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);

  const textClass = darkMode ? 'text-gray-100' : 'text-purple-900';
  const textSecondaryClass = darkMode ? 'text-gray-400' : 'text-purple-600';

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <IconReceipt className="w-8 h-8 text-purple-600" />
          <div>
            <h1 className={cn('text-3xl font-bold', textClass)}>
              {t('expenses')}
            </h1>
            <p className={textSecondaryClass}>
              {getMonthName(selectedMonth)}
              {selectedCategory !== 'all' && ` • ${selectedCategory}`}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <IconFilter className="w-5 h-5" />
            <span className="hidden sm:inline">{t('filters')}</span>
          </Button>
          <Button onClick={() => setShowAddExpense(true)} className="gap-2">
            <IconPlus className="w-5 h-5" />
            {t('addExpense')}
          </Button>
        </div>
      </motion.div>

      {/* Resumen */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center md:text-left">
                <p className={cn('text-sm font-medium mb-1', textSecondaryClass)}>
                  Total Gastado
                </p>
                <p className={cn('text-3xl font-bold', textClass)}>
                  {formatCurrency(totalExpenses)}
                </p>
              </div>
              <div className="text-center md:text-left">
                <p className={cn('text-sm font-medium mb-1', textSecondaryClass)}>
                  Número de Gastos
                </p>
                <p className={cn('text-3xl font-bold', textClass)}>
                  {filteredExpenses.length}
                </p>
              </div>
              <div className="text-center md:text-left">
                <p className={cn('text-sm font-medium mb-1', textSecondaryClass)}>
                  Promedio por Gasto
                </p>
                <p className={cn('text-3xl font-bold', textClass)}>
                  {filteredExpenses.length > 0
                    ? formatCurrency(totalExpenses / filteredExpenses.length)
                    : formatCurrency(0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filtros */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ExpenseFilters />
        </motion.div>
      )}

      {/* Tabla de Gastos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <ExpenseTable expenses={filteredExpenses} />
      </motion.div>

      {/* Add Expense Dialog */}
      <AddExpenseDialog open={showAddExpense} onOpenChange={setShowAddExpense} />
    </div>
  );
};
