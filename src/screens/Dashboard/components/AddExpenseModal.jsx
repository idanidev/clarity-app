import { X, Plus } from "lucide-react";
import { getCategorySubcategories } from "../../../services/firestoreService";
import { useState, useEffect } from "react";

const AddExpenseModal = ({
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
}) => {
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showNewSubcategory, setShowNewSubcategory] = useState(false);
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Limpiar estados cuando se cierra el modal
  useEffect(() => {
    if (!visible) {
      setShowNewCategory(false);
      setNewCategoryName("");
      setShowNewSubcategory(false);
      setNewSubcategoryName("");
    }
  }, [visible]);

  if (!visible) {
    return null;
  }

  const textSecondaryClass = darkMode ? "text-gray-400" : "text-gray-600";

  const handleChange = (field, value) => {
    onChange({
      ...newExpense,
      [field]: value,
    });
  };

  // Manejar el submit del formulario con validación de categorías/subcategorías nuevas
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Evitar envíos múltiples si el usuario pulsa varias veces
    if (isSubmitting) return;
    setIsSubmitting(true);

    let finalCategory = newExpense.category;
    let finalSubcategory = newExpense.subcategory;
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
              return; // No continuar si falla la creación
            }
          }
        }
      }
    }
    
    // Verificar que tenemos una categoría válida antes de continuar
    if (!finalCategory || finalCategory === "") {
      // Si no hay categoría seleccionada ni en creación, no permitir enviar
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
        categories[Object.keys(categories).find(c => c.toLowerCase() === finalCategory.toLowerCase())];
      
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
        subcategory: finalSubcategory || newExpense.subcategory,
      });
      // Esperar a que se actualice el estado antes de enviar
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    
    try {
      // Enviar el formulario
      await onSubmit(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onMouseDown={onClose}
    >
      <div
        className={`${cardClass} rounded-2xl p-0 max-w-md w-full border shadow-2xl max-h-[90vh] overflow-y-auto`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          className={`sticky top-0 z-10 px-6 py-4 flex justify-between items-center ${
            darkMode
              ? "bg-gray-800/95 border-b border-gray-700"
              : "bg-white/80 border-b border-purple-100"
          } backdrop-blur`}
        >
          <h3 className={`text-2xl font-bold ${textClass}`}>Añadir Gasto</h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${
              darkMode ? "hover:bg-gray-700" : "hover:bg-purple-100"
            } transition-all`}
          >
            <X className={`w-6 h-6 ${textClass}`} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
          <div>
            <label className={`block text-sm font-medium ${textClass} mb-2`}>
              Nombre del gasto
            </label>
            <input
              type="text"
              value={newExpense.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
              required
              placeholder="Ej: Compra supermercado"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${textClass} mb-2`}>
              Cantidad
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={newExpense.amount}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "" || parseFloat(value) >= 0) {
                  handleChange("amount", value);
                }
              }}
              className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
              required
              placeholder="0.00"
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
                className={`text-xs px-2 py-1 rounded-lg flex items-center gap-1 ${
                  darkMode
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
                value={newExpense.category}
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
                  className={`text-xs px-2 py-1 rounded-lg flex items-center gap-1 ${
                    darkMode
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
                  value={newExpense.subcategory}
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
            <label className={`block text-sm font-medium ${textClass} mb-2`}>
              Fecha
            </label>
            <input
              type="date"
              value={newExpense.date}
              onChange={(e) => handleChange("date", e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${textClass} mb-2`}>
              Método de pago
            </label>
            <select
              value={newExpense.paymentMethod}
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

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-lg transition-all"
          >
            Añadir Gasto
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseModal;
