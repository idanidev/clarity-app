import { Trophy, TrendingUp, Flame } from "lucide-react";

const AchievementsSection = ({ achievements, streakMonths, monthlyComparison, darkMode }) => {
  if (!achievements || !achievements.badges || achievements.badges.length === 0) {
    return null;
  }

  const textClass = darkMode ? "text-gray-100" : "text-gray-900";
  const textSecondaryClass = darkMode ? "text-gray-400" : "text-gray-600";
  const cardClass = darkMode ? "bg-gray-800" : "bg-white";
  const borderClass = darkMode ? "border-gray-700" : "border-purple-200";

  return (
    <div className={`p-4 rounded-2xl border ${cardClass} ${borderClass} shadow-sm mb-6`}>
      <div className="flex items-center gap-3 mb-4">
        <Trophy className={`w-5 h-5 ${darkMode ? "text-yellow-400" : "text-yellow-500"}`} />
        <h3 className={`text-lg font-bold ${textClass}`}>Logros y Progreso</h3>
      </div>

      {/* Racha */}
      {streakMonths > 0 && (
        <div className={`mb-4 p-3 rounded-xl ${
          darkMode ? "bg-gray-700/50" : "bg-purple-50/50"
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <Flame className={`w-4 h-4 ${darkMode ? "text-orange-400" : "text-orange-500"}`} />
            <span className={`text-sm font-semibold ${textClass}`}>
              Racha: {streakMonths} {streakMonths === 1 ? "mes" : "meses"} cumpliendo objetivos
            </span>
          </div>
        </div>
      )}

      {/* Comparación con mes anterior */}
      {monthlyComparison && (
        <div className={`mb-4 p-3 rounded-xl ${
          darkMode ? "bg-gray-700/50" : "bg-purple-50/50"
        }`}>
          <div className="flex items-center gap-2">
            <TrendingUp className={`w-4 h-4 ${
              monthlyComparison.isBetter ? "text-green-500" : "text-gray-400"
            }`} />
            <div className="flex-1">
              <span className={`text-sm ${textSecondaryClass}`}>
                {monthlyComparison.isBetter ? "✓ Mejor que el mes anterior" : "Comparado con el mes anterior"}
              </span>
              <p className={`text-xs font-semibold ${
                monthlyComparison.isBetter ? "text-green-500" : textSecondaryClass
              }`}>
                {monthlyComparison.isBetter ? "+" : ""}€{Math.abs(monthlyComparison.difference).toFixed(2)} (
                {monthlyComparison.isBetter ? "+" : ""}
                {Math.abs(monthlyComparison.percentage).toFixed(1)}%)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {achievements.badges.slice(0, 6).map((badge) => (
          <div
            key={badge.id || badge}
            className={`p-2 rounded-lg border ${
              darkMode ? "bg-gray-700/50 border-gray-600" : "bg-purple-50/50 border-purple-200"
            } text-center`}
          >
            <div className="text-2xl mb-1">
              {badge.icon || badge.name?.split(" ")[0] || "🎯"}
            </div>
            <p className={`text-xs font-medium ${textClass} line-clamp-2`}>
              {badge.name?.replace(/[🎯⭐🔥💎💰🐦🚀]/g, "").trim() || badge}
            </p>
          </div>
        ))}
      </div>

      {achievements.badges.length > 6 && (
        <p className={`text-xs text-center mt-2 ${textSecondaryClass}`}>
          +{achievements.badges.length - 6} logros más
        </p>
      )}
    </div>
  );
};

export default AchievementsSection;




