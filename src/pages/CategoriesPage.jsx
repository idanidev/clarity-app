import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  IconPlus, 
  IconTrash, 
  IconCategory,
  IconAlertTriangle 
} from '@tabler/icons-react';
import { useExpenseStore } from '../store/expenseStore';
import { useSaveCategories } from '../hooks/useExpenseQueries';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export const CategoriesPage = () => {
  const { t } = useTranslation();
  const darkMode = useExpenseStore((state) => state.darkMode);
  const categories = useExpenseStore((state) => state.categories);
  const expenses = useExpenseStore((state) => state.expenses);
  
  // TODO: Obtener userId del contexto de auth
  const userId = 'user-id-placeholder';
  const saveCategories = useSaveCategories(userId);

  const [newCategory, setNewCategory] = useState('');
  const [newSubcategory, setNewSubcategory] = useState('');
  const [selectedCategoryForSub, setSelectedCategoryForSub] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const textClass = darkMode ? 'text-gray-100' : 'text-purple-900';

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    if (categories[newCategory]) {
      toast.error('Esta categoría ya existe');
      return;
    }

    const updatedCategories = {
      ...categories,
      [newCategory]: [],
    };

    try {
      await saveCategories.mutateAsync(updatedCategories);
      setNewCategory('');
      toast.success(t('categoryAdded'));
    } catch (error) {
      toast.error(t('errorOccurred'));
    }
  };

  const handleAddSubcategory = async (e) => {
    e.preventDefault();
    if (!selectedCategoryForSub || !newSubcategory.trim()) return;

    if (categories[selectedCategoryForSub]?.includes(newSubcategory)) {
      toast.error('Esta subcategoría ya existe');
      return;
    }

    const updatedCategories = {
      ...categories,
      [selectedCategoryForSub]: [
        ...(categories[selectedCategoryForSub] || []),
        newSubcategory,
      ],
    };

    try {
      await saveCategories.mutateAsync(updatedCategories);
      setNewSubcategory('');
      toast.success('Subcategoría añadida correctamente');
    } catch (error) {
      toast.error(t('errorOccurred'));
    }
  };

  const handleDeleteCategory = async (category) => {
    const hasExpenses = expenses.some((exp) => exp.category === category);
    
    if (hasExpenses) {
      toast.error(t('cannotDeleteCategory'));
      return;
    }

    const updatedCategories = { ...categories };
    delete updatedCategories[category];

    try {
      await saveCategories.mutateAsync(updatedCategories);
      setDeleteConfirm(null);
      toast.success(t('categoryDeleted'));
    } catch (error) {
      toast.error(t('errorOccurred'));
    }
  };

  const handleDeleteSubcategory = async (category, subcategory) => {
    const hasExpenses = expenses.some(
      (exp) => exp.category === category && exp.subcategory === subcategory
    );

    if (hasExpenses) {
      toast.error(t('cannotDeleteSubcategory'));
      return;
    }

    const updatedCategories = {
      ...categories,
      [category]: categories[category].filter((sub) => sub !== subcategory),
    };

    try {
      await saveCategories.mutateAsync(updatedCategories);
      setDeleteConfirm(null);
      toast.success('Subcategoría eliminada correctamente');
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
              <IconCategory className="w-8 h-8 text-purple-600" />
              <CardTitle>{t('manageCategories')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Añadir Categoría */}
            <form onSubmit={handleAddCategory} className="space-y-3">
              <Label htmlFor="newCategory">{t('newCategory')}</Label>
              <div className="flex gap-2">
                <Input
                  id="newCategory"
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Ej: Salud"
                  className="flex-1"
                />
                <Button type="submit" size="icon">
                  <IconPlus className="w-5 h-5" />
                </Button>
              </div>
            </form>

            {/* Añadir Subcategoría */}
            <form onSubmit={handleAddSubcategory} className="space-y-3">
              <Label htmlFor="categorySelect">{t('newSubcategory')}</Label>
              <select
                id="categorySelect"
                value={selectedCategoryForSub}
                onChange={(e) => setSelectedCategoryForSub(e.target.value)}
                className={cn(
                  'w-full px-4 py-3 rounded-xl border focus:ring-2 focus:border-transparent transition-all',
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-purple-500'
                    : 'bg-white border-purple-200 text-purple-900 focus:ring-purple-500'
                )}
              >
                <option value="">{t('selectCategory')}</option>
                {Object.keys(categories).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {selectedCategoryForSub && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex gap-2"
                >
                  <Input
                    type="text"
                    value={newSubcategory}
                    onChange={(e) => setNewSubcategory(e.target.value)}
                    placeholder="Ej: Farmacia"
                    className="flex-1"
                  />
                  <Button type="submit" size="icon">
                    <IconPlus className="w-5 h-5" />
                  </Button>
                </motion.div>
              )}
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Lista de Categorías */}
      <div className="space-y-3">
        <h3 className={cn('font-semibold text-lg', textClass)}>
          {t('existingCategories')}
        </h3>

        {Object.entries(categories).length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <IconAlertTriangle className={cn('w-16 h-16 mx-auto mb-4', darkMode ? 'text-gray-400' : 'text-purple-600')} />
              <p className={cn('text-xl font-semibold', textClass)}>
                {t('noCategories')}
              </p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(categories).map(([category, subcategories], index) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h5 className={cn('font-bold text-lg', textClass)}>
                      {category}
                    </h5>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteConfirm({ type: 'category', category })}
                    >
                      <IconTrash className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {subcategories.length === 0 ? (
                      <p className={cn('text-sm', darkMode ? 'text-gray-400' : 'text-purple-600')}>
                        No hay subcategorías
                      </p>
                    ) : (
                      subcategories.map((sub) => (
                        <div
                          key={sub}
                          className={cn(
                            'flex justify-between items-center p-2 rounded-lg',
                            darkMode ? 'bg-gray-700' : 'bg-white'
                          )}
                        >
                          <span className={cn('text-sm', textClass)}>{sub}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => 
                              setDeleteConfirm({ 
                                type: 'subcategory', 
                                category, 
                                subcategory: sub 
                              })
                            }
                          >
                            <IconTrash className="w-3 h-3 text-red-600" />
                          </Button>
                        </div>
                      ))
                    )}
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
                <p className={darkMode ? 'text-gray-400' : 'text-purple-600'}>
                  {t('deleteWarning')}
                </p>
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
                    onClick={() => {
                      if (deleteConfirm.type === 'category') {
                        handleDeleteCategory(deleteConfirm.category);
                      } else {
                        handleDeleteSubcategory(
                          deleteConfirm.category,
                          deleteConfirm.subcategory
                        );
                      }
                    }}
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
