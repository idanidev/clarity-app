import { Edit2, Plus, Save, Trash2, X } from "lucide-react";
import { getCategoryColor, getCategorySubcategories } from "../../../services/firestoreService";
import { useDisableBodyScroll } from "../../../hooks/useDisableBodyScroll";

const CategoriesModal = ({
  visible,
  darkMode,
  cardClass,
  textClass,
  inputClass,
  categories,
  newCategory,
  onNewCategoryChange,
  newCategoryColor,
  onNewCategoryColorChange,
  onAddCategory,
  selectedCategoryForSub,
  onSelectCategoryForSub,
  newSubcategory,
  onNewSubcategoryChange,
  onAddSubcategory,
  editingCategory,
  onStartEditCategory,
  onCancelEditCategory,
  onSaveEditCategory,
  editingSubcategory,
  onStartEditSubcategory,
  onCancelEditSubcategory,
  onSaveEditSubcategory,
  onRequestDelete,
  onClose,
}) => {
  // Deshabilitar scroll del body cuando el modal está abierto
  useDisableBodyScroll(visible);

  if (!visible) {
    return null;
  }

  const defaultColors = [
    "#8B5CF6", // purple
    "#3B82F6", // blue
    "#EC4899", // pink
    "#10B981", // green
    "#F59E0B", // amber
    "#EF4444", // red
    "#6366F1", // indigo
    "#A855F7", // violet
    "#F97316", // orange
    "#14B8A6", // teal
  ];

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onMouseDown={onClose}
    >
      <div
        className={`${cardClass} rounded-2xl p-0 max-w-2xl w-full border shadow-2xl max-h-[90vh] overflow-y-auto`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          className={`sticky top-0 z-10 px-6 py-4 flex justify-between items-center ${
            darkMode
              ? "bg-gray-800/95 border-b border-gray-700"
              : "bg-white/80 border-b border-purple-100"
          } backdrop-blur`}
        >
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

        <div className="px-6 py-6 space-y-6">
          <form onSubmit={onAddCategory} className="space-y-3">
            <label className={`block text-sm font-medium ${textClass}`}>
              Nueva Categoría
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => onNewCategoryChange(e.target.value)}
                className={`flex-1 px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                placeholder="Ej: Salud"
              />
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={newCategoryColor}
                  onChange={(e) => onNewCategoryColorChange(e.target.value)}
                  className="w-12 h-12 rounded-lg border-2 border-gray-300 cursor-pointer"
                  title="Selecciona un color"
                />
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-lg transition-all"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {defaultColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => onNewCategoryColorChange(color)}
                  className="w-8 h-8 rounded-lg border-2 border-gray-300 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  title={`Color: ${color}`}
                />
              ))}
            </div>
          </form>

          <form onSubmit={onAddSubcategory} className="space-y-3">
            <label className={`block text-sm font-medium ${textClass}`}>
              Nueva Subcategoría
            </label>
            <select
              value={selectedCategoryForSub}
              onClick={(e) => e.stopPropagation()}
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
            {Object.entries(categories).map(([categoryName, categoryData]) => {
              const subcategories = getCategorySubcategories(categoryData);
              const color = getCategoryColor(categoryData);
              const isEditing = editingCategory?.name === categoryName;

              return (
                <div
                  key={categoryName}
                  className={`p-4 rounded-xl ${
                    darkMode ? "bg-gray-700" : "bg-purple-50"
                  } border ${darkMode ? "border-gray-600" : "border-purple-100"}`}
                >
                  <div className="flex justify-between items-center mb-3">
                    {isEditing ? (
                      <div className="flex-1 flex gap-1.5 sm:gap-2 items-center flex-wrap">
                        <input
                          type="text"
                          value={editingCategory.newName}
                          onChange={(e) =>
                            onStartEditCategory({
                              ...editingCategory,
                              newName: e.target.value,
                            })
                          }
                          className={`flex-1 min-w-[120px] px-2 sm:px-3 py-2 rounded-lg border ${inputClass} focus:ring-2 focus:border-transparent text-sm sm:text-base`}
                          placeholder="Nombre de categoría"
                        />
                        <input
                          type="color"
                          value={editingCategory.newColor}
                          onChange={(e) =>
                            onStartEditCategory({
                              ...editingCategory,
                              newColor: e.target.value,
                            })
                          }
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg border-2 border-gray-300 cursor-pointer flex-shrink-0"
                          title="Selecciona un color"
                        />
                        <button
                          onClick={() => onSaveEditCategory()}
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            darkMode
                              ? "bg-green-700 hover:bg-green-600"
                              : "bg-green-500 hover:bg-green-600"
                          } text-white transition-all`}
                          title="Guardar"
                        >
                          <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => onCancelEditCategory()}
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            darkMode
                              ? "bg-gray-600 hover:bg-gray-500"
                              : "bg-gray-400 hover:bg-gray-500"
                          } text-white transition-all`}
                          title="Cancelar"
                        >
                          <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                            style={{ backgroundColor: color }}
                            title={`Color: ${color}`}
                          />
                          <h5 className={`font-bold ${textClass}`}>{categoryName}</h5>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              onStartEditCategory({
                                name: categoryName,
                                newName: categoryName,
                                newColor: color,
                              })
                            }
                            className={`p-2 rounded-lg ${
                              darkMode
                                ? "hover:bg-blue-900/50"
                                : "hover:bg-blue-100"
                            } transition-all`}
                            title="Editar categoría"
                          >
                            <Edit2 className="w-4 h-4 text-blue-600" />
                          </button>
                          <button
                            onClick={() =>
                              onRequestDelete({ type: "category", category: categoryName })
                            }
                            className={`p-2 rounded-lg ${
                              darkMode ? "hover:bg-red-900/50" : "hover:bg-red-100"
                            } transition-all`}
                            title="Eliminar categoría"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="space-y-2">
                    {subcategories.length > 0 ? (
                      subcategories.map((sub) => {
                        const isEditing = editingSubcategory?.category === categoryName && editingSubcategory?.oldName === sub;
                        return (
                          <div
                            key={sub}
                            className={`flex justify-between items-center p-2 rounded-lg ${
                              darkMode ? "bg-gray-600" : "bg-white"
                            }`}
                          >
                            {isEditing ? (
                              <div className="flex-1 flex gap-2 items-center">
                                <input
                                  type="text"
                                  value={editingSubcategory.newName}
                                  onChange={(e) =>
                                    onStartEditSubcategory({
                                      ...editingSubcategory,
                                      newName: e.target.value,
                                    })
                                  }
                                  className={`flex-1 px-2 py-1.5 rounded-lg border ${inputClass} focus:ring-2 focus:border-transparent text-sm`}
                                  placeholder="Nombre de subcategoría"
                                />
                                <button
                                  onClick={() => onSaveEditSubcategory()}
                                  className={`p-1.5 rounded-lg ${
                                    darkMode
                                      ? "bg-green-700 hover:bg-green-600"
                                      : "bg-green-500 hover:bg-green-600"
                                  } text-white transition-all`}
                                  title="Guardar"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => onCancelEditSubcategory()}
                                  className={`p-1.5 rounded-lg ${
                                    darkMode
                                      ? "bg-gray-600 hover:bg-gray-500"
                                      : "bg-gray-400 hover:bg-gray-500"
                                  } text-white transition-all`}
                                  title="Cancelar"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className={`text-sm ${textClass}`}>{sub}</span>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() =>
                                      onStartEditSubcategory({
                                        category: categoryName,
                                        oldName: sub,
                                        newName: sub,
                                      })
                                    }
                                    className={`p-1 rounded ${
                                      darkMode
                                        ? "hover:bg-blue-900/50"
                                        : "hover:bg-blue-100"
                                    } transition-all`}
                                    title="Editar subcategoría"
                                  >
                                    <Edit2 className="w-3 h-3 text-blue-600" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      onRequestDelete({
                                        type: "subcategory",
                                        category: categoryName,
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
                              </>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className={`text-sm ${textClass} opacity-50 italic`}>
                        No hay subcategorías
                      </p>
                    )}
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

export default CategoriesModal;
