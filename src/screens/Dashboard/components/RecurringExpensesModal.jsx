import {
  AlertTriangle,
  Calendar,
  Check,
  Clock,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

const RecurringExpensesModal = ({
  visible,
  darkMode,
  cardClass,
  textClass,
  textSecondaryClass,
  inputClass,
  categories,
  recurringExpenses,
  newRecurring,
  onNewRecurringChange,
  onAddRecurring,
  onUpdateRecurring,
  onRequestDelete,
  onStartEdit,
  editingRecurring,
  onEditingRecurringChange,
  onSubmitEditRecurring,
  onCancelEdit,
  onClose,
}) => {
  if (!visible) {
    return null;
  }

  const updateNewRecurring = (field, value) => {
    onNewRecurringChange({
      ...newRecurring,
      [field]: value,
    });
  };

  const updateEditingRecurring = (field, value) => {
    if (!editingRecurring) return;
    onEditingRecurringChange({
      ...editingRecurring,
      [field]: value,
    });
  };

  const activeTotal = recurringExpenses
    .filter((recurring) => recurring.active)
    .reduce((sum, recurring) => sum + recurring.amount, 0);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`${cardClass} rounded-2xl p-0 max-w-2xl w-full border shadow-2xl max-h-[90vh] overflow-y-auto`}
      >
        <div
          className={`sticky top-0 z-10 px-6 py-4 flex justify-between items-center ${
            darkMode
              ? "bg-gray-800/95 border-b border-gray-700"
              : "bg-white/80 border-b border-purple-100"
          } backdrop-blur`}
        >
          <div>
            <h3 className={`text-2xl font-bold ${textClass}`}>Gastos Recurrentes</h3>
            <p className={`text-sm ${textSecondaryClass} mt-1`}>
              Gestiona tus pagos mensuales automáticos
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${
              darkMode ? "hover:bg-gray-700" : "hover:bg-purple-100"
            } transition-all`}
          >
            <X className={`w-6 h-6 ${textClass}`} />
          </button>
        </div>

        <div className="px-6 pt-4">
          <div
            className={`mb-4 p-4 rounded-xl ${
              darkMode
                ? "bg-purple-900/30 border-purple-700"
                : "bg-purple-50 border-purple-200"
            } border-2`}
          >
            <div className="flex justify-between items-center">
              <span className={`font-semibold ${textClass}`}>
                Total Gastos Recurrentes Mensuales (activos)
              </span>
              <span
                className={`text-2xl font-bold ${
                  darkMode ? "text-purple-400" : "text-purple-600"
                }`}
              >
                €{activeTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-6 px-6 pb-6">
          <div
            className={`p-4 rounded-xl ${
              darkMode ? "bg-gray-700/50" : "bg-purple-50/50"
            } border ${darkMode ? "border-gray-600" : "border-purple-200"}`}
          >
            <h4 className={`text-lg font-semibold ${textClass} mb-4`}>
              Añadir Nuevo Gasto Recurrente
            </h4>
            <form onSubmit={onAddRecurring} className="space-y-3">
              <div>
                <label className={`block text-sm font-medium ${textClass} mb-1`}>
                  Nombre del gasto
                </label>
                <input
                  type="text"
                  placeholder="Ej: Netflix, Alquiler, Gimnasio..."
                  value={newRecurring.name}
                  onChange={(e) => updateNewRecurring("name", e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-sm font-medium ${textClass} mb-1`}>
                    Cantidad (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newRecurring.amount}
                    onChange={(e) => updateNewRecurring("amount", e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${textClass} mb-1`}>
                    Día del mes
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={newRecurring.dayOfMonth}
                    onChange={(e) => updateNewRecurring("dayOfMonth", e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-sm font-medium ${textClass} mb-1`}>
                    Método de pago
                  </label>
                  <select
                    value={newRecurring.paymentMethod}
                    onChange={(e) => updateNewRecurring("paymentMethod", e.target.value)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                  >
                    <option value="Tarjeta">Tarjeta</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Bizum">Bizum</option>
                    <option value="Transferencia">Transferencia</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium ${textClass} mb-1`}>
                    Categoría
                  </label>
                  <select
                    value={newRecurring.category}
                    onChange={(e) =>
                      onNewRecurringChange({
                        ...newRecurring,
                        category: e.target.value,
                        subcategory: "",
                      })
                    }
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                    required
                  >
                    <option value="">Seleccionar categoría</option>
                    {Object.keys(categories).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {newRecurring.category && (
                <div>
                  <label className={`block text-sm font-medium ${textClass} mb-1`}>
                    Subcategoría
                  </label>
                  <select
                    value={newRecurring.subcategory}
                    onChange={(e) => updateNewRecurring("subcategory", e.target.value)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                    required
                  >
                    <option value="">Seleccionar subcategoría</option>
                    {categories[newRecurring.category]?.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className={`block text-sm font-medium ${textClass} mb-1`}>
                  Fecha de fin (opcional)
                  <span className={`text-xs ml-2 ${textSecondaryClass}`}>
                    Déjalo vacío si no tiene fin
                  </span>
                </label>
                <div className="relative">
                  <Calendar
                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${textSecondaryClass} pointer-events-none`}
                  />
                  <input
                    type="date"
                    value={newRecurring.endDate}
                    onChange={(e) => updateNewRecurring("endDate", e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className={`w-full pl-10 pr-10 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                  />
                  {newRecurring.endDate && (
                    <button
                      type="button"
                      onClick={() => updateNewRecurring("endDate", "")}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded ${
                        darkMode ? "hover:bg-gray-600" : "hover:bg-purple-100"
                      }`}
                      aria-label="Limpiar fecha"
                      title="Limpiar fecha"
                    >
                      <X className={`w-4 h-4 ${textSecondaryClass}`} />
                    </button>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Añadir Gasto Recurrente
              </button>
            </form>
          </div>

          <div>
            <h4 className={`text-lg font-semibold ${textClass} mb-3`}>
              Gastos Recurrentes Activos
            </h4>
            {recurringExpenses.length === 0 ? (
              <div className="text-center py-12">
                <Clock className={`w-16 h-16 ${textSecondaryClass} mx-auto mb-4`} />
                <p className={`${textClass} font-medium mb-2`}>
                  No hay gastos recurrentes todavía
                </p>
                <p className={`text-sm ${textSecondaryClass}`}>
                  Añade tus suscripciones y pagos mensuales aquí
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recurringExpenses.map((recurring) => (
                  <div
                    key={recurring.id}
                    className={`p-4 rounded-xl ${
                      darkMode ? "bg-gray-700" : "bg-white"
                    } border ${
                      darkMode ? "border-gray-600" : "border-purple-100"
                    } hover:shadow-md transition-all ${
                      !recurring.active ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h5
                            className={`font-bold text-lg ${
                              recurring.active
                                ? textClass
                                : darkMode
                                ? "text-gray-500"
                                : "text-gray-400"
                            }`}
                          >
                            {recurring.name}
                          </h5>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              recurring.active
                                ? darkMode
                                  ? "bg-green-900/50 text-green-400"
                                  : "bg-green-100 text-green-700"
                                : darkMode
                                ? "bg-gray-600 text-gray-400"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {recurring.active ? "Activo" : "Pausado"}
                          </span>
                        </div>
                        <div
                          className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-sm ${
                            recurring.active
                              ? textSecondaryClass
                              : darkMode
                              ? "text-gray-600"
                              : "text-gray-400"
                          }`}
                        >
                          <span className="flex items-center gap-1">
                            <span className="font-medium">Categoría:</span>
                            {recurring.category} • {recurring.subcategory}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Día {recurring.dayOfMonth} de cada mes
                          </span>
                          <span>{recurring.paymentMethod}</span>
                        </div>
                        {recurring.endDate && (
                          <div
                            className={`mt-2 flex items-center gap-1 text-sm ${
                              darkMode ? "text-orange-400" : "text-orange-600"
                            }`}
                          >
                            <AlertTriangle className="w-4 h-4" />
                            Finaliza el {" "}
                            {new Date(recurring.endDate).toLocaleDateString("es-ES")}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-2xl font-bold ${
                            recurring.active
                              ? textClass
                              : darkMode
                              ? "text-gray-500"
                              : "text-gray-400"
                          }`}
                        >
                          €{recurring.amount.toFixed(2)}
                        </p>
                        <p
                          className={`text-xs mt-0.5 ${
                            recurring.active
                              ? textSecondaryClass
                              : darkMode
                              ? "text-gray-600"
                              : "text-gray-400"
                          }`}
                        >
                          por mes
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-3 border-t border-purple-100">
                      <button
                        onClick={() => onStartEdit(recurring)}
                        className={`py-2 px-4 rounded-lg transition-all flex items-center gap-2 sm:flex-none flex-1 ${
                          darkMode
                            ? "bg-purple-900/50 hover:bg-purple-900"
                            : "bg-purple-100 hover:bg-purple-200"
                        }`}
                      >
                        <Pencil
                          className={`w-4 h-4 ${
                            darkMode ? "text-purple-300" : "text-purple-700"
                          }`}
                        />
                        <span
                          className={`text-sm font-medium ${
                            darkMode ? "text-purple-300" : "text-purple-700"
                          }`}
                        >
                          Editar
                        </span>
                      </button>
                      <button
                        onClick={() =>
                          onUpdateRecurring(recurring.id, {
                            active: !recurring.active,
                          })
                        }
                        className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2 ${
                          recurring.active
                            ? darkMode
                              ? "bg-orange-900/50 hover:bg-orange-900"
                              : "bg-orange-100 hover:bg-orange-200"
                            : darkMode
                            ? "bg-green-900/50 hover:bg-green-900"
                            : "bg-green-100 hover:bg-green-200"
                        }`}
                      >
                        {recurring.active ? (
                          <>
                            <X className="w-4 h-4" />
                            <span
                              className={`text-sm font-medium ${
                                darkMode ? "text-orange-400" : "text-orange-700"
                              }`}
                            >
                              Pausar
                            </span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span
                              className={`text-sm font-medium ${
                                darkMode ? "text-green-400" : "text-green-700"
                              }`}
                            >
                              Activar
                            </span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => onRequestDelete({ type: "recurring", id: recurring.id })}
                        className={`py-2 px-3 rounded-lg transition-all flex items-center gap-2 sm:flex-none flex-1 ${
                          darkMode
                            ? "bg-red-900/50 hover:bg-red-900"
                            : "bg-red-100 hover:bg-red-200"
                        }`}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                        <span className={`text-sm font-medium text-red-600`}>
                          Eliminar
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* editing handled in dedicated dialog */}

          {editingRecurring && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
              <div
                className={`${cardClass} w-full max-w-xl rounded-2xl border shadow-2xl ${
                  darkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                <div
                  className={`flex items-center justify-between px-6 py-4 border-b ${
                    darkMode ? "border-gray-700" : "border-purple-100"
                  }`}
                >
                  <h4 className={`text-lg font-semibold ${textClass}`}>
                    Editar Gasto Recurrente
                  </h4>
                  <button
                    onClick={onCancelEdit}
                    className={`p-2 rounded-lg ${
                      darkMode ? "hover:bg-gray-700" : "hover:bg-purple-100"
                    } transition-all`}
                    aria-label="Cerrar edición de gasto recurrente"
                  >
                    <X className={`w-5 h-5 ${textClass}`} />
                  </button>
                </div>

                <form onSubmit={onSubmitEditRecurring} className="px-6 py-5 space-y-4">
                  <div>
                    <label className={`block text-sm font-medium ${textClass} mb-2`}>
                      Nombre del gasto
                    </label>
                    <input
                      type="text"
                      value={editingRecurring.name}
                      onChange={(e) => updateEditingRecurring("name", e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-sm font-medium ${textClass} mb-2`}>
                        Cantidad (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingRecurring.amount}
                        onChange={(e) => updateEditingRecurring("amount", e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                        required
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${textClass} mb-2`}>
                        Categoría
                      </label>
                      <select
                        value={editingRecurring.category}
                        onChange={(e) =>
                          onEditingRecurringChange({
                            ...editingRecurring,
                            category: e.target.value,
                            subcategory: "",
                          })
                        }
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                        required
                      >
                        <option value="">Seleccionar categoría</option>
                        {Object.keys(categories).map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {editingRecurring.category && (
                    <div>
                      <label className={`block text-sm font-medium ${textClass} mb-2`}>
                        Subcategoría
                      </label>
                      <select
                        value={editingRecurring.subcategory}
                        onChange={(e) => updateEditingRecurring("subcategory", e.target.value)}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                        required
                      >
                        <option value="">Seleccionar subcategoría</option>
                        {categories[editingRecurring.category]?.map((sub) => (
                          <option key={sub} value={sub}>
                            {sub}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-sm font-medium ${textClass} mb-2`}>
                        Día del mes
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={editingRecurring.dayOfMonth}
                        onChange={(e) => updateEditingRecurring("dayOfMonth", e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                        required
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${textClass} mb-2`}>
                        Método de pago
                      </label>
                      <select
                        value={editingRecurring.paymentMethod}
                        onChange={(e) => updateEditingRecurring("paymentMethod", e.target.value)}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                      >
                        <option value="Tarjeta">Tarjeta</option>
                        <option value="Efectivo">Efectivo</option>
                        <option value="Bizum">Bizum</option>
                        <option value="Transferencia">Transferencia</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${textClass} mb-2`}>
                      Fecha de fin (opcional)
                      <span className={`text-xs ml-2 ${textSecondaryClass}`}>
                        Déjalo vacío si no tiene fin
                      </span>
                    </label>
                    <div className="relative">
                      <Calendar
                        className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${textSecondaryClass} pointer-events-none`}
                      />
                      <input
                        type="date"
                        value={editingRecurring.endDate || ""}
                        onChange={(e) => updateEditingRecurring("endDate", e.target.value)}
                        className={`w-full pl-10 pr-10 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                      />
                      {editingRecurring.endDate && (
                        <button
                          type="button"
                          onClick={() => updateEditingRecurring("endDate", "")}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded ${
                            darkMode ? "hover:bg-gray-700" : "hover:bg-purple-100"
                          }`}
                          aria-label="Limpiar fecha"
                          title="Limpiar fecha"
                        >
                          <X className={`w-4 h-4 ${textSecondaryClass}`} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        id="editing-recurring-active"
                        type="checkbox"
                        checked={editingRecurring.active}
                        onChange={(e) => updateEditingRecurring("active", e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <label
                        htmlFor="editing-recurring-active"
                        className={`text-sm font-medium ${textClass}`}
                      >
                        Activo
                      </label>
                    </div>
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={onCancelEdit}
                        className={`px-4 py-2 rounded-lg border ${
                          darkMode
                            ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                            : "border-purple-200 text-purple-700 hover:bg-purple-50"
                        } transition-all`}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                      >
                        <Pencil className="w-4 h-4" />
                        Guardar cambios
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default RecurringExpensesModal;
