import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  IconClock,
  IconPlus,
  IconTrash,
  IconCheck,
  IconX,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { useExpenseStore } from '../store/expenseStore';
import {
  useRecurringExpenses,
  useAddRecurringExpense,
  useUpdateRecurringExpense,
  useDeleteRecurringExpense,
} from '../hooks/useExpenseQueries';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { cn } from '../lib/utils';
import { formatCurrency } from '../lib/utils';
import { toast } from 'sonner';

export const RecurringExpensesPage = () => {
  const { t } = useTranslation();
  const darkMode = useExpenseStore((state) => state.darkMode);
  const categories = useExpenseStore((state) => state.categories);

  // TODO: Obtener userId del contexto de auth
  const userId = 'user-id-placeholder';

  const { data: recurringExpenses = [] } = useRecurringExpenses(userId);
  const addRecurring = useAddRecurringExpense(userId);
  const updateRecurring = useUpdateRecurringExpense(userId);
  const deleteRecurring = useDeleteRecurringExpense(userId);

  const [newRecurring, setNewRecurring] = useState({
    name: '',
    amount: '',
    category: '',
    subcategory: '',
    dayOfMonth: 1,
    paymentMethod: 'Tarjeta',
    active: true,
  });

  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const textClass = darkMode ? 'text-gray-100' : 'text-purple-900';
  const textSecondaryClass = darkMode ? 'text-gray-400' : 'text-purple-600';

  const inputClass = cn(
    'w-full px-4 py-3 rounded-xl border focus:ring-2 focus:border-transparent transition-all',
    darkMode
      ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-purple-500'
      : 'bg-white border-purple-200 text-purple-900 focus:ring-purple-500'
  );

  const handleAddRecurring = async (e) => {
    e.preventDefault();

    try {
      await addRecurring.mutateAsync({
        ...newRecurring,
        amount: parseFloat(newRecurring.amount),
      });

      setNewRecurring({
        name: '',
        amount: '',
        category: '',
        subcategory: '',
        dayOfMonth: 1,
        paymentMethod: 'Tarjeta',
        active: true,
      });

      toast.success('Gasto recurrente añadido');
    } catch (error) {
      toast.error(t('errorOccurred'));
    }
  };

  const handleToggleActive = async (id, currentActive) => {
    try {
      await updateRecurring.mutateAsync({
        recurringId: id,
        recurringData: { active: !currentActive },
      });
      toast.success(
        currentActive
          ? 'Gasto recurrente desactivado'
          : 'Gasto recurrente activado'
      );
    } catch (error) {
      toast.error(t('errorOccurred'));
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteRecurring.mutateAsync(id);
      setDeleteConfirm(null);
      toast.success('Gasto recurrente eliminado');
    } catch (error) {
      toast.error(t('errorOccurred'));
    }
  };

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
              <IconClock className="w-8 h-8 text-purple-600" />
              <CardTitle>{t('recurringExpenses')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddRecurring} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    type="text"
                    value={newRecurring.name}
                    onChange={(e) =>
                      setNewRecurring({ ...newRecurring, name: e.target.value })
                    }
                    placeholder="Ej: Netflix"
                    className="mt-2"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="amount">{t('amount')}</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newRecurring.amount}
                    onChange={(e) =>
                      setNewRecurring({ ...newRecurring, amount: e.target.value })
                    }
                    placeholder="0.00"
                    className="mt-2"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">{t('category')}</Label>
                  <select
                    id="category"
                    value={newRecurring.category}
                    onChange={(e) =>
                      setNewRecurring({
                        ...newRecurring,
                        category: e.target.value,
                        subcategory: '',
                      })
                    }
                    className={cn(inputClass, 'mt-2')}
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

                {newRecurring.category && (
                  <div>
                    <Label htmlFor="subcategory">{t('subcategory')}</Label>
                    <select
                      id="subcategory"
                      value={newRecurring.subcategory}
                      onChange={(e) =>
                        setNewRecurring({
                          ...newRecurring,
                          subcategory: e.target.value,
                        })
                      }
                      className={cn(inputClass, 'mt-2')}
                      required
                    >
                      <option value="">{t('selectSubcategory')}</option>
                      {categories[newRecurring.category]?.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dayOfMonth">Día del mes</Label>
                  <Input
                    id="dayOfMonth"
                    type="number"
                    min="1"
                    max="31"
                    value={newRecurring.dayOfMonth}
                    onChange={(e) =>
                      setNewRecurring({
                        ...newRecurring,
                        dayOfMonth: parseInt(e.target.value),
                      })
                    }
                    className="mt-2"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="paymentMethod">{t('paymentMethod')}</Label>
                  <select
                    id="paymentMethod"
                    value={newRecurring.paymentMethod}
                    onChange={(e) =>
                      setNewRecurring({
                        ...newRecurring,
                        paymentMethod: e.target.value,
                      })
                    }
                    className={cn(inputClass, 'mt-2')}
                  >
                    <option value="Tarjeta">{t('card')}</option>
                    <option value="Efectivo">{t('cash')}</option>
                    <option value="Bizum">Bizum</option>
                    <option value="Transferencia">{t('transfer')}</option>
                  </select>
                </div>
              </div>

              <Button type="submit" className="w-full gap-2">
                <IconPlus className="w-5 h-5" />
                Añadir Gasto Recurrente
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Lista de Gastos Recurrentes */}
      <div className="space-y-3">
        <h3 className={cn('font-semibold text-lg', textClass)}>
          Gastos Recurrentes Activos
        </h3>

        {recurringExpenses.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <IconClock
                className={cn(
                  'w-16 h-16 mx-auto mb-4',
                  darkMode ? 'text-gray-400' : 'text-purple-600'
                )}
              />
              <p className={cn('text-xl font-semibold mb-2', textClass)}>
                No hay gastos recurrentes
              </p>
              <p className={textSecondaryClass}>
                Añade un gasto que se repite mensualmente
              </p>
            </CardContent>
          </Card>
        ) : (
          recurringExpenses.map((recurring, index) => (
            <motion.div
              key={recurring.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className={cn('font-semibold text-lg', textClass)}>
                          {recurring.name}
                        </p>
                        <Badge variant={recurring.active ? 'success' : 'secondary'}>
                          {recurring.active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                      <p className={cn('text-sm mb-1', textSecondaryClass)}>
                        {recurring.category} • {recurring.subcategory}
                      </p>
                      <p className={cn('text-sm', textSecondaryClass)}>
                        Día {recurring.dayOfMonth} • {recurring.paymentMethod}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={cn('font-bold text-lg', textClass)}>
                        {formatCurrency(recurring.amount)}
                      </span>

                      <Button
                        variant={recurring.active ? 'default' : 'outline'}
                        size="icon"
                        onClick={() =>
                          handleToggleActive(recurring.id, recurring.active)
                        }
                        title={
                          recurring.active ? 'Desactivar' : 'Activar'
                        }
                      >
                        {recurring.active ? (
                          <IconCheck className="w-4 h-4" />
                        ) : (
                          <IconX className="w-4 h-4" />
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirm(recurring.id)}
                      >
                        <IconTrash className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
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
                    onClick={() => handleDelete(deleteConfirm)}
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
