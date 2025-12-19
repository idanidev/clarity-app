import { X } from "lucide-react";
import { getCategorySubcategories } from "../../../services/firestoreService";
import { useDisableBodyScroll } from "../../../hooks/useDisableBodyScroll";

const EditExpenseModal = ({
  expense,
  darkMode,
  cardClass,
  textClass,
  inputClass,
  categories,
  onChange,
  onSubmit,
  onClose,
}) => {
  // Deshabilitar scroll del body cuando el modal está abierto
  useDisableBodyScroll(!!expense);

  if (!expense) {
    return null;
  }

  const handleChange = (field, value) => {
    onChange({
      ...expense,
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
          <h3 className={`text-2xl font-bold ${textClass}`}>Editar Gasto</h3>
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
              value={expense.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
              required
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
              value={expense.amount}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "" || parseFloat(value) >= 0) {
                  handleChange("amount", value);
                }
              }}
              className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${textClass} mb-2`}>
              Categoría
            </label>
            <select
              value={expense.category}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onChange={(e) =>
                onChange({
                  ...expense,
                  category: e.target.value,
                  subcategory: "",
                })
              }
              className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
              required
            >
              {Object.keys(categories).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium ${textClass} mb-2`}>
              Subcategoría
            </label>
            <select
              value={expense.subcategory}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onChange={(e) => handleChange("subcategory", e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
              required
            >
              {getCategorySubcategories(categories[expense.category])?.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium ${textClass} mb-2`}>
              Fecha
            </label>
            <input
              type="date"
              value={expense.date}
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
              value={expense.paymentMethod}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onChange={(e) => handleChange("paymentMethod", e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
              required
            >
              {[
                "Tarjeta",
                "Efectivo",
                "Bizum",
                "Transferencia",
              ].map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-lg transition-all"
          >
            Guardar Cambios
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditExpenseModal;
