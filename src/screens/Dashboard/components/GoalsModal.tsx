import { useState, useEffect } from "react";
import { Target, Trash2, X, Calendar, Plus, DollarSign } from "lucide-react";
import { useTranslation } from "../../../contexts/LanguageContext";
import { getLongTermGoalProgress } from "../../../services/goalsService";
import { useDisableBodyScroll } from "../../../hooks/useDisableBodyScroll";

const GoalsModal = ({
  visible,
  darkMode,
  cardClass,
  textClass,
  textSecondaryClass,
  inputClass,
  categories,
  goals,
  income,
  categoryTotals,
  onSaveGoals,
  onSaveIncome,
  onRequestDelete,
  onClose,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("monthly"); // "monthly" | "longTerm"
  
  // Deshabilitar scroll del body cuando el modal está abierto
  useDisableBodyScroll(visible);
  
  // Objetivos mensuales
  const [monthlySavingsGoal, setMonthlySavingsGoal] = useState(goals?.monthlySavingsGoal || goals?.totalSavingsGoal || 0);
  const [categoryGoals, setCategoryGoals] = useState(goals?.categoryGoals || {});
  const [newGoalCategory, setNewGoalCategory] = useState("");
  const [newGoalAmount, setNewGoalAmount] = useState("");
  
  // Objetivos a largo plazo
  const [longTermGoals, setLongTermGoals] = useState(goals?.longTermGoals || []);
  const [showLongTermForm, setShowLongTermForm] = useState(false);
  const [newLongTermGoal, setNewLongTermGoal] = useState({
    name: "",
    targetAmount: "",
    targetDate: "",
    icon: "🎯",
    currentAmount: 0,
  });

  useEffect(() => {
    setMonthlySavingsGoal(goals?.monthlySavingsGoal || goals?.totalSavingsGoal || 0);
    setCategoryGoals(goals?.categoryGoals || {});
    // Filtrar objetivos null/undefined
    const validGoals = (goals?.longTermGoals || []).filter((g) => g !== null && g !== undefined);
    setLongTermGoals(validGoals);
  }, [goals]);

  if (!visible) {
    return null;
  }

  const handleSave = () => {
    onSaveGoals({
      monthlySavingsGoal: parseFloat(monthlySavingsGoal) || 0,
      totalSavingsGoal: parseFloat(monthlySavingsGoal) || 0, // Compatibilidad
      categoryGoals: categoryGoals,
      longTermGoals: longTermGoals,
      achievements: goals?.achievements || {
        totalCompleted: 0,
        streakMonths: 0,
        badges: [],
      },
      monthlyHistory: goals?.monthlyHistory || {},
    });
  };

  const handleAddCategoryGoal = (e) => {
    e.preventDefault();
    if (!newGoalCategory || !newGoalAmount) return;

    setCategoryGoals({
      ...categoryGoals,
      [newGoalCategory]: parseFloat(newGoalAmount) || 0,
    });
    setNewGoalCategory("");
    setNewGoalAmount("");
  };

  const handleDeleteCategoryGoal = (category) => {
    onRequestDelete({ type: "categoryGoal", category });
  };

  const handleAddLongTermGoal = (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!newLongTermGoal.name || !newLongTermGoal.name.trim()) {
      return;
    }
    
    const targetAmount = parseFloat(newLongTermGoal.targetAmount);
    if (!targetAmount || targetAmount <= 0) {
      return;
    }
    
    if (!newLongTermGoal.targetDate) {
      return;
    }

    const targetDate = new Date(newLongTermGoal.targetDate);
    const today = new Date();
    
    // Validar que la fecha no sea en el pasado
    if (targetDate < today) {
      return;
    }
    
    const monthsDiff = Math.max(1, Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24 * 30)));
    const monthlyContribution = targetAmount / monthsDiff;
    const currentAmount = parseFloat(newLongTermGoal.currentAmount) || 0;

    const newGoal = {
      id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newLongTermGoal.name.trim(),
      targetAmount: targetAmount,
      currentAmount: currentAmount,
      startDate: today.toISOString().split("T")[0],
      targetDate: newLongTermGoal.targetDate,
      monthlyContribution: monthlyContribution,
      icon: (newLongTermGoal.icon && newLongTermGoal.icon.trim()) || "🎯",
      status: "active",
    };

    setLongTermGoals([...longTermGoals, newGoal]);
    setNewLongTermGoal({ name: "", targetAmount: "", targetDate: "", icon: "🎯", currentAmount: 0 });
    setShowLongTermForm(false);
  };

  const handleDeleteLongTermGoal = (goalId) => {
    onRequestDelete({ type: "longTermGoal", goalId });
  };

  const handleUpdateLongTermGoalCurrentAmount = (goalId, newAmount) => {
    setLongTermGoals(
      longTermGoals
        .filter((goal) => goal !== null && goal !== undefined)
        .map((goal) =>
          goal && goal.id === goalId
            ? { ...goal, currentAmount: parseFloat(newAmount) || 0 }
            : goal
        )
    );
  };

  // Calcular ahorro actual
  const currentMonthExpenses = categoryTotals.reduce((sum, item) => sum + item.total, 0);
  const currentSavings = income > 0 ? income - currentMonthExpenses : 0;
  // Convertir monthlySavingsGoal a número para operaciones numéricas
  const monthlySavingsGoalNum = parseFloat(monthlySavingsGoal) || 0;
  const savingsProgress = monthlySavingsGoalNum > 0 ? (currentSavings / monthlySavingsGoalNum) * 100 : 0;

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
          <div className="flex items-center gap-3">
            <Target className={`w-6 h-6 ${darkMode ? "text-purple-400" : "text-purple-600"}`} />
            <h3 className={`text-2xl font-bold ${textClass}`}>
              {t("goals.title")}
            </h3>
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

        <div className="px-6 py-6">
          {/* SECCIÓN DE INGRESOS - AÑADIDA */}
          {onSaveIncome && (
            <div className={`p-5 rounded-xl border-2 mb-6 ${
              darkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
            }`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${textClass}`}>
                    Ingresos Mensuales
                  </h3>
                  <p className={`text-sm ${textSecondaryClass}`}>
                    Tu sueldo o ingresos fijos mensuales
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="number"
                    value={income || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      onSaveIncome(value);
                    }}
                    placeholder="Ej: 2500"
                    className={`${inputClass} w-full text-2xl font-bold`}
                  />
                </div>
              </div>

              {/* Resumen visual si hay ingresos */}
              {income && income > 0 && (
                <div className="mt-4 pt-4 border-t border-green-200 dark:border-gray-700 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className={textSecondaryClass}>Ingresos mensuales:</span>
                    <span className={`font-semibold ${textClass}`}>{income.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={textSecondaryClass}>Gastos este mes:</span>
                    <span className={`font-semibold ${textClass}`}>
                      {currentMonthExpenses.toFixed(2)}€
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold border-t pt-2 border-green-200 dark:border-gray-700">
                    <span className={textClass}>Disponible:</span>
                    <span className={
                      (income - currentMonthExpenses) >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }>
                      {(income - currentMonthExpenses).toFixed(2)}€
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pestañas */}
          <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab("monthly")}
              className={`px-4 py-2 font-medium transition-all border-b-2 ${
                activeTab === "monthly"
                  ? darkMode
                    ? "border-purple-500 text-purple-400"
                    : "border-purple-600 text-purple-600"
                  : darkMode
                  ? "border-transparent text-gray-400 hover:text-gray-300"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setActiveTab("longTerm")}
              className={`px-4 py-2 font-medium transition-all border-b-2 ${
                activeTab === "longTerm"
                  ? darkMode
                    ? "border-purple-500 text-purple-400"
                    : "border-purple-600 text-purple-600"
                  : darkMode
                  ? "border-transparent text-gray-400 hover:text-gray-300"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              A Largo Plazo
            </button>
          </div>

          {/* Contenido de pestañas */}
          {activeTab === "monthly" && (
            <div className="space-y-6">
              {/* Objetivo de ahorro mensual */}
              <div
                className={`p-4 rounded-xl ${
                  darkMode ? "bg-gray-700" : "bg-purple-50"
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Target className={`w-5 h-5 ${darkMode ? "text-purple-400" : "text-purple-600"}`} />
                  <div className="flex-1">
                    <p className={`font-medium ${textClass}`}>
                      {t("goals.totalSavingsGoal")}
                    </p>
                    <p className={`text-sm ${textSecondaryClass} mt-1`}>
                      {t("goals.totalSavingsDescription")}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={monthlySavingsGoal}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "" || parseFloat(value) >= 0) {
                        setMonthlySavingsGoal(value);
                      }
                    }}
                    className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                    placeholder="0.00"
                  />
                  {monthlySavingsGoalNum > 0 && income > 0 && (
                    <div className="space-y-3 mt-4">
                      <div className="flex justify-between items-baseline">
                        <div>
                          <p className={`text-xs ${textSecondaryClass} mb-1`}>Ahorro actual</p>
                          <p className={`text-2xl font-semibold ${
                            currentSavings >= monthlySavingsGoalNum 
                              ? "text-green-600" 
                              : currentSavings >= monthlySavingsGoalNum * 0.8
                              ? "text-yellow-600"
                              : darkMode ? "text-purple-400" : "text-purple-600"
                          }`}>
                            €{currentSavings.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs ${textSecondaryClass} mb-1`}>Objetivo</p>
                          <p className={`text-lg font-semibold ${textClass}`}>
                            €{monthlySavingsGoalNum.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className={textSecondaryClass}>
                            {currentSavings >= monthlySavingsGoalNum 
                              ? "🎉 ¡Objetivo alcanzado!" 
                              : currentSavings >= monthlySavingsGoalNum * 0.8
                              ? "💪 ¡Casi lo logras!"
                              : `Faltan €${Math.max(0, (monthlySavingsGoalNum - currentSavings)).toFixed(2)}`}
                          </span>
                          <span className={`font-semibold ${
                            savingsProgress >= 100 
                              ? "text-green-600" 
                              : savingsProgress >= 80
                              ? "text-yellow-600"
                              : darkMode ? "text-purple-400" : "text-purple-600"
                          }`}>
                            {Math.min(savingsProgress, 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className={`h-4 rounded-full ${
                          darkMode ? "bg-gray-800" : "bg-purple-100"
                        } overflow-hidden shadow-inner`}>
                          <div
                            className={`h-full transition-all duration-500 ${
                              savingsProgress >= 100
                                ? "bg-gradient-to-r from-green-500 to-green-600"
                                : savingsProgress >= 80
                                ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                                : "bg-gradient-to-r from-purple-600 to-blue-600"
                            }`}
                            style={{ width: `${Math.min(savingsProgress, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

          {/* Metas por categoría */}
          <div
            className={`p-4 rounded-xl ${
              darkMode ? "bg-gray-700" : "bg-purple-50"
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <Target className={`w-5 h-5 ${darkMode ? "text-purple-400" : "text-purple-600"}`} />
              <div className="flex-1">
                <p className={`font-medium ${textClass}`}>
                  {t("goals.categoryGoals")}
                </p>
                <p className={`text-sm ${textSecondaryClass} mt-1`}>
                  {t("goals.categoryGoalsDescription")}
                </p>
              </div>
            </div>

            <form onSubmit={handleAddCategoryGoal} className="space-y-3 mb-4">
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={newGoalCategory}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onChange={(e) => setNewGoalCategory(e.target.value)}
                  className={`px-4 py-2 rounded-lg border ${inputClass} focus:ring-2 focus:border-transparent`}
                >
                  <option value="">{t("goals.selectCategory")}</option>
                  {Object.keys(categories)
                    .filter((cat) => !categoryGoals[cat])
                    .map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                </select>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newGoalAmount}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || parseFloat(value) >= 0) {
                      setNewGoalAmount(value);
                    }
                  }}
                  className={`px-4 py-2 rounded-lg border ${inputClass} focus:ring-2 focus:border-transparent`}
                  placeholder={t("goals.maxAmount")}
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-all"
                disabled={!newGoalCategory || !newGoalAmount}
              >
                {t("goals.addCategoryGoal")}
              </button>
            </form>

            {Object.keys(categoryGoals).length > 0 && (
              <div className="space-y-3">
                {Object.entries(categoryGoals).map(([category, goalAmount]) => {
                  const categoryTotal = categoryTotals.find((ct) => ct.category === category)?.total || 0;
                  const progress = goalAmount > 0 ? (categoryTotal / goalAmount) * 100 : 0;
                  const status = progress >= 100 ? "exceeded" : progress >= 80 ? "warning" : "ok";
                  const remaining = Math.max(0, goalAmount - categoryTotal);

                  return (
                    <div
                      key={category}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        status === "exceeded"
                          ? darkMode 
                            ? "bg-red-900/20 border-red-500/50" 
                            : "bg-red-50 border-red-300"
                          : status === "warning"
                          ? darkMode
                            ? "bg-yellow-900/20 border-yellow-500/50"
                            : "bg-yellow-50 border-yellow-300"
                          : darkMode 
                            ? "bg-gray-800 border-gray-600" 
                            : "bg-white border-purple-200"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor: categories[category]?.color || "#8B5CF6",
                              }}
                            ></span>
                            <span className={`font-medium text-base ${textClass}`}>{category}</span>
                            {status === "exceeded" && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500 text-white font-medium">
                                Excedido
                              </span>
                            )}
                            {status === "warning" && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500 text-white font-medium">
                                Cerca del límite
                              </span>
                            )}
                            {status === "ok" && progress > 0 && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500 text-white font-medium">
                                En buen camino
                              </span>
                            )}
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className={`text-lg font-semibold ${
                              status === "exceeded"
                                ? "text-red-600"
                                : status === "warning"
                                ? "text-yellow-600"
                                : darkMode ? "text-purple-400" : "text-purple-600"
                            }`}>
                              €{categoryTotal.toFixed(2)}
                            </span>
                            <span className={`text-sm ${textSecondaryClass}`}>
                              / €{goalAmount.toFixed(2)}
                            </span>
                          </div>
                          {status !== "exceeded" && remaining > 0 && (
                            <p className={`text-xs mt-1 ${textSecondaryClass}`}>
                              Te quedan €{remaining.toFixed(2)} disponibles
                            </p>
                          )}
                          {status === "exceeded" && (
                            <p className={`text-xs mt-1 text-red-600 font-medium`}>
                              Has excedido el presupuesto en €{(categoryTotal - goalAmount).toFixed(2)}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteCategoryGoal(category)}
                          className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-all flex-shrink-0"
                          title="Eliminar objetivo"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                      <div className={`h-3 rounded-full ${
                        darkMode ? "bg-gray-700" : "bg-purple-100"
                      } overflow-hidden shadow-inner`}>
                        <div
                          className={`h-full transition-all duration-500 ${
                            status === "exceeded"
                              ? "bg-gradient-to-r from-red-500 to-red-600"
                              : status === "warning"
                              ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                              : "bg-gradient-to-r from-green-500 to-green-600"
                          }`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center mt-2 text-xs">
                        <span className={textSecondaryClass}>
                          {progress >= 100 
                            ? "Objetivo alcanzado" 
                            : `${Math.min(progress, 100).toFixed(1)}% del objetivo`}
                        </span>
                        {progress < 100 && (
                          <span className={textSecondaryClass}>
                            {((100 - progress) / 100 * goalAmount).toFixed(2)}% restante
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

            </div>
          )}

          {activeTab === "longTerm" && (
            <div className="space-y-6">
              {/* Botón para añadir objetivo */}
              {!showLongTermForm && (
                <button
                  onClick={() => setShowLongTermForm(true)}
                  className={`w-full py-3 rounded-xl border-2 border-dashed ${
                    darkMode
                      ? "border-gray-600 text-gray-400 hover:border-purple-500 hover:text-purple-400"
                      : "border-purple-300 text-purple-600 hover:border-purple-600"
                  } font-medium transition-all flex items-center justify-center gap-2`}
                >
                  <Plus className="w-5 h-5" />
                  Añadir Objetivo a Largo Plazo
                </button>
              )}

              {/* Formulario nuevo objetivo - Mejorado */}
              {showLongTermForm && (
                <div className={`p-4 sm:p-6 rounded-xl border-2 ${
                  darkMode 
                    ? "bg-gray-800/50 border-gray-700" 
                    : "bg-purple-50/80 border-purple-200"
                } shadow-lg`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-bold ${textClass}`}>
                      Nuevo Objetivo a Largo Plazo
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setShowLongTermForm(false);
                        setNewLongTermGoal({ name: "", targetAmount: "", targetDate: "", icon: "🎯", currentAmount: 0 });
                      }}
                      className={`p-1.5 rounded-lg ${
                        darkMode ? "hover:bg-gray-700" : "hover:bg-purple-100"
                      } transition-all`}
                    >
                      <X className={`w-5 h-5 ${textClass}`} />
                    </button>
                  </div>
                  
                  <form onSubmit={handleAddLongTermGoal} className="space-y-4">
                    {/* Icono */}
                    <div>
                      <label className={`block text-sm font-medium ${textClass} mb-2`}>
                        Icono (opcional)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newLongTermGoal.icon}
                          onChange={(e) => setNewLongTermGoal({ ...newLongTermGoal, icon: e.target.value || "🎯" })}
                          className={`w-20 px-3 py-2.5 rounded-lg border text-center text-2xl ${inputClass} focus:ring-2 focus:border-transparent`}
                          placeholder="🎯"
                          maxLength={2}
                        />
                        <div className="flex-1">
                          <p className={`text-xs ${textSecondaryClass}`}>
                            Escribe un emoji para personalizar tu objetivo
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Nombre */}
                    <div>
                      <label className={`block text-sm font-medium ${textClass} mb-2`}>
                        Nombre del objetivo <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newLongTermGoal.name}
                        onChange={(e) => setNewLongTermGoal({ ...newLongTermGoal, name: e.target.value })}
                        className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                        placeholder="Ej: Vacaciones en Grecia, Moto nueva, Casa propia..."
                        required
                        autoFocus
                      />
                    </div>

                    {/* Grid responsive para cantidad y fecha */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium ${textClass} mb-2`}>
                          Cantidad objetivo (€) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={newLongTermGoal.targetAmount}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "" || parseFloat(value) >= 0) {
                              setNewLongTermGoal({ ...newLongTermGoal, targetAmount: value });
                            }
                          }}
                          className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                          placeholder="5000"
                          required
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium ${textClass} mb-2`}>
                          Fecha límite <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={newLongTermGoal.targetDate}
                          onChange={(e) => setNewLongTermGoal({ ...newLongTermGoal, targetDate: e.target.value })}
                          className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                          min={new Date().toISOString().split("T")[0]}
                          required
                        />
                      </div>
                    </div>

                    {/* Cantidad actual */}
                    <div>
                      <label className={`block text-sm font-medium ${textClass} mb-2`}>
                        Cantidad actual (€) <span className={`text-xs ${textSecondaryClass}`}>(opcional)</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={newLongTermGoal.currentAmount}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "" || parseFloat(value) >= 0) {
                            setNewLongTermGoal({ ...newLongTermGoal, currentAmount: value });
                          }
                        }}
                        className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                        placeholder="0"
                      />
                      <p className={`text-xs mt-1 ${textSecondaryClass}`}>
                        Si ya has ahorrado algo, indícalo aquí
                      </p>
                    </div>

                    {/* Botones */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <button
                        type="submit"
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-lg transition-all active:scale-95"
                      >
                        Crear Objetivo
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowLongTermForm(false);
                          setNewLongTermGoal({ name: "", targetAmount: "", targetDate: "", icon: "🎯", currentAmount: 0 });
                        }}
                        className={`px-6 py-3 rounded-xl border-2 font-medium transition-all active:scale-95 ${
                          darkMode
                            ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                            : "border-gray-300 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Lista de objetivos a largo plazo */}
              {longTermGoals.length > 0 && (
                <div className="space-y-4">
                  {longTermGoals
                    .filter((goal) => goal && goal.status === "active")
                    .map((goal) => {
                      if (!goal || !goal.name) return null;
                      const progress = getLongTermGoalProgress(goal);
                      const isComplete = goal.currentAmount >= goal.targetAmount;

                      return (
                        <div
                          key={goal.id}
                          className={`p-5 rounded-xl border-2 transition-all ${
                            isComplete
                              ? darkMode
                                ? "bg-green-900/20 border-green-500/50"
                                : "bg-green-50 border-green-300"
                              : progress.progress >= 80
                              ? darkMode
                                ? "bg-yellow-900/20 border-yellow-500/50"
                                : "bg-yellow-50 border-yellow-300"
                              : darkMode
                              ? "bg-gray-800 border-gray-600"
                              : "bg-white border-purple-200"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3 flex-1">
                              <span className="text-3xl flex-shrink-0">{goal.icon || "🎯"}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className={`font-semibold text-lg ${textClass}`}>{goal.name || "Objetivo sin nombre"}</h4>
                                  {isComplete && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-500 text-white font-medium">
                                      ✓ Completado
                                    </span>
                                  )}
                                  {!isComplete && progress.progress >= 80 && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500 text-white font-medium">
                                      Casi listo
                                    </span>
                                  )}
                                </div>
                                <p className={`text-xs ${textSecondaryClass} flex items-center gap-1`}>
                                  <Calendar className="w-3 h-3" />
                                  {progress.daysRemaining !== null
                                    ? `${progress.daysRemaining} días restantes`
                                    : "Sin fecha límite"}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteLongTermGoal(goal.id)}
                              className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-all flex-shrink-0"
                              title="Eliminar objetivo"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>

                          <div className="space-y-4">
                            <div className="flex justify-between items-baseline">
                              <div>
                                <p className={`text-xs ${textSecondaryClass} mb-1`}>Ahorrado</p>
                                <p className={`text-2xl font-semibold ${
                                  isComplete
                                    ? "text-green-600"
                                    : progress.progress >= 80
                                    ? "text-yellow-600"
                                    : darkMode ? "text-purple-400" : "text-purple-600"
                                }`}>
                                  €{goal.currentAmount.toFixed(2)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className={`text-xs ${textSecondaryClass} mb-1`}>Objetivo</p>
                                <p className={`text-lg font-semibold ${textClass}`}>
                                  €{goal.targetAmount.toFixed(2)}
                                </p>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between items-center text-xs">
                                <span className={textSecondaryClass}>
                                  {isComplete
                                    ? "🎉 ¡Objetivo alcanzado!"
                                    : progress.progress >= 80
                                    ? "💪 ¡Casi lo logras!"
                                    : `Faltan €${progress.remaining.toFixed(2)}`}
                                </span>
                                <span className={`font-bold ${
                                  isComplete
                                    ? "text-green-600"
                                    : progress.progress >= 80
                                    ? "text-yellow-600"
                                    : darkMode ? "text-purple-400" : "text-purple-600"
                                }`}>
                                  {Math.min(progress.progress, 100).toFixed(1)}%
                                </span>
                              </div>
                              <div className={`h-4 rounded-full ${
                                darkMode ? "bg-gray-700" : "bg-purple-100"
                              } overflow-hidden shadow-inner`}>
                                <div
                                  className={`h-full transition-all duration-500 ${
                                    isComplete
                                      ? "bg-gradient-to-r from-green-500 to-green-600"
                                      : progress.progress >= 80
                                      ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                                      : "bg-gradient-to-r from-purple-600 to-blue-600"
                                  }`}
                                  style={{ width: `${Math.min(progress.progress, 100)}%` }}
                                ></div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                              <div>
                                <p className={`text-xs ${textSecondaryClass} mb-1`}>Cuota mensual</p>
                                <p className={`text-sm font-semibold ${textClass}`}>
                                  €{goal.monthlyContribution.toFixed(2)}
                                </p>
                              </div>
                              <div>
                                <p className={`text-xs ${textSecondaryClass} mb-1`}>Restante</p>
                                <p className={`text-sm font-semibold ${
                                  isComplete ? "text-green-600" : textClass
                                }`}>
                                  €{progress.remaining.toFixed(2)}
                                </p>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={goal.currentAmount}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === "" || parseFloat(value) >= 0) {
                                    handleUpdateLongTermGoalCurrentAmount(goal.id, value);
                                  }
                                }}
                                className={`flex-1 px-3 py-2 rounded-lg border text-sm ${inputClass} focus:ring-2 focus:border-transparent`}
                                placeholder="Actualizar cantidad"
                              />
                            </div>

                            {isComplete && (
                              <div className="mt-2 p-2 rounded-lg bg-green-500/20 border border-green-500/50">
                                <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                                  ✓ ¡Objetivo completado!
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {longTermGoals.filter((g) => g && g.status === "active").length === 0 && !showLongTermForm && (
                <div className={`text-center py-8 ${textSecondaryClass}`}>
                  <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No tienes objetivos a largo plazo aún</p>
                  <p className="text-xs mt-1">Crea tu primer objetivo para empezar a ahorrar</p>
                </div>
              )}
            </div>
          )}

          {/* Botón guardar */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSave}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-lg transition-all"
            >
              {t("common.save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalsModal;



