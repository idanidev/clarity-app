import { X, Plus } from "lucide-react";
import { getCategorySubcategories } from "../../../services/firestoreService";
import { useState } from "react";

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
  if (!visible) {
    return null;
  }

  const handleChange = (field, value) => {
    onChange({
      ...newExpense,
      [field]: value,
    });
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

        <form onSubmit={onSubmit} className="px-6 py-6 space-y-4">
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
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Nombre de categoría"
                  className={`flex-1 px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                />
                <button
                  type="button"
                  onClick={async (e) => {
                    e.preventDefault();
                    if (newCategoryName.trim() && onAddCategory) {
                      await onAddCategory(newCategoryName.trim());
                      setNewCategoryName("");
                      setShowNewCategory(false);
                    }
                  }}
                  className="px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-lg transition-all"
                >
                  <Plus className="w-5 h-5" />
                </button>
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
                required
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
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newSubcategoryName}
                    onChange={(e) => setNewSubcategoryName(e.target.value)}
                    placeholder="Nombre de subcategoría"
                    className={`flex-1 px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
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
                    className="px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-lg transition-all"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <select
                  value={newExpense.subcategory}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onChange={(e) => handleChange("subcategory", e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                  required
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
