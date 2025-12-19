// src/components/LongTermGoalsSection.jsx
import { Target, Calendar, TrendingUp } from "lucide-react";
import { getLongTermGoalProgress } from "../services/goalsService";

const LongTermGoalsSection = ({ goals, darkMode, onUpdateAmount }) => {
  if (!goals?.longTermGoals || goals.longTermGoals.filter((g) => g.status === "active").length === 0) {
    return null;
  }

  const textClass = darkMode ? "text-gray-100" : "text-gray-900";
  const textSecondaryClass = darkMode ? "text-gray-400" : "text-gray-600";
  const cardClass = darkMode ? "bg-gray-800" : "bg-white";
  const borderClass = darkMode ? "border-gray-700" : "border-purple-200";

  const activeGoals = goals.longTermGoals.filter((g) => g && g.status === "active");

  return (
    <div className="space-y-4 mb-6">
      {activeGoals.map((goal) => {
        if (!goal || !goal.name) return null;
        const progress = getLongTermGoalProgress(goal);
        const isComplete = (goal.currentAmount || 0) >= (goal.targetAmount || 0);

        return (
          <div
            key={goal.id}
            className={`p-4 rounded-2xl border ${cardClass} ${borderClass} shadow-sm`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{goal.icon || "🎯"}</span>
                <div>
                  <h4 className={`font-semibold ${textClass}`}>{goal.name || "Objetivo sin nombre"}</h4>
                  {progress.daysRemaining !== null && (
                    <p className={`text-xs flex items-center gap-1 ${textSecondaryClass}`}>
                      <Calendar className="w-3 h-3" />
                      {progress.daysRemaining} días restantes
                    </p>
                  )}
                </div>
              </div>
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

              <div className={`h-2.5 rounded-full ${
                darkMode ? "bg-gray-700" : "bg-purple-100"
              } overflow-hidden`}>
                <div
                  className={`h-full transition-all ${
                    isComplete
                      ? "bg-green-500"
                      : progress.progress >= 80
                      ? "bg-yellow-500"
                      : "bg-gradient-to-r from-purple-600 to-blue-600"
                  }`}
                  style={{ width: `${Math.min(progress.progress, 100)}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className={textSecondaryClass}>Mensual</p>
                  <p className={`font-semibold ${textClass}`}>€{goal.monthlyContribution.toFixed(2)}</p>
                </div>
                <div>
                  <p className={textSecondaryClass}>Restante</p>
                  <p className={`font-semibold ${textClass}`}>€{progress.remaining.toFixed(2)}</p>
                </div>
                <div>
                  <p className={textSecondaryClass}>Estado</p>
                  <p className={`font-semibold ${
                    progress.isOnTrack ? "text-green-500" : "text-orange-500"
                  }`}>
                    {progress.isOnTrack ? "✓ En camino" : "⚠️ Ajustar"}
                  </p>
                </div>
              </div>

              {onUpdateAmount && (
                <div className="flex gap-2 mt-2">
                  <input
                    type="number"
                    step="0.01"
                    value={goal.currentAmount}
                    onChange={(e) => onUpdateAmount(goal.id, parseFloat(e.target.value) || 0)}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                      darkMode
                        ? "bg-gray-700 border-gray-600 text-gray-100"
                        : "bg-white border-purple-200 text-purple-900"
                    } focus:ring-2 focus:border-transparent`}
                    placeholder="Actualizar cantidad"
                  />
                </div>
              )}

              {isComplete && (
                <div className="mt-2 p-2 rounded-lg bg-green-500/20 border border-green-500/50 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
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
  );
};

export default LongTermGoalsSection;


