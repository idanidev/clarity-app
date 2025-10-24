import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { IconX } from '@tabler/icons-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { useAddExpense } from '../../hooks/useExpenseQueries';
import { useExpenseStore } from '../../store/expenseStore';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

export const AddExpenseDialog = ({ open, onOpenChange }) => {
  const { t } = useTranslation();
  const darkMode = useExpenseStore((state) => state.darkMode);
  const categories = useExpenseStore((state) => state.categories);
  
  // TODO: Obtener userId del contexto de auth
  const userId = 'user-id-placeholder';
  const addExpense = useAddExpense(userId);

  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: '',
    subcategory: '',
    date: new Date().toISOString().slice(0, 10),
    paymentMethod: 'Tarjeta',
  });

  const inputClass = cn(
    'w-full px-4 py-3 rounded-xl border focus:ring-2 focus:border-transparent transition-all',
    darkMode
      ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-purple-500 placeholder:text-gray-400'
      : 'bg-white border-purple-200 text-purple-900 focus:ring-purple-500 placeholder:text-purple-400'
  );

  const textClass = darkMode ? 'text-gray-100' : 'text-purple-900';

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      category: '',
      subcategory: '',
      date: new Date().toISOString().slice(0, 10),
      paymentMethod: 'Tarjeta',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await addExpense.mutateAsync({
        ...formData,
        amount: parseFloat(formData.amount),
      });
      
      resetForm();
      onOpenChange(false);
      toast.success(t('expenseAdded'));
    } catch (error) {
      toast.error(t('errorOccurred'));
    }
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('addExpense')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Nombre del gasto */}
          <div>
            <label className={cn('block text-sm font-medium mb-2', textClass)}>
              {t('expenseName')}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={inputClass}
              required
              placeholder="Ej: Compra supermercado"
            />
          </div>

          {/* Cantidad */}
          <div>
            <label className={cn('block text-sm font-medium mb-2', textClass)}>
              {t('amount')}
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className={inputClass}
              required
              placeholder="0.00"
            />
          </div>

          {/* Categoría */}
          <div>
            <label className={cn('block text-sm font-medium mb-2', textClass)}>
              {t('category')}
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  category: e.target.value,
                  subcategory: '',
                })
              }
              className={inputClass}
              required
            >
              <option value="">{t('selectCategory')}</option>
              {Object.keys(categories).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Subcategoría */}
          {formData.category && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.2 }}
            >
              <label className={cn('block text-sm font-medium mb-2', textClass)}>
                {t('subcategory')}
              </label>
              <select
                value={formData.subcategory}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    subcategory: e.target.value,
                  })
                }
                className={inputClass}
                required
              >
                <option value="">{t('selectSubcategory')}</option>
                {categories[formData.category]?.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </motion.div>
          )}

          {/* Fecha */}
          <div>
            <label className={cn('block text-sm font-medium mb-2', textClass)}>
              {t('date')}
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className={inputClass}
              required
            />
          </div>

          {/* Método de pago */}
          <div>
            <label className={cn('block text-sm font-medium mb-2', textClass)}>
              {t('paymentMethod')}
            </label>
            <select
              value={formData.paymentMethod}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  paymentMethod: e.target.value,
                })
              }
              className={inputClass}
            >
              <option value="Tarjeta">{t('card')}</option>
              <option value="Efectivo">{t('cash')}</option>
              <option value="Bizum">Bizum</option>
              <option value="Transferencia">{t('transfer')}</option>
            </select>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              {t('cancel')}
            </Button>
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={addExpense.isPending}
            >
              {addExpense.isPending ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('loading')}...
                </span>
              ) : (
                t('addExpense')
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
