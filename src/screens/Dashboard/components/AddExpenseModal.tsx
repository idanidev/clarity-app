import { Plus } from "@/components/icons";
import { getCategorySubcategories } from "../../../services/firestoreService";
import { useState, useEffect, useCallback, useMemo, memo, FormEvent, Dispatch, SetStateAction } from "react";
import { Input, Button } from "../../../components/ui";
import { isValidAmount, isNotEmpty, isValidDate } from "../../../utils/validation";
import { parseCurrency } from "../../../utils/currency";
import type { Categories, ExpenseFormInput } from "../../../types/dashboard";
import BottomSheet from "../../../components/BottomSheet";

export interface AddExpenseModalProps {
  visible: boolean;
  darkMode: boolean;
  cardClass: string;
  textClass: string;
  inputClass: string;
  categories: Categories;
  newExpense: ExpenseFormInput;
  onChange: Dispatch<SetStateAction<ExpenseFormInput>>;
  onSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  onClose: () => void;
  onAddCategory?: (categoryName: string) => Promise<void>;
  onAddSubcategory?: (subcategoryName: string) => Promise<void>;
}

interface FormErrors {
  [key: string]: string;
}

const AddExpenseModal = memo(({
  visible,
  darkMode,
  cardClass,
  textClass,
  inputClass,
  categories,
  newExpense,
  onChange,
  onSubmit,
  onClose,
  onAddCategory,
  onAddSubcategory,
}: AddExpenseModalProps) => {
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showNewSubcategory, setShowNewSubcategory] = useState(false);
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // ✅ REMOVIDO: useDisableBodyScroll ya se llama en BottomSheet
  // No duplicar la llamada aquí

  // Limpiar estados cuando se cierra el modal
  useEffect(() => {
    if (!visible) {
      setShowNewCategory(false);
      setNewCategoryName("");
      setShowNewSubcategory(false);
      setNewSubcategoryName("");
      setErrors({});
    }
  }, [visible]);

  // ✅ useMemo para clases CSS que dependen de darkMode
  const textSecondaryClass = useMemo(
    () => darkMode ? "text-gray-400" : "text-gray-600",
    [darkMode]
  );

  const handleChange = useCallback((field: string, value: unknown) => {
    // Limpiar error del campo cuando el usuario empieza a escribir
    setErrors(prev => {
      if (prev[field]) {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      }
      return prev;
    });

    onChange(prev => ({
      ...prev,
      [field]: value,
    }));
  }, [onChange]);

  // Validar formulario
  const validateForm = useCallback(() => {
    const newErrors: FormErrors = {};

    if (!isNotEmpty(newExpense.name || "")) {
      newErrors.name = "El nombre del gasto es requerido";
    }

    const amount = typeof newExpense.amount === 'string'
      ? parseCurrency(newExpense.amount)
      : (newExpense.amount || 0);

    if (!isValidAmount(amount)) {
      newErrors.amount = "El monto debe ser mayor a 0";
    }

    if (!newExpense.category || !isNotEmpty(newExpense.category)) {
      newErrors.category = "Debes seleccionar una categoría";
    }

    if (!isValidDate(newExpense.date || "")) {
      newErrors.date = "La fecha no es válida";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [newExpense]);

  // Manejar el submit del formulario con validación de categorías/subcategorías nuevas
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Evitar envíos múltiples si el usuario pulsa varias veces
    if (isSubmitting) return;

    // Validar formulario
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    let finalCategory = newExpense.category || "";
    let finalSubcategory = newExpense.subcategory || "";
    let needsUpdate = false;

    // Si hay una categoría nueva escrita pero no creada, verificar primero si ya existe
    // NUNCA crear una categoría si ya existe
    if (showNewCategory && newCategoryName.trim()) {
      const categoryNameTrimmed = newCategoryName.trim();

      // Verificar si ya existe (case-insensitive) - SIEMPRE verificar primero
      const existingCategory = Object.keys(categories).find(
        (cat) => cat.toLowerCase() === categoryNameTrimmed.toLowerCase()
      );

      if (existingCategory) {
        // Si ya existe, usar la existente y NO crear duplicado
        finalCategory = existingCategory;
        setShowNewCategory(false);
        setNewCategoryName("");
        needsUpdate = true;
      } else {
        // Verificar también si la categoría ya está seleccionada (fue creada antes)
        if (newExpense.category && newExpense.category.toLowerCase() === categoryNameTrimmed.toLowerCase()) {
          // Ya está seleccionada, no crear de nuevo
          finalCategory = newExpense.category;
          setShowNewCategory(false);
          setNewCategoryName("");
        } else {
          // SOLO crear si realmente no existe en categories
          // Verificar una vez más antes de crear
          const doubleCheck = Object.keys(categories).find(
            (cat) => cat.toLowerCase() === categoryNameTrimmed.toLowerCase()
          );

          if (doubleCheck) {
            // Existe, usar la existente
            finalCategory = doubleCheck;
            setShowNewCategory(false);
            setNewCategoryName("");
            needsUpdate = true;
          } else if (onAddCategory) {
            // Si realmente no existe, crearla
            try {
              await onAddCategory(categoryNameTrimmed);
              finalCategory = categoryNameTrimmed;
              setShowNewCategory(false);
              setNewCategoryName("");
              needsUpdate = true;
              // Esperar un momento para que se actualice el estado
              await new Promise(resolve => setTimeout(resolve, 200));
            } catch (error) {
              console.error("Error creando categoría:", error);
              setIsSubmitting(false);
              return; // No continuar si falla la creación
            }
          }
        }
      }
    }

    // Verificar que tenemos una categoría válida antes de continuar
    if (!finalCategory || finalCategory === "") {
      setIsSubmitting(false);
      return;
    }

    // Actualizar el estado con la categoría final si es necesario
    if (needsUpdate || finalCategory !== newExpense.category) {
      onChange({
        ...newExpense,
        category: finalCategory,
        subcategory: "", // Resetear subcategoría al cambiar categoría
      });
      // Esperar a que se actualice
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Si hay una subcategoría nueva escrita pero no creada, crearla primero
    if (showNewSubcategory && newSubcategoryName.trim() && finalCategory) {
      const subcategoryNameTrimmed = newSubcategoryName.trim();
      // Obtener la categoría actualizada (puede haber cambiado)
      const currentCategoryData = categories[finalCategory] ||
        categories[Object.keys(categories).find(c => c.toLowerCase() === finalCategory.toLowerCase()) || ""];

      if (currentCategoryData) {
        const subcategories = getCategorySubcategories(currentCategoryData);

        // Verificar si ya existe (case-insensitive)
        const existingSubcategory = subcategories.find(
          (sub) => sub.toLowerCase() === subcategoryNameTrimmed.toLowerCase()
        );

        if (existingSubcategory) {
          // Si ya existe, usar la existente
          finalSubcategory = existingSubcategory;
          setShowNewSubcategory(false);
          setNewSubcategoryName("");
          needsUpdate = true;
        } else if (onAddSubcategory) {
          // Si no existe, crearla
          try {
            await onAddSubcategory(subcategoryNameTrimmed);
            finalSubcategory = subcategoryNameTrimmed;
            setShowNewSubcategory(false);
            setNewSubcategoryName("");
            needsUpdate = true;
            // Esperar un momento para que se actualice el estado
            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (error) {
            console.error("Error creando subcategoría:", error);
            setIsSubmitting(false);
            return; // No continuar si falla la creación
          }
        }
      }
    }

    // Actualizar el estado final antes de enviar si es necesario
    if (needsUpdate || finalCategory !== newExpense.category || finalSubcategory !== newExpense.subcategory) {
      onChange({
        ...newExpense,
        category: finalCategory,
        subcategory: finalSubcategory || newExpense.subcategory || "",
      });
      // Esperar a que se actualice el estado antes de enviar
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    try {
      // Enviar el formulario
      await onSubmit(e);
      // Limpiar errores si todo salió bien
      setErrors({});
    } catch (error) {
      console.error("Error al añadir gasto:", error);
      setErrors({
        submit: error instanceof Error ? error.message : "Error al añadir el gasto"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Añadir Gasto"
      darkMode={darkMode}
      maxHeight="90vh"
    >
      <form onSubmit={handleSubmit} className="px-6 pt-6 pb-32 space-y-4">
        {/* Error general */}
        {errors.submit && (
          <div className={`p-4 rounded-xl ${darkMode
            ? "bg-red-900/20 text-red-400 border border-red-800"
            : "bg-red-50 text-red-600 border border-red-200"
            }`}>
            {errors.submit}
          </div>
        )}

        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
            Nombre del gasto
          </label>
          <Input
            type="text"
            value={newExpense.name || ""}
            onChange={(e) => handleChange("name", e.target.value)}
            error={errors.name}
            placeholder="Ej: Compra supermercado"
            required
            className={
              darkMode
                ? "bg-gray-900 border-gray-700 text-gray-100 placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
            }
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
            Cantidad
          </label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={newExpense.amount || ""}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "" || parseFloat(value) >= 0) {
                handleChange("amount", value);
              }
            }}
            error={errors.amount}
            placeholder="0.00"
            required
            className={
              darkMode
                ? "bg-gray-900 border-gray-700 text-gray-100 placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
            }
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={`block text-sm font-medium ${textClass}`}>
              Categoría
            </label>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setShowNewCategory(!showNewCategory);
                setShowNewSubcategory(false);
              }}
              className={`text-xs px-2 py-1 rounded-lg flex items-center gap-1 ${darkMode
                ? "bg-purple-600/20 text-purple-300 hover:bg-purple-600/30"
                : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                } transition-all`}
            >
              <Plus className="w-3 h-3" />
              Nueva
            </button>
          </div>
          {showNewCategory ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const categoryNameTrimmed = newCategoryName.trim();
                      if (categoryNameTrimmed && onAddCategory) {
                        // Verificar si ya existe antes de crear
                        const existingCategory = Object.keys(categories).find(
                          (cat) => cat.toLowerCase() === categoryNameTrimmed.toLowerCase()
                        );
                        if (!existingCategory) {
                          onAddCategory(categoryNameTrimmed).then(() => {
                            setNewCategoryName("");
                            setShowNewCategory(false);
                          });
                        } else {
                          // Si ya existe, solo seleccionarla
                          onChange({
                            ...newExpense,
                            category: existingCategory,
                            subcategory: "",
                          });
                          setNewCategoryName("");
                          setShowNewCategory(false);
                        }
                      }
                    }
                  }}
                  placeholder="Nombre de categoría"
                  className={`flex-1 px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={async (e) => {
                    e.preventDefault();
                    const categoryNameTrimmed = newCategoryName.trim();
                    if (categoryNameTrimmed && onAddCategory) {
                      // Verificar si ya existe antes de crear
                      const existingCategory = Object.keys(categories).find(
                        (cat) => cat.toLowerCase() === categoryNameTrimmed.toLowerCase()
                      );
                      if (!existingCategory) {
                        await onAddCategory(categoryNameTrimmed);
                        setNewCategoryName("");
                        setShowNewCategory(false);
                      } else {
                        // Si ya existe, solo seleccionarla
                        onChange({
                          ...newExpense,
                          category: existingCategory,
                          subcategory: "",
                        });
                        setNewCategoryName("");
                        setShowNewCategory(false);
                      }
                    }
                  }}
                  disabled={!newCategoryName.trim()}
                  className="px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <p className={`text-xs ${textSecondaryClass}`}>
                💡 Escribe el nombre y pulsa Enter o el botón +. Se creará automáticamente al enviar el gasto.
              </p>
            </div>
          ) : (
            <select
              value={newExpense.category || ""}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onChange={(e) =>
                onChange({
                  ...newExpense,
                  category: e.target.value,
                  subcategory: "",
                })
              }
              className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
              required={!showNewCategory}
            >
              <option value="">Selecciona una categoría</option>
              {Object.keys(categories).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}
        </div>

        {newExpense.category && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`block text-sm font-medium ${textClass}`}>
                Subcategoría
              </label>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowNewSubcategory(!showNewSubcategory);
                  setShowNewCategory(false);
                }}
                className={`text-xs px-2 py-1 rounded-lg flex items-center gap-1 ${darkMode
                  ? "bg-purple-600/20 text-purple-300 hover:bg-purple-600/30"
                  : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                  } transition-all`}
              >
                <Plus className="w-3 h-3" />
                Nueva
              </button>
            </div>
            {showNewSubcategory ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubcategoryName}
                    onChange={(e) => setNewSubcategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (newSubcategoryName.trim() && onAddSubcategory) {
                          onAddSubcategory(newSubcategoryName.trim()).then(() => {
                            setNewSubcategoryName("");
                            setShowNewSubcategory(false);
                          });
                        }
                      }
                    }}
                    placeholder="Nombre de subcategoría"
                    className={`flex-1 px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.preventDefault();
                      if (newSubcategoryName.trim() && onAddSubcategory) {
                        await onAddSubcategory(newSubcategoryName.trim());
                        setNewSubcategoryName("");
                        setShowNewSubcategory(false);
                      }
                    }}
                    disabled={!newSubcategoryName.trim()}
                    className="px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <p className={`text-xs ${textSecondaryClass}`}>
                  💡 Escribe el nombre y pulsa Enter o el botón +. Se creará automáticamente al enviar el gasto.
                </p>
              </div>
            ) : (
              <select
                value={newExpense.subcategory || ""}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onChange={(e) => handleChange("subcategory", e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                required={!showNewSubcategory}
              >
                <option value="">Selecciona una subcategoría</option>
                {getCategorySubcategories(categories[newExpense.category])?.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
            Fecha
          </label>
          <Input
            type="date"
            value={newExpense.date || ""}
            onChange={(e) => handleChange("date", e.target.value)}
            error={errors.date}
            required
            className={
              darkMode
                ? "bg-gray-900 border-gray-700 text-gray-100 placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
            }
          />
        </div>

        <div>
          <label className={`block text-sm font-medium ${textClass} mb-2`}>
            Método de pago
          </label>
          <select
            value={newExpense.paymentMethod || "Tarjeta"}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onChange={(e) => handleChange("paymentMethod", e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
          >
            <option value="Tarjeta">Tarjeta</option>
            <option value="Efectivo">Efectivo</option>
            <option value="Bizum">Bizum</option>
            <option value="Transferencia">Transferencia</option>
          </select>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? "Añadiendo..." : "Añadir Gasto"}
        </Button>
      </form>
    </BottomSheet>
  );
});

AddExpenseModal.displayName = 'AddExpenseModal';

export default AddExpenseModal;

