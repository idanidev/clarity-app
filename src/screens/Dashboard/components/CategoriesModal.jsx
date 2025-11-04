import { Plus, Trash2, X } from "lucide-react";

const CategoriesModal = ({
  visible,
  darkMode,
  cardClass,
  textClass,
  inputClass,
  categories,
  newCategory,
  onNewCategoryChange,
  onAddCategory,
  selectedCategoryForSub,
  onSelectCategoryForSub,
  newSubcategory,
  onNewSubcategoryChange,
  onAddSubcategory,
  onRequestDelete,
  onClose,
}) => {
  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`${cardClass} rounded-2xl p-6 max-w-2xl w-full border shadow-2xl max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className={`text-2xl font-bold ${textClass}`}>Gestionar Categorías</h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${
              darkMode ? "hover:bg-gray-700" : "hover:bg-purple-100"
            } transition-all`}
          >
            <X className={`w-6 h-6 ${textClass}`} />
          </button>
        </div>

        <div className="space-y-6">
          <form onSubmit={onAddCategory} className="space-y-3">
            <label className={`block text-sm font-medium ${textClass}`}>
              Nueva Categoría
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => onNewCategoryChange(e.target.value)}
                className={`flex-1 px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                placeholder="Ej: Salud"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-lg transition-all"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </form>

          <form onSubmit={onAddSubcategory} className="space-y-3">
            <label className={`block text-sm font-medium ${textClass}`}>
              Nueva Subcategoría
            </label>
            <select
              value={selectedCategoryForSub}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onChange={(e) => onSelectCategoryForSub(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
            >
              <option value="">Selecciona una categoría</option>
              {Object.keys(categories).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {selectedCategoryForSub && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubcategory}
                  onChange={(e) => onNewSubcategoryChange(e.target.value)}
                  className={`flex-1 px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                  placeholder="Ej: Farmacia"
                />
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-lg transition-all"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            )}
          </form>

          <div className="space-y-3">
            <h4 className={`font-semibold ${textClass}`}>Categorías Existentes</h4>
            {Object.entries(categories).map(([category, subcategories]) => (
              <div
                key={category}
                className={`p-4 rounded-xl ${
                  darkMode ? "bg-gray-700" : "bg-purple-50"
                } border ${darkMode ? "border-gray-600" : "border-purple-100"}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <h5 className={`font-bold ${textClass}`}>{category}</h5>
                  <button
                    onClick={() =>
                      onRequestDelete({ type: "category", category })
                    }
                    className={`p-2 rounded-lg ${
                      darkMode ? "hover:bg-red-900/50" : "hover:bg-red-100"
                    } transition-all`}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
                <div className="space-y-2">
                  {subcategories.map((sub) => (
                    <div
                      key={sub}
                      className={`flex justify-between items-center p-2 rounded-lg ${
                        darkMode ? "bg-gray-600" : "bg-white"
                      }`}
                    >
                      <span className={`text-sm ${textClass}`}>{sub}</span>
                      <button
                        onClick={() =>
                          onRequestDelete({
                            type: "subcategory",
                            category,
                            subcategory: sub,
                          })
                        }
                        className={`p-1 rounded ${
                          darkMode
                            ? "hover:bg-red-900/50"
                            : "hover:bg-red-100"
                        } transition-all`}
                      >
                        <Trash2 className="w-3 h-3 text-red-600" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoriesModal;
