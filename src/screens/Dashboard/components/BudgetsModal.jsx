import { Trash2, X } from "lucide-react";

const BudgetsModal = ({
  visible,
  darkMode,
  cardClass,
  textClass,
  textSecondaryClass,
  inputClass,
  categories,
  budgets,
  budgetCategory,
  onBudgetCategoryChange,
  budgetAmount,
  onBudgetAmountChange,
  onAddBudget,
  categoryTotals,
  onRequestDelete,
  onClose,
}) => {
  if (!visible) {
    return null;
  }

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
          <h3 className={`text-2xl font-bold ${textClass}`}>
            Gestionar Presupuestos
          </h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${
              darkMode ? "hover:bg-gray-700" : "hover:bg-purple-100"
            } transition-all`}
          >
            <X className={`w-6 h-6 ${textClass}`} />
          </button>
        </div>

        <div className="px-6 py-6">
          <form onSubmit={onAddBudget} className="space-y-4 mb-6">
          <div>
            <label className={`block text-sm font-medium ${textClass} mb-2`}>
              Categoría
            </label>
            <select
              value={budgetCategory}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onChange={(e) => onBudgetCategoryChange(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
              required
            >
              <option value="">Selecciona una categoría</option>
              {Object.keys(categories)
                .filter((cat) => !budgets[cat])
                .map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium ${textClass} mb-2`}>
              Presupuesto Mensual
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={budgetAmount}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "" || parseFloat(value) >= 0) {
                  onBudgetAmountChange(value);
                }
              }}
              className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
              required
              placeholder="0.00"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-lg transition-all"
          >
            Crear Presupuesto
          </button>
        </form>

        <div className="space-y-3">
          <h4 className={`font-semibold ${textClass}`}>Presupuestos Activos</h4>
          {Object.entries(budgets).map(([category, budget]) => {
            const spent =
              categoryTotals.find((ct) => ct.category === category)?.total || 0;
            const percentage = (spent / budget) * 100;

            return (
              <div
                key={category}
                className={`p-4 rounded-xl ${
                  darkMode ? "bg-gray-700" : "bg-purple-50"
                } border ${darkMode ? "border-gray-600" : "border-purple-100"}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className={`font-bold ${textClass}`}>{category}</p>
                    <p className={`text-sm ${textSecondaryClass}`}>
                      €{spent.toFixed(2)} / €{budget.toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      onRequestDelete({ type: "budget", category })
                    }
                    className={`p-2 rounded-lg ${
                      darkMode ? "hover:bg-red-900/50" : "hover:bg-red-100"
                    } transition-all`}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
                <div
                  className={`w-full ${darkMode ? "bg-gray-600" : "bg-white"} rounded-full h-2`}
                >
                  <div
                    className={`h-full rounded-full transition-all ${
                      percentage > 100
                        ? "bg-red-600"
                        : "bg-gradient-to-r from-purple-600 to-blue-600"
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetsModal;
