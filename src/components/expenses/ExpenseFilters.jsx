import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useExpenseStore } from '../../store/expenseStore';
import { cn } from '../../lib/utils';

export const ExpenseFilters = () => {
  const { t } = useTranslation();
  const darkMode = useExpenseStore((state) => state.darkMode);
  const selectedMonth = useExpenseStore((state) => state.selectedMonth);
  const selectedCategory = useExpenseStore((state) => state.selectedCategory);
  const setSelectedMonth = useExpenseStore((state) => state.setSelectedMonth);
  const setSelectedCategory = useExpenseStore((state) => state.setSelectedCategory);
  const categories = useExpenseStore((state) => state.categories);

  const cardClass = cn(
    'rounded-2xl p-4 border shadow-lg',
    darkMode 
      ? 'bg-gray-800 border-gray-700' 
      : 'bg-white/80 backdrop-blur-sm border-white/60'
  );

  const inputClass = cn(
    'w-full px-3 py-2 rounded-xl border text-sm focus:ring-2 focus:border-transparent transition-all',
    darkMode
      ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-purple-500'
      : 'bg-white border-purple-200 text-purple-900 focus:ring-purple-500'
  );

  const textClass = darkMode ? 'text-gray-100' : 'text-purple-900';

  return (
    <motion.div 
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className={cardClass}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={cn('block text-xs font-medium mb-1', textClass)}>
            {t('month')}
          </label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={cn('block text-xs font-medium mb-1', textClass)}>
            {t('category')}
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={inputClass}
          >
            <option value="all">{t('all')}</option>
            {Object.keys(categories).map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Info del filtro activo */}
      {selectedCategory !== 'all' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'mt-3 px-3 py-2 rounded-lg text-sm',
            darkMode ? 'bg-purple-900/30' : 'bg-purple-100'
          )}
        >
          <span className={darkMode ? 'text-purple-300' : 'text-purple-700'}>
            Filtrando por: <strong>{selectedCategory}</strong>
          </span>
        </motion.div>
      )}
    </motion.div>
  );
};
