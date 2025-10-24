import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  IconTarget,
  IconTrash,
  IconAlertTriangle,
  IconPlus,
} from '@tabler/icons-react';
import { useExpenseStore } from '../store/expenseStore';
import { useSaveBudgets } from '../hooks/useExpenseQueries';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { cn } from '../lib/utils';
import { formatCurrency } from '../lib/utils';
import { toast } from 'sonner';

export const BudgetsPage = () => {
  const { t } = useTranslation();
  const darkMode = useExpenseStore((state) => state.darkMode);
  const categories = useExpenseStore((state) => state.categories);
  const budgets = useExpenseStore((state) => state.budgets);
  const categoryTotals = useExpenseStore((state) => state.getCategoryTotals());

  // TODO: Obtener userId del contexto de auth
  const userId = 'user-id-placeholder';
  const saveBudgets = useSaveBudgets(userId);

  const [budgetCategory, setBudgetCategory] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const textClass = darkMode ? 'text-gray-100' : 'text-purple-900';
  const textSecondaryClass = darkMode ? 'text-gray-400' : 'text-purple-600';

  const handleAddBudget = async (e) => {
    e.preventDefault();
    if (!budgetCategory || !budgetAmount) return;

    const updatedBudgets = {
      ...budgets,
      [budgetCategory]: parseFloat(budgetAmount),
    };

    try {
      await saveBudgets.mutateAsync(updatedBudgets);
      setBudgetCategory('');
      setBudgetAmount('');
      toast.success(t('budgetCreated'));
    } catch (error) {
      toast.error(t('errorOccurred'));
    }
  };

  const handleDeleteBudget = async (category) => {
    const updatedBudgets = { ...budgets };
    delete updatedBudgets[category];

    try {
      await saveBudgets.mutateAsync(updatedBudgets);
      setDeleteConfirm(null);
      toast.success(t('budgetDeleted'));
    } catch (error) {
      toast.error(t('errorOccurred'));
    }
  };

  const availableCategories = Object.keys(categories).filter(
    (cat) => !budgets[cat]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <IconTarget className="w-8 h-8 text-purple-600" />
              <CardTitle>{t('manageBudgets')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddBudget} className="space-y-4">
              <div>
                <Label htmlFor="budgetCategory">{t('category')}</Label>
                <select
                  id="budgetCategory"
                  value={budgetCategory}
                  onChange={(e) => setBudgetCategory(e.target.value)}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border focus:ring-2 focus:border-transparent transition-all mt-2',
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-purple-500'
                      : 'bg-white border-purple-200 text-purple-900 focus:ring-purple-500'
                  )}
                  required
                >
                  <option value="">{t('selectCategory')}</option>
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="budgetAmount">{t('monthlyBudget')}</Label>
                <Input
                  id="budgetAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  placeholder="0.00"
                  className="mt-2"
                  required
                />
              </div>

              <Button type="submit" className="w-full gap-2">
                <IconPlus className="w-5 h-5" />
                {t('createBudget')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Lista de Presupuestos */}
      <div className="space-y-3">
        <h3 className={cn('font-semibold text-lg', textClass)}>
          {t('activeBudgets')}
        </h3>

        {Object.entries(budgets).length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <IconTarget
                className={cn(
                  'w-16 h-16 mx-auto mb-4',
                  darkMode ? 'text-gray-400' : 'text-purple-600'
                )}
              />
              <p className={cn('text-xl font-semibold mb-2', textClass)}>
                {t('noBudgets')}
              </p>
              <p className={textSecondaryClass}>
                Crea un presupuesto para controlar tus gastos
              </p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(budgets).map(([category, budget], index) => {
            const spent =
              categoryTotals.find((ct) => ct.category === category)?.total || 0;
            const percentage = (spent / budget) * 100;
            const isOverBudget = spent > budget;

            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={cn(
                    isOverBudget && 'border-red-300 dark:border-red-800'
                  )}
                >
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className={cn('text-lg font-bold', textClass)}>
                          {category}
                        </h4>
                        <p className={cn('text-sm', textSecondaryClass)}>
                          Presupuesto: {formatCurrency(budget)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirm(category)}
                      >
                        <IconTrash className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className={cn('font-medium', textClass)}>
                          Gastado: {formatCurrency(spent)}
                        </span>
                        <span
                          className={cn(
                            'font-bold',
                            isOverBudget ? 'text-red-600' : 'text-green-600'
                          )}
                        >
                          {percentage.toFixed(1)}%
                        </span>
                      </div>

                      {/* Barra de progreso */}
                      <div
                        className={cn(
                          'w-full rounded-full h-3 overflow-hidden',
                          darkMode ? 'bg-gray-700' : 'bg-gray-200'
                        )}
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(percentage, 100)}%` }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className={cn(
                            'h-full transition-all duration-500',
                            isOverBudget
                              ? 'bg-gradient-to-r from-red-500 to-red-600'
                              : 'bg-gradient-to-r from-green-500 to-green-600'
                          )}
                        />
                      </div>

                      {isOverBudget && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-sm text-red-600 font-medium flex items-center gap-2 mt-2"
                        >
                          <IconAlertTriangle className="w-4 h-4" />
                          {t('budgetExceeded')} {formatCurrency(spent - budget)}
                        </motion.p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="max-w-sm w-full">
              <CardContent className="p-6 text-center">
                <IconAlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                <h3 className={cn('text-xl font-bold mb-2', textClass)}>
                  {t('deleteConfirm')}
                </h3>
                <p className={textSecondaryClass}>{t('deleteWarning')}</p>
                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1"
                  >
                    {t('cancel')}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteBudget(deleteConfirm)}
                    className="flex-1"
                  >
                    {t('delete')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
};
