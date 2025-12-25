import { useEffect, useRef } from "react";
import {
  AlertTriangle,
  Calendar,
  Check,
  Clock,
  Pencil,
  Plus,
  Trash2,
  X,
} from "@/components/icons";
import { createPortal } from "react-dom";
import { getCategorySubcategories } from "../../../services/firestoreService";
import { useTranslation } from "../../../contexts/LanguageContext";
import { useDisableBodyScroll } from "../../../hooks/useDisableBodyScroll";
import type { Categories, RecurringExpense, RecurringExpenseFormInput } from "../../../types/dashboard";

interface EditRecurringDialogProps {
  open: boolean;
  darkMode: boolean;
  cardClass: string;
  textClass: string;
  textSecondaryClass: string;
  inputClass: string;
  categories: Categories;
  editingRecurring: RecurringExpense | null;
  onEditingRecurringChange: (value: RecurringExpense) => void;
  onSubmitEditRecurring?: (payload: RecurringExpense) => void;
  onCancelEdit: () => void;
}

/** Modal de edición montado en portal (document.body) */
function EditRecurringDialog({
  open,
  darkMode,
  cardClass,
  textClass,
  textSecondaryClass,
  inputClass,
  categories,
  editingRecurring,
  onEditingRecurringChange,
  onSubmitEditRecurring,
  onCancelEdit,
}: EditRecurringDialogProps) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const firstInputRef = useRef<HTMLInputElement | null>(null);

  // Deshabilitar scroll del body cuando el diálogo está abierto
  useDisableBodyScroll(open);

  // Foco inicial
  useEffect(() => {
    if (!open) return;
    const tId = setTimeout(() => firstInputRef.current?.focus(), 0);
    return () => clearTimeout(tId);
  }, [open]);

  // Cerrar con ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancelEdit();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancelEdit]);

  const updateEditing = (field: keyof RecurringExpense, value: unknown) => {
    if (!editingRecurring) return;
    onEditingRecurringChange({
      ...editingRecurring,
      [field]: value as never,
    });
  };

  // Normaliza tipos para Firebase
  const normalizeRecurring = (r: RecurringExpense): RecurringExpense => ({
    ...r,
    id: r.id,
    active: !!r.active,
    amount: Number(r.amount ?? 0),
    dayOfMonth: Number(r.dayOfMonth ?? 1),
    frequency: r.frequency || "monthly",
    endDate: r.endDate ? r.endDate : undefined,
  });

  if (!open || !editingRecurring) {
    return null;
  }

  const content = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-recurring-title"
      onMouseDown={onCancelEdit} // clic fuera cierra
      style={{
        overscrollBehavior: "none",
        touchAction: "none",
      }}
    >
      <div
        ref={dialogRef}
        onMouseDown={(e) => e.stopPropagation()} // evita cierre si clic dentro
        className={`${cardClass} w-full max-w-xl rounded-2xl border shadow-2xl max-h-[90vh] flex flex-col overflow-hidden ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}
        style={{
          overscrollBehavior: "none",
          touchAction: "none",
        }}
      >
        <div
          className={`flex-shrink-0 flex items-center justify-between px-6 py-4 border-b ${
            darkMode ? "border-gray-700" : "border-purple-100"
          }`}
        >
          <h4
            id="edit-recurring-title"
            className={`text-lg font-semibold ${textClass}`}
          >
            {t("recurring.edit")}
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

        <div
          className="overflow-y-auto flex-1"
          style={{
            WebkitOverflowScrolling: "touch",
            scrollBehavior: "smooth",
            overscrollBehavior: "contain",
            touchAction: "pan-y",
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!editingRecurring) return;
              const payload = normalizeRecurring(editingRecurring);
              onSubmitEditRecurring && onSubmitEditRecurring(payload); // solo payload
            }}
            className="px-6 py-5 space-y-4"
          >
            <div>
              <label className={`block text-sm font-medium ${textClass} mb-2`}>
                {t("recurring.expenseName")}
              </label>
              <input
                ref={firstInputRef}
                type="text"
                value={editingRecurring.name}
                onChange={(e) => updateEditing("name", e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  className={`block text-sm font-medium ${textClass} mb-2`}
                >
                  {t("expenses.amount")} (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editingRecurring.amount}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || parseFloat(value) >= 0) {
                      updateEditing("amount", value);
                    }
                  }}
                  className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                  required
                />
              </div>
              <div>
                <label
                  className={`block text-sm font-medium ${textClass} mb-2`}
                >
                  {t("expenses.category")}
                </label>
                <select
                  value={editingRecurring.category}
                  onClick={(e) => e.stopPropagation()}
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
                  <option value="">{t("expenses.selectCategory")}</option>
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
                <label
                  className={`block text-sm font-medium ${textClass} mb-2`}
                >
                  {t("expenses.subcategory")}
                </label>
                <select
                  value={editingRecurring.subcategory || ""}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) =>
                    updateEditing("subcategory", e.target.value || undefined)
                  }
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                  required
                >
                  <option value="">{t("recurring.selectSubcategory")}</option>
                  {getCategorySubcategories(
                    categories[editingRecurring.category]
                  )?.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  className={`block text-sm font-medium ${textClass} mb-2`}
                >
                  {t("recurring.frequency")}
                </label>
                <select
                  value={editingRecurring.frequency || "monthly"}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) =>
                    updateEditing(
                      "frequency",
                      e.target.value as RecurringExpense["frequency"]
                    )
                  }
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                  required
                >
                  <option value="monthly">
                    {t("recurring.frequencyMonthly")}
                  </option>
                  <option value="quarterly">
                    {t("recurring.frequencyQuarterly")}
                  </option>
                  <option value="semiannual">
                    {t("recurring.frequencySemiannual")}
                  </option>
                  <option value="annual">
                    {t("recurring.frequencyAnnual")}
                  </option>
                </select>
              </div>
              <div>
                <label
                  className={`block text-sm font-medium ${textClass} mb-2`}
                >
                  {t("recurring.dayOfMonth")}
                </label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={editingRecurring.dayOfMonth}
                  onChange={(e) => updateEditing("dayOfMonth", e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                  required
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium ${textClass} mb-2`}>
                {t("expenses.paymentMethod")}
              </label>
              <select
                value={editingRecurring.paymentMethod}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) =>
                  updateEditing(
                    "paymentMethod",
                    e.target.value as RecurringExpense["paymentMethod"]
                  )
                }
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
              >
                <option value="Tarjeta">{t("expenses.card")}</option>
                <option value="Efectivo">{t("expenses.cash")}</option>
                <option value="Bizum">{t("expenses.bizum")}</option>
                <option value="Transferencia">
                  {t("expenses.transfer")}
                </option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium ${textClass} mb-2`}>
                {t("recurring.endDate")}
              </label>
              <div className="relative">
                <Calendar
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${textSecondaryClass} pointer-events-none`}
                />
                <input
                  type="date"
                  value={editingRecurring.endDate || ""}
                  onChange={(e) => updateEditing("endDate", e.target.value)}
                  className={`w-full pl-10 pr-10 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                />
                {editingRecurring.endDate && (
                  <button
                    type="button"
                    onClick={() => updateEditing("endDate", "")}
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
                  checked={!!editingRecurring.active}
                  onChange={(e) => updateEditing("active", e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <label
                  htmlFor="editing-recurring-active"
                  className={`text-sm font-medium ${textClass}`}
                >
                  {t("recurring.active")}
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
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  {t("recurring.saveChanges")}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

interface RecurringExpensesModalProps {
  visible: boolean;
  darkMode: boolean;
  cardClass: string;
  textClass: string;
  textSecondaryClass: string;
  inputClass: string;
  categories: Categories;
  recurringExpenses: RecurringExpense[];
  newRecurring: RecurringExpenseFormInput;
  onNewRecurringChange: (value: RecurringExpenseFormInput) => void;
  onAddRecurring: (e: React.FormEvent<HTMLFormElement>) => void;
  onUpdateRecurring: (id: string, updates: Partial<RecurringExpense>) => void;
  onRequestDelete: (payload: { type: "recurring"; id: string }) => void;
  onStartEdit: (recurring: RecurringExpense) => void;
  editingRecurring: RecurringExpense | null;
  onEditingRecurringChange: (value: RecurringExpense) => void;
  onSubmitEditRecurring?: (payload: RecurringExpense) => void;
  onCancelEdit: () => void;
  onClose: () => void;
}

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
}: RecurringExpensesModalProps) => {
  const { t } = useTranslation();
  const modalContentRef = useRef<HTMLDivElement | null>(null);

  // Deshabilitar scroll del body cuando el modal está abierto
  useDisableBodyScroll(visible);

  if (!visible) return null;

  const updateNew = (field: keyof RecurringExpense, value: unknown) => {
    onNewRecurringChange({ ...newRecurring, [field]: value as never });
  };

  // Función para obtener el texto de frecuencia
  const getFrequencyText = (frequency?: RecurringExpense["frequency"]) => {
    switch (frequency) {
      case "monthly":
        return t("recurring.frequencyMonthly");
      case "quarterly":
        return t("recurring.frequencyQuarterly");
      case "semiannual":
        return t("recurring.frequencySemiannual");
      case "annual":
        return t("recurring.frequencyAnnual");
      default:
        return t("recurring.frequencyMonthly");
    }
  };

  // Función para obtener el texto completo de frecuencia con día
  const getFrequencyDisplayText = (recurring: RecurringExpense) => {
    const frequency = recurring.frequency || "monthly";
    const frequencyText = getFrequencyText(frequency);
    if (frequency === "monthly") {
      return `${t("recurring.dayOf")} ${recurring.dayOfMonth} ${t(
        "recurring.every"
      )} ${frequencyText.toLowerCase()}`;
    }
    return `${t("recurring.dayOf")} ${recurring.dayOfMonth} - ${frequencyText}`;
  };

  // Calcular total mensual considerando frecuencias
  const activeTotal = recurringExpenses
    .filter((r) => r.active)
    .reduce((sum, r) => {
      const amount = Number(r.amount || 0);
      const frequency = r.frequency || "monthly";
      let monthlyAmount = amount;

      switch (frequency) {
        case "monthly":
          monthlyAmount = amount;
          break;
        case "quarterly":
          monthlyAmount = amount / 3;
          break;
        case "semiannual":
          monthlyAmount = amount / 6;
          break;
        case "annual":
          monthlyAmount = amount / 12;
          break;
        default:
          monthlyAmount = amount;
      }

      return sum + monthlyAmount;
    }, 0);

  return (
    <>
      {/* MODAL PRINCIPAL */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden"
        style={{ zIndex: 9999999 }}
        onMouseDown={onClose}
        style={{
          overscrollBehavior: "none",
          touchAction: "none",
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div
          ref={modalContentRef}
          className={`${cardClass} rounded-2xl p-0 max-w-2xl w-full border shadow-2xl max-h-[90vh] flex flex-col overflow-hidden`}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          style={{
            overscrollBehavior: "none",
            touchAction: "none",
          }}
        >
          {/* Header fijo */}
          <div
            className={`flex-shrink-0 px-6 py-4 flex justify-between items-center border-b ${
              darkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-purple-100"
            }`}
          >
            <div>
              <h3 className={`text-2xl font-bold ${textClass}`}>
                {t("recurring.manage")}
              </h3>
              <p className={`text-sm ${textSecondaryClass} mt-1`}>
                {t("recurring.title")}
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

          {/* Contenedor scrolleable */}
          <div
            className="overflow-y-auto flex-1"
            style={{
              WebkitOverflowScrolling: "touch",
              scrollBehavior: "smooth",
              overscrollBehavior: "contain",
              touchAction: "pan-y",
            }}
          >
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
                    {t("recurring.totalMonthly")}
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

            <div className="space-y-6 px-6 pb-32">
              {/* Añadir nuevo */}
              <div
                className={`p-4 rounded-xl ${
                  darkMode ? "bg-gray-700/50" : "bg-purple-50/50"
                } border ${darkMode ? "border-gray-600" : "border-purple-200"}`}
              >
                <h4 className={`text-lg font-semibold ${textClass} mb-4`}>
                  {t("recurring.addNew")}
                </h4>
                <form onSubmit={onAddRecurring} className="space-y-3">
                  <div>
                    <label
                      className={`block text-sm font-medium ${textClass} mb-1`}
                    >
                      {t("recurring.expenseName")}
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Netflix, Alquiler, Gimnasio..."
                      value={newRecurring.name}
                      onChange={(e) => updateNew("name", e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                      required
                    />
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium ${textClass} mb-1`}
                    >
                      {t("expenses.category")}
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
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                      required
                    >
                      <option value="">{t("expenses.selectCategory")}</option>
                      {Object.keys(categories).map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {newRecurring.category && (
                    <div>
                      <label
                        className={`block text-sm font-medium ${textClass} mb-1`}
                      >
                        {t("expenses.subcategory")}
                      </label>
                      <select
                        value={newRecurring.subcategory || ""}
                        onChange={(e) =>
                          updateNew(
                            "subcategory",
                            e.target.value || undefined
                          )
                        }
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                        required
                      >
                        <option value="">
                          {t("recurring.selectSubcategory")}
                        </option>
                        {getCategorySubcategories(
                          categories[newRecurring.category]
                        )?.map((sub) => (
                          <option key={sub} value={sub}>
                            {sub}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label
                      className={`block text-sm font-medium ${textClass} mb-1`}
                    >
                      {t("expenses.paymentMethod")}
                    </label>
                    <select
                      value={newRecurring.paymentMethod}
                      onChange={(e) =>
                        updateNew("paymentMethod", e.target.value)
                      }
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                    >
                      <option value="Tarjeta">{t("expenses.card")}</option>
                      <option value="Efectivo">{t("expenses.cash")}</option>
                      <option value="Bizum">{t("expenses.bizum")}</option>
                      <option value="Transferencia">
                        {t("expenses.transfer")}
                      </option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        className={`block text-sm font-medium ${textClass} mb-1`}
                      >
                        {t("expenses.amount")} (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        placeholder="0.00"
                        value={newRecurring.amount}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "" || parseFloat(value) >= 0) {
                            updateNew("amount", value);
                          }
                        }}
                        className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                        required
                      />
                    </div>
                    <div>
                      <label
                        className={`block text-sm font-medium ${textClass} mb-1`}
                      >
                        {t("recurring.dayOfMonth")}
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={31}
                        value={newRecurring.dayOfMonth}
                        onChange={(e) =>
                          updateNew("dayOfMonth", e.target.value)
                        }
                        className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium ${textClass} mb-1`}
                    >
                      {t("recurring.frequency")}
                    </label>
                    <select
                      value={newRecurring.frequency || "monthly"}
                      onChange={(e) =>
                        updateNew(
                          "frequency",
                          e.target.value as RecurringExpense["frequency"]
                        )
                      }
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                      required
                    >
                      <option value="monthly">
                        {t("recurring.frequencyMonthly")}
                      </option>
                      <option value="quarterly">
                        {t("recurring.frequencyQuarterly")}
                      </option>
                      <option value="semiannual">
                        {t("recurring.frequencySemiannual")}
                      </option>
                      <option value="annual">
                        {t("recurring.frequencyAnnual")}
                      </option>
                    </select>
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium ${textClass} mb-1`}
                    >
                      {t("recurring.endDate")}
                    </label>
                    <div className="relative">
                      <Calendar
                        className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${textSecondaryClass} pointer-events-none`}
                      />
                      <input
                        type="date"
                        value={newRecurring.endDate || ""}
                        onChange={(e) =>
                          updateNew("endDate", e.target.value || undefined)
                        }
                        min={new Date().toISOString().split("T")[0]}
                        className={`w-full pl-10 pr-10 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                      />
                      {newRecurring.endDate && (
                        <button
                          type="button"
                          onClick={() => updateNew("endDate", undefined)}
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
                    {t("recurring.addNew")}
                  </button>
                </form>
              </div>

              {/* Listado */}
              <div>
                <h4 className={`text-lg font-semibold ${textClass} mb-3`}>
                  {t("recurring.activeRecurring")}
                </h4>
                {recurringExpenses.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock
                      className={`w-16 h-16 ${textSecondaryClass} mx-auto mb-4`}
                    />
                    <p className={`${textClass} font-medium mb-2`}>
                      {t("recurring.noRecurringYet")}
                    </p>
                    <p className={`text-sm ${textSecondaryClass}`}>
                      {t("recurring.title")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recurringExpenses.map((recurring) => {
                      const frequencyLabel = recurring.frequency || "monthly";
                      const isAnnual = frequencyLabel === "annual";

                      return (
                        <div
                          key={recurring.id}
                          className={`p-4 rounded-xl ${
                            darkMode ? "bg-gray-700" : "bg-white"
                          } border ${
                            darkMode
                              ? "border-gray-600"
                              : "border-purple-100"
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
                                  {recurring.active
                                    ? t("recurring.active")
                                    : t("recurring.paused")}
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
                                  <span className="font-medium">
                                    Categoría:
                                  </span>
                                  {recurring.category} •{" "}
                                  {recurring.subcategory}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {getFrequencyDisplayText(recurring)}
                                </span>
                                <span>{recurring.paymentMethod}</span>
                              </div>
                              {recurring.endDate && (
                                <div
                                  className={`mt-2 flex items-center gap-1 text-sm ${
                                    darkMode
                                      ? "text-orange-400"
                                      : "text-orange-600"
                                  }`}
                                >
                                  <AlertTriangle className="w-4 h-4" />
                                  Finaliza el{" "}
                                  {new Date(
                                    recurring.endDate
                                  ).toLocaleDateString("es-ES")}
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
                                €{Number(recurring.amount || 0).toFixed(2)}
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
                                {isAnnual ? "anual" : "por mes"}
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
                                  darkMode
                                    ? "text-purple-300"
                                    : "text-purple-700"
                                }`}
                              />
                              <span
                                className={`text-sm font-medium ${
                                  darkMode
                                    ? "text-purple-300"
                                    : "text-purple-700"
                                }`}
                              >
                                Editar
                              </span>
                            </button>
                            <button
                              onClick={() =>
                                onUpdateRecurring(recurring.id || "", {
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
                                      darkMode
                                        ? "text-orange-400"
                                        : "text-orange-700"
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
                                      darkMode
                                        ? "text-green-400"
                                        : "text-green-700"
                                    }`}
                                  >
                                    Activar
                                  </span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() =>
                                onRequestDelete({
                                  type: "recurring",
                                  id: recurring.id || "",
                                })
                              }
                              className={`py-2 px-3 rounded-lg transition-all flex items-center gap-2 sm:flex-none flex-1 ${
                                darkMode
                                  ? "bg-red-900/50 hover:bg-red-900"
                                  : "bg-red-100 hover:bg-red-200"
                              }`}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                              <span className="text-sm font-medium text-red-600">
                                Eliminar
                              </span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Fin del contenedor scrolleable */}
        </div>
      </div>

      {/* MODAL DE EDICIÓN (PORTAL) */}
      <EditRecurringDialog
        open={!!editingRecurring}
        darkMode={darkMode}
        cardClass={cardClass}
        textClass={textClass}
        textSecondaryClass={textSecondaryClass}
        inputClass={inputClass}
        categories={categories}
        editingRecurring={editingRecurring}
        onEditingRecurringChange={onEditingRecurringChange}
        onSubmitEditRecurring={onSubmitEditRecurring}
        onCancelEdit={onCancelEdit}
      />
    </>
  );
};

export default RecurringExpensesModal;


