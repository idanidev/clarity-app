import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  IconPencil, 
  IconTrash, 
  IconChevronDown, 
  IconChevronUp,
  IconAlertTriangle 
} from '@tabler/icons-react';
import { useState } from 'react';
import { useExpenseStore } from '../../store/expenseStore';
import { formatCurrency, formatShortDate } from '../../lib/utils';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

export const ExpenseTable = ({ expenses }) => {
  const { t } = useTranslation();
  const darkMode = useExpenseStore((state) => state.darkMode);
  const [expandedCategories, setExpandedCategories] = useState({});

  const expensesByCategory = expenses.reduce((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = {};
    }
    if (!acc[expense.category][expense.subcategory]) {
      acc[expense.category][expense.subcategory] = [];
    }
    acc[expense.category][expense.subcategory].push(expense);
    return acc;
  }, {});

  const toggleCategory = (category) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const cardClass = cn(
    'rounded-2xl border shadow-lg overflow-hidden',
    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white/80 backdrop-blur-sm border-white/60'
  );

  const textClass = darkMode ? 'text-gray-100' : 'text-purple-900';
  const textSecondaryClass = darkMode ? 'text-gray-400' : 'text-purple-600';

  if (Object.keys(expensesByCategory).length === 0) {
    return (
      <div className={cardClass}>
        <div className="p-12 text-center">
          <IconAlertTriangle className={`w-16 h-16 ${textSecondaryClass} mx-auto mb-4`} />
          <p className={cn('text-xl font-semibold mb-2', textClass)}>
            {t('noExpenses')}
          </p>
          <p className={textSecondaryClass}>
            {t('addFirstExpense')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cardClass}>
      <div className="divide-y divide-purple-100 dark:divide-gray-700">
        {Object.entries(expensesByCategory).map(([category, subcategories]) => {
          const categoryTotal = Object.values(subcategories)
            .flat()
            .reduce((sum, exp) => sum + exp.amount, 0);
          const isExpanded = expandedCategories[category] !== false;

          return (
            <motion.div
              key={category}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <button
                onClick={() => toggleCategory(category)}
                className={cn(
                  'w-full px-6 py-4 flex justify-between items-center transition-all',
                  darkMode 
                    ? 'bg-gray-700/50 hover:bg-gray-700' 
                    : 'bg-purple-100/80 hover:bg-purple-100'
                )}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <IconChevronUp className={darkMode ? 'text-purple-400' : 'text-purple-600'} />
                  ) : (
                    <IconChevronDown className={darkMode ? 'text-purple-400' : 'text-purple-600'} />
                  )}
                  <span className={cn('text-lg font-bold', textClass)}>
                    {category}
                  </span>
                </div>
                <span className={cn('text-xl font-bold', textClass)}>
                  {formatCurrency(categoryTotal)}
                </span>
              </button>

              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  {Object.entries(subcategories).map(([subcategory, exps]) => (
                    <div 
                      key={subcategory} 
                      className={cn(
                        'border-b last:border-b-0',
                        darkMode ? 'border-gray-700' : 'border-purple-100'
                      )}
                    >
                      <div
                        className={cn(
                          'px-4 py-2 flex justify-between items-center',
                          darkMode ? 'bg-gray-700/30' : 'bg-purple-50/50'
                        )}
                      >
                        <span className={cn('font-medium', darkMode ? 'text-purple-300' : 'text-purple-800')}>
                          {subcategory}
                        </span>
                        <span className={cn('text-sm font-semibold', darkMode ? 'text-purple-400' : 'text-purple-700')}>
                          {formatCurrency(exps.reduce((sum, exp) => sum + exp.amount, 0))}
                        </span>
                      </div>
                      
                      <div className={cn('divide-y', darkMode ? 'divide-gray-700' : 'divide-purple-100')}>
                        {exps.map((expense) => (
                          <ExpenseRow key={expense.id} expense={expense} />
                        ))}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

const ExpenseRow = ({ expense }) => {
  const { t } = useTranslation();
  const darkMode = useExpenseStore((state) => state.darkMode);
  const [showActions, setShowActions] = useState(false);

  const textClass = darkMode ? 'text-gray-100' : 'text-purple-900';
  const textSecondaryClass = darkMode ? 'text-gray-400' : 'text-purple-600';

  const handleEdit = () => {
    console.log('Edit expense:', expense.id);
    // TODO: Implementar lógica de edición
  };

  const handleDelete = () => {
    console.log('Delete expense:', expense.id);
    // TODO: Implementar lógica de eliminación
  };

  return (
    <div
      className={cn(
        'px-4 py-3 transition-all flex justify-between items-center',
        darkMode ? 'hover:bg-gray-700/30' : 'hover:bg-white/30'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex-1">
        <p className={cn('text-sm font-semibold mb-1', textClass)}>
          {expense.name || t('noName')}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn('text-sm', textSecondaryClass)}>
            {formatShortDate(expense.date)}
          </span>
          <span
            className={cn(
              'text-xs px-2 py-1 rounded-full',
              darkMode ? 'bg-gray-700 text-gray-400' : 'bg-white/60 text-purple-600'
            )}
          >
            {expense.paymentMethod}
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <span className={cn('font-bold text-sm md:text-base', textClass)}>
          {formatCurrency(expense.amount)}
        </span>
        
        {showActions && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-1 md:gap-2"
          >
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleEdit}
              className="h-8 w-8 md:h-10 md:w-10"
            >
              <IconPencil className="w-3 h-3 md:w-4 md:h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleDelete}
              className="h-8 w-8 md:h-10 md:w-10"
            >
              <IconTrash className="w-3 h-3 md:w-4 md:h-4 text-red-600" />
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};
