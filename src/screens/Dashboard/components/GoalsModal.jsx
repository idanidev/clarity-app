import { useState, useEffect } from "react";
import { Target, Trash2, X, Calendar, Plus } from "lucide-react";
import { useTranslation } from "../../../contexts/LanguageContext";
import { getLongTermGoalProgress } from "../../../services/goalsService";

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
  onRequestDelete,
  onClose,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("monthly"); // "monthly" | "longTerm"
  
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
    setLongTermGoals(goals?.longTermGoals || []);
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
    if (!newLongTermGoal.name || !newLongTermGoal.targetAmount || !newLongTermGoal.targetDate) return;

    const targetDate = new Date(newLongTermGoal.targetDate);
    const today = new Date();
    const monthsDiff = Math.max(1, Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24 * 30)));
    const monthlyContribution = parseFloat(newLongTermGoal.targetAmount) / monthsDiff;

    const newGoal = {
      id: `goal-${Date.now()}`,
      name: newLongTermGoal.name,
      targetAmount: parseFloat(newLongTermGoal.targetAmount),
      currentAmount: parseFloat(newLongTermGoal.currentAmount) || 0,
      startDate: today.toISOString().split("T")[0],
      targetDate: newLongTermGoal.targetDate,
      monthlyContribution: monthlyContribution,
      icon: newLongTermGoal.icon || "🎯",
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
      longTermGoals.map((goal) =>
        goal.id === goalId
          ? { ...goal, currentAmount: parseFloat(newAmount) || 0 }
          : goal
      )
    );
  };

  // Calcular ahorro actual
  const currentMonthExpenses = categoryTotals.reduce((sum, item) => sum + item.total, 0);
  const currentSavings = income > 0 ? income - currentMonthExpenses : 0;
  const savingsProgress = monthlySavingsGoal > 0 ? (currentSavings / monthlySavingsGoal) * 100 : 0;

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
                    value={monthlySavingsGoal}
                    onChange={(e) => setMonthlySavingsGoal(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border ${inputClass} focus:ring-2 focus:border-transparent`}
                    placeholder="0.00"
                  />
                  {monthlySavingsGoal > 0 && income > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className={`text-sm ${textClass}`}>
                          {t("goals.currentSavings")}: €{currentSavings.toFixed(2)}
                        </span>
                        <span className={`text-sm font-semibold ${textClass}`}>
                          {savingsProgress.toFixed(1)}%
                        </span>
                      </div>
                      <div className={`h-3 rounded-full ${
                        darkMode ? "bg-gray-800" : "bg-purple-100"
                      } overflow-hidden`}>
                        <div
                          className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all"
                          style={{ width: `${Math.min(savingsProgress, 100)}%` }}
                        ></div>
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
                  value={newGoalAmount}
                  onChange={(e) => setNewGoalAmount(e.target.value)}
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

                  return (
                    <div
                      key={category}
                      className={`p-3 rounded-lg border ${
                        darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-purple-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: categories[category]?.color || "#8B5CF6",
                            }}
                          ></span>
                          <span className={`font-medium ${textClass}`}>{category}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteCategoryGoal(category)}
                          className={`p-1 rounded ${
                            darkMode ? "hover:bg-gray-700" : "hover:bg-purple-100"
                          } transition-all`}
                        >
                          <Trash2 className={`w-4 h-4 ${textSecondaryClass}`} />
                        </button>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-sm ${textSecondaryClass}`}>
                          €{categoryTotal.toFixed(2)} / €{goalAmount.toFixed(2)}
                        </span>
                        <span className={`text-sm font-semibold ${
                          status === "exceeded"
                            ? "text-red-500"
                            : status === "warning"
                            ? "text-yellow-500"
                            : "text-green-500"
                        }`}>
                          {progress.toFixed(1)}%
                        </span>
                      </div>
                      <div className={`h-2 rounded-full ${
                        darkMode ? "bg-gray-700" : "bg-purple-100"
                      } overflow-hidden`}>
                        <div
                          className={`h-full transition-all ${
                            status === "exceeded"
                              ? "bg-red-500"
                              : status === "warning"
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        ></div>
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

              {/* Formulario nuevo objetivo */}
              {showLongTermForm && (
                <form onSubmit={handleAddLongTermGoal} className={`p-4 rounded-xl ${
                  darkMode ? "bg-gray-700" : "bg-purple-50"
                }`}>
                  <div className="space-y-3">
                    <div>
                      <label className={`block text-sm font-medium ${textClass} mb-1`}>
                        Nombre del objetivo
                      </label>
                      <input
                        type="text"
                        value={newLongTermGoal.name}
                        onChange={(e) => setNewLongTermGoal({ ...newLongTermGoal, name: e.target.value })}
                        className={`w-full px-4 py-2 rounded-lg border ${inputClass} focus:ring-2 focus:border-transparent`}
                        placeholder="Ej: Vacaciones en Grecia"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-sm font-medium ${textClass} mb-1`}>
                          Cantidad objetivo (€)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={newLongTermGoal.targetAmount}
                          onChange={(e) => setNewLongTermGoal({ ...newLongTermGoal, targetAmount: e.target.value })}
                          className={`w-full px-4 py-2 rounded-lg border ${inputClass} focus:ring-2 focus:border-transparent`}
                          placeholder="5000"
                          required
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium ${textClass} mb-1`}>
                          Fecha límite
                        </label>
                        <input
                          type="date"
                          value={newLongTermGoal.targetDate}
                          onChange={(e) => setNewLongTermGoal({ ...newLongTermGoal, targetDate: e.target.value })}
                          className={`w-full px-4 py-2 rounded-lg border ${inputClass} focus:ring-2 focus:border-transparent`}
                          min={new Date().toISOString().split("T")[0]}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${textClass} mb-1`}>
                        Cantidad actual (€) - Opcional
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={newLongTermGoal.currentAmount}
                        onChange={(e) => setNewLongTermGoal({ ...newLongTermGoal, currentAmount: e.target.value })}
                        className={`w-full px-4 py-2 rounded-lg border ${inputClass} focus:ring-2 focus:border-transparent`}
                        placeholder="0"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 py-2 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-all"
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowLongTermForm(false);
                          setNewLongTermGoal({ name: "", targetAmount: "", targetDate: "", icon: "🎯", currentAmount: 0 });
                        }}
                        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Lista de objetivos a largo plazo */}
              {longTermGoals.length > 0 && (
                <div className="space-y-4">
                  {longTermGoals
                    .filter((goal) => goal.status === "active")
                    .map((goal) => {
                      const progress = getLongTermGoalProgress(goal);
                      const isComplete = goal.currentAmount >= goal.targetAmount;

                      return (
                        <div
                          key={goal.id}
                          className={`p-4 rounded-xl border ${
                            darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-purple-200"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">{goal.icon}</span>
                              <div>
                                <h4 className={`font-semibold ${textClass}`}>{goal.name}</h4>
                                <p className={`text-xs ${textSecondaryClass}`}>
                                  <Calendar className="w-3 h-3 inline mr-1" />
                                  {progress.daysRemaining !== null
                                    ? `${progress.daysRemaining} días restantes`
                                    : "Sin fecha límite"}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteLongTermGoal(goal.id)}
                              className={`p-1 rounded ${
                                darkMode ? "hover:bg-gray-700" : "hover:bg-purple-100"
                              } transition-all`}
                            >
                              <Trash2 className={`w-4 h-4 ${textSecondaryClass}`} />
                            </button>
                          </div>

                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className={`text-sm ${textSecondaryClass}`}>
                                €{goal.currentAmount.toFixed(2)} / €{goal.targetAmount.toFixed(2)}
                              </span>
                              <span className={`text-sm font-semibold ${
                                isComplete ? "text-green-500" : progress.progress >= 80 ? "text-yellow-500" : "text-purple-600"
                              }`}>
                                {progress.progress.toFixed(1)}%
                              </span>
                            </div>

                            <div className={`h-2 rounded-full ${
                              darkMode ? "bg-gray-700" : "bg-purple-100"
                            } overflow-hidden`}>
                              <div
                                className={`h-full transition-all ${
                                  isComplete
                                    ? "bg-green-500"
                                    : progress.progress >= 80
                                    ? "bg-yellow-500"
                                    : "bg-purple-600"
                                }`}
                                style={{ width: `${Math.min(progress.progress, 100)}%` }}
                              ></div>
                            </div>

                            <div className="flex justify-between items-center text-xs">
                              <span className={textSecondaryClass}>
                                Cuota mensual: €{goal.monthlyContribution.toFixed(2)}
                              </span>
                              <span className={textSecondaryClass}>
                                Restante: €{progress.remaining.toFixed(2)}
                              </span>
                            </div>

                            <div className="flex gap-2">
                              <input
                                type="number"
                                step="0.01"
                                value={goal.currentAmount}
                                onChange={(e) => handleUpdateLongTermGoalCurrentAmount(goal.id, e.target.value)}
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

              {longTermGoals.filter((g) => g.status === "active").length === 0 && !showLongTermForm && (
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



