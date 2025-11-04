import {
  AlertTriangle,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Clock,
  Filter,
  Pencil,
  Plus,
  Table as TableIcon,
  Target,
  Trash2,
} from "lucide-react";

const MainContent = ({
  cardClass,
  textClass,
  textSecondaryClass,
  inputClass,
  darkMode,
  totalExpenses,
  filteredExpenses,
  showFilters,
  onToggleFilters,
  selectedMonth,
  onMonthChange,
  selectedCategory,
  onCategoryChange,
  categories,
  activeView,
  onChangeView,
  expensesByCategory,
  expandedCategories,
  onToggleCategory,
  onAddExpenseClick,
  onEditExpense,
  onRequestDelete,
  categoryTotals,
  budgets,
  recentExpenses,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className={`${cardClass} rounded-2xl p-4 border shadow-lg`}>
          <div className="flex flex-col items-center text-center">
            <Target className={`w-5 h-5 mb-2 ${textSecondaryClass}`} />
            <span className={`text-xl font-bold mb-1 ${textSecondaryClass}`}>
              Total
            </span>
            <p className={`text-xl md:text-2xl font-bold ${textClass}`}>
              €{totalExpenses.toFixed(2)}
            </p>
          </div>
        </div>

        <div className={`${cardClass} rounded-2xl p-4 border shadow-lg`}>
          <div className="flex flex-col items-center text-center">
            <BarChart3 className={`w-5 h-5 mb-2 ${textSecondaryClass}`} />
            <span className={`text-xs font-medium mb-1 ${textSecondaryClass}`}>
              Gastos
            </span>
            <p className={`text-xl md:text-2xl font-bold ${textClass}`}>
              {filteredExpenses.length}
            </p>
          </div>
        </div>

        <div className={`${cardClass} rounded-2xl p-4 border shadow-lg`}>
          <div className="flex flex-col items-center text-center">
            <Clock className={`w-5 h-5 mb-2 ${textSecondaryClass}`} />
            <span className={`text-xs font-medium mb-1 ${textSecondaryClass}`}>
              Promedio
            </span>
            <p className={`text-xl md:text-2xl font-bold ${textClass}`}>
              €
              {filteredExpenses.length > 0
                ? (totalExpenses / new Date().getDate()).toFixed(2)
                : "0"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={onAddExpenseClick}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-lg transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Añadir Gasto</span>
        </button>

        <button
          onClick={onToggleFilters}
          className={`p-3 rounded-xl ${
            darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-white hover:bg-gray-50"
          } border ${
            darkMode ? "border-gray-600" : "border-purple-200"
          } ${textClass} font-semibold transition-all active:scale-95`}
        >
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {showFilters && (
        <div className={`${cardClass} rounded-2xl p-4 border shadow-lg mb-4`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs font-medium ${textClass} mb-1`}>
                Mes
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => onMonthChange(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border ${inputClass} text-sm focus:ring-2 focus:border-transparent`}
              />
            </div>

            <div>
              <label className={`block text-xs font-medium ${textClass} mb-1`}>
                Categoría
              </label>
              <select
                value={selectedCategory}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onChange={(e) => onCategoryChange(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border ${inputClass} text-sm focus:ring-2 focus:border-transparent`}
              >
                <option value="all">Todas</option>
                {Object.keys(categories).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => onChangeView("table")}
          className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
            activeView === "table"
              ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
              : darkMode
              ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
              : "bg-white text-purple-600 hover:bg-purple-50"
          }`}
        >
          <TableIcon className="w-5 h-5" />
          <span className="text-sm hidden sm:inline">Tabla</span>
        </button>

        <button
          onClick={() => onChangeView("chart")}
          className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
            activeView === "chart"
              ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
              : darkMode
              ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
              : "bg-white text-purple-600 hover:bg-purple-50"
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-sm hidden sm:inline">Gráfica</span>
        </button>

        <button
          onClick={() => onChangeView("recent")}
          className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
            activeView === "recent"
              ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
              : darkMode
              ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
              : "bg-white text-purple-600 hover:bg-purple-50"
          }`}
        >
          <Clock className="w-5 h-5" />
          <span className="text-sm hidden sm:inline">Recientes</span>
        </button>

        <button
          onClick={() => onChangeView("budgets")}
          className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
            activeView === "budgets"
              ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
              : darkMode
              ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
              : "bg-white text-purple-600 hover:bg-purple-50"
          }`}
        >
          <Target className="w-5 h-5" />
          <span className="text-sm hidden sm:inline">Presupuestos</span>
        </button>
      </div>

      {activeView === "table" && (
        <div className={`${cardClass} rounded-2xl border shadow-lg overflow-hidden`}>
          {Object.keys(expensesByCategory).length === 0 ? (
            <div className="p-12 text-center">
              <AlertTriangle
                className={`w-16 h-16 ${textSecondaryClass} mx-auto mb-4`}
              />
              <p className={`text-xl font-semibold ${textClass} mb-2`}>
                No hay gastos
              </p>
              <p className={textSecondaryClass}>
                Añade tu primer gasto para comenzar
              </p>
            </div>
          ) : (
            <div className="divide-y divide-purple-100">
              {Object.entries(expensesByCategory).map(
                ([category, subcategories]) => {
                  const categoryTotal = Object.values(subcategories)
                    .flat()
                    .reduce((sum, exp) => sum + exp.amount, 0);
                  const isExpanded = expandedCategories[category];

                  return (
                    <div key={category}>
                      <button
                        onClick={() => onToggleCategory(category)}
                        className={`w-full ${
                          darkMode
                            ? "bg-gray-700/50 hover:bg-gray-700"
                            : "bg-purple-100/80 hover:bg-purple-100"
                        } px-6 py-4 flex justify-between items-center transition-all`}
                      >
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronUp className={`w-5 h-5 ${textSecondaryClass}`} />
                          ) : (
                            <ChevronDown
                              className={`w-5 h-5 ${textSecondaryClass}`}
                            />
                          )}
                          <div>
                            <p className={`font-semibold ${textClass}`}>{category}</p>
                            <p className={`text-sm ${textSecondaryClass}`}>
                              €{categoryTotal.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              darkMode
                                ? "bg-gray-800 text-gray-300"
                                : "bg-white text-purple-600"
                            }`}
                          >
                            {Object.values(subcategories).flat().length} gastos
                          </span>
                        </div>
                      </button>

                      {isExpanded && (
                        <div
                          className={`px-4 py-4 space-y-4 ${
                            darkMode ? "bg-gray-800" : "bg-white"
                          }`}
                        >
                          {Object.entries(subcategories).map(
                            ([subcategory, exps]) => (
                              <div key={subcategory} className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className={`font-semibold ${textClass}`}>
                                    {subcategory}
                                  </h4>
                                  <span
                                    className={`text-sm ${textSecondaryClass}`}
                                  >
                                    €
                                    {exps
                                      .reduce((sum, exp) => sum + exp.amount, 0)
                                      .toFixed(2)}
                                  </span>
                                </div>
                                <div className="divide-y divide-purple-100">
                                  {exps.map((expense) => (
                                    <div
                                      key={expense.id}
                                      className={`px-4 py-3 ${
                                        darkMode
                                          ? "hover:bg-gray-700/30"
                                          : "hover:bg-white/30"
                                      } transition-all flex justify-between items-center`}
                                    >
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <p className={`text-sm font-semibold ${textClass}`}>
                                            {expense.name || "Gasto sin nombre"}
                                          </p>
                                          {expense.isRecurring && (
                                            <span
                                              className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${
                                                darkMode
                                                  ? "bg-blue-900/50 text-blue-400"
                                                  : "bg-blue-100 text-blue-700"
                                              }`}
                                            >
                                              <Clock className="w-3 h-3" />
                                              Recurrente
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2 mb-1">
                                          <span
                                            className={`text-sm ${textSecondaryClass}`}
                                          >
                                            {new Date(
                                              expense.date
                                            ).toLocaleDateString("es-ES")}
                                          </span>
                                          <span
                                            className={`text-xs ${
                                              darkMode
                                                ? "bg-gray-700"
                                                : "bg-white/60"
                                            } px-2 py-1 rounded-full ${textSecondaryClass}`}
                                          >
                                            {expense.paymentMethod}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <span className={`font-bold ${textClass}`}>
                                          €{expense.amount.toFixed(2)}
                                        </span>
                                        <button
                                          onClick={() => onEditExpense(expense)}
                                          className={`p-2 rounded-lg ${
                                            darkMode
                                              ? "hover:bg-purple-900/50"
                                              : "hover:bg-purple-100"
                                          } transition-all`}
                                        >
                                          <Pencil
                                            className={`w-4 h-4 ${
                                              darkMode
                                                ? "text-purple-400"
                                                : "text-purple-600"
                                            }`}
                                          />
                                        </button>
                                        <button
                                          onClick={() =>
                                            onRequestDelete({
                                              type: "expense",
                                              id: expense.id,
                                            })
                                          }
                                          className={`p-2 rounded-lg ${
                                            darkMode
                                              ? "hover:bg-red-900/50"
                                              : "hover:bg-red-100"
                                          } transition-all`}
                                        >
                                          <Trash2 className="w-4 h-4 text-red-600" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      )}

      {activeView === "chart" && (
        <div className={`${cardClass} rounded-2xl p-6 border shadow-lg`}>
          <h3 className={`text-xl font-bold ${textClass} mb-6`}>
            Distribución por Categoría
          </h3>

          {categoryTotals.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle
                className={`w-16 h-16 ${textSecondaryClass} mx-auto mb-4`}
              />
              <p className={textSecondaryClass}>
                No hay gastos en este período
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-center mb-6">
                <div className="relative w-64 h-64">
                  <svg viewBox="0 0 100 100" className="transform -rotate-90">
                    {(() => {
                      let currentAngle = 0;
                      const colors = [
                        "text-purple-500",
                        "text-blue-500",
                        "text-pink-500",
                        "text-indigo-500",
                        "text-violet-500",
                        "text-fuchsia-500",
                      ];

                      return categoryTotals
                        .sort((a, b) => b.total - a.total)
                        .map((item, index) => {
                          const percentage =
                            (item.total / totalExpenses) * 100;
                          const angle = (percentage / 100) * 360;
                          const startAngle = currentAngle;
                          currentAngle += angle;

                          const startX =
                            50 + 45 * Math.cos((startAngle * Math.PI) / 180);
                          const startY =
                            50 + 45 * Math.sin((startAngle * Math.PI) / 180);
                          const endX =
                            50 + 45 * Math.cos((currentAngle * Math.PI) / 180);
                          const endY =
                            50 + 45 * Math.sin((currentAngle * Math.PI) / 180);
                          const largeArc = angle > 180 ? 1 : 0;

                          return (
                            <path
                              key={item.category}
                              d={`M 50 50 L ${startX} ${startY} A 45 45 0 ${largeArc} 1 ${endX} ${endY} Z`}
                              className={`fill-current ${
                                colors[index % colors.length]
                              } opacity-90 hover:opacity-100 transition-all cursor-pointer`}
                              strokeWidth="0.5"
                              stroke="white"
                            />
                          );
                        });
                    })()}

                    <circle
                      cx="50"
                      cy="50"
                      r="32"
                      fill="white"
                      className="transform rotate-90"
                    />
                  </svg>

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p
                        className={`text-3xl font-bold ${
                          darkMode ? "text-gray-900" : "text-purple-900"
                        }`}
                      >
                        {totalExpenses.toFixed(0)}€
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {Object.entries(expensesByCategory)
                  .sort(([, subsA], [, subsB]) => {
                    const totalA = Object.values(subsA)
                      .flat()
                      .reduce((sum, exp) => sum + exp.amount, 0);
                    const totalB = Object.values(subsB)
                      .flat()
                      .reduce((sum, exp) => sum + exp.amount, 0);
                    return totalB - totalA;
                  })
                  .map(([category, subcategories], index) => {
                    const categoryTotal = Object.values(subcategories)
                      .flat()
                      .reduce((sum, exp) => sum + exp.amount, 0);
                    const percentage = (categoryTotal / totalExpenses) * 100;
                    const isExpanded = expandedCategories[category];

                    const colors = [
                      "from-purple-500 to-purple-600",
                      "from-blue-500 to-blue-600",
                      "from-pink-500 to-pink-600",
                      "from-indigo-500 to-indigo-600",
                      "from-violet-500 to-violet-600",
                      "from-fuchsia-500 to-fuchsia-600",
                    ];

                    const dotColors = [
                      "bg-purple-500",
                      "bg-blue-500",
                      "bg-pink-500",
                      "bg-indigo-500",
                      "bg-violet-500",
                      "bg-fuchsia-500",
                    ];

                    return (
                      <div
                        key={category}
                        className={`${
                          darkMode ? "bg-gray-700/30" : "bg-white/50"
                        } rounded-2xl border ${
                          darkMode ? "border-gray-600" : "border-purple-100"
                        } p-4 sm:p-5 transition-all`}
                      >
                        <button
                          onClick={() => onToggleCategory(category)}
                          className="w-full flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3 sm:gap-4">
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${
                                dotColors[index % dotColors.length]
                              }`}
                            ></span>
                            <div className="text-left">
                              <p className={`font-semibold ${textClass}`}>
                                {category}
                              </p>
                              <p
                                className={`text-sm ${textSecondaryClass} opacity-80`}
                              >
                                {percentage.toFixed(1)}% del total
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`font-semibold ${textClass}`}>
                              €{categoryTotal.toFixed(2)}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className={`w-5 h-5 ${textSecondaryClass}`} />
                            ) : (
                              <ChevronDown
                                className={`w-5 h-5 ${textSecondaryClass}`}
                              />
                            )}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="mt-3 space-y-2 pl-5">
                            {Object.entries(subcategories)
                              .sort(([, expsA], [, expsB]) => {
                                const totalA = expsA
                                  .reduce((sum, exp) => sum + exp.amount, 0);
                                const totalB = expsB
                                  .reduce((sum, exp) => sum + exp.amount, 0);
                                return totalB - totalA;
                              })
                              .map(([subcategory, exps]) => {
                                const spent = exps
                                  .reduce((sum, exp) => sum + exp.amount, 0);
                                const subPercentage = (spent / totalExpenses) * 100;

                                return (
                                  <div
                                    key={subcategory}
                                    className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-3"
                                  >
                                    <div className="flex justify-between items-center mb-2">
                                      <p className={`font-medium ${textClass}`}>
                                        {subcategory}
                                      </p>
                                      <span
                                        className={`text-sm ${textSecondaryClass}`}
                                      >
                                        €{spent.toFixed(2)}
                                      </span>
                                    </div>
                                    <div className="h-2 rounded-full bg-purple-100 dark:bg-gray-700 overflow-hidden">
                                      <div
                                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                                        style={{ width: `${Math.min(subPercentage, 100)}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {activeView === "budgets" && (
        <div className={`${cardClass} rounded-2xl p-4 sm:p-6 border shadow-lg`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
            <div>
              <h3 className={`text-lg sm:text-xl font-bold ${textClass}`}>
                Presupuestos Actuales
              </h3>
              <p className={`text-sm ${textSecondaryClass}`}>
                Controla tus gastos por categoría
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className={textSecondaryClass}>Dentro del límite</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                <span className={textSecondaryClass}>Cerca del límite</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span className={textSecondaryClass}>Superado</span>
              </div>
            </div>
          </div>

          {Object.keys(budgets).length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle
                className={`w-16 h-16 ${textSecondaryClass} mx-auto mb-4`}
              />
              <p className={`text-xl font-semibold ${textClass} mb-2`}>
                No tienes presupuestos configurados
              </p>
              <p className={textSecondaryClass}>
                Crea un presupuesto para comenzar a controlar tus gastos
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(budgets).map(([category, budget]) => {
                const totalSpent =
                  categoryTotals.find((item) => item.category === category)?.total || 0;
                const percentage = Math.min((totalSpent / budget) * 100, 100);
                const status =
                  totalSpent > budget
                    ? "over"
                    : totalSpent > budget * 0.8
                    ? "warning"
                    : "ok";

                const statusColors = {
                  over: "bg-red-500",
                  warning: "bg-yellow-500",
                  ok: "bg-green-500",
                };

                return (
                  <div
                    key={category}
                    className={`p-4 sm:p-5 rounded-2xl border ${
                      darkMode ? "border-gray-700 bg-gray-800" : "border-purple-100 bg-white"
                    } shadow-sm`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                      <div>
                        <p className={`text-lg font-semibold ${textClass}`}>
                          {category}
                        </p>
                        <p className={`text-sm ${textSecondaryClass}`}>
                          Presupuesto: €{budget.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-bold ${textClass}`}>
                          €{totalSpent.toFixed(2)} gastados
                        </span>
                        <button
                          onClick={() =>
                            onRequestDelete({ type: "budget", category })
                          }
                          className={`p-2 rounded-lg ${
                            darkMode
                              ? "hover:bg-red-900/50"
                              : "hover:bg-red-100"
                          } transition-all`}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>

                    <div className="h-2.5 rounded-full bg-purple-100 dark:bg-gray-700 overflow-hidden">
                      <div
                        className={`h-full ${statusColors[status]}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>

                    {status === "over" && (
                      <p className="mt-2 text-sm text-red-500 font-medium">
                        Has superado tu presupuesto por €{(totalSpent - budget).toFixed(2)}!
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeView === "recent" && (
        <div className={`${cardClass} rounded-2xl p-4 sm:p-6 border shadow-lg`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg sm:text-xl font-bold ${textClass}`}>
              Últimos Gastos Añadidos
            </h3>
            <span className={`text-sm ${textSecondaryClass}`}>
              ({recentExpenses.length})
            </span>
          </div>

          {recentExpenses.length === 0 ? (
            <div className="text-center py-12">
              <Clock className={`w-16 h-16 ${textSecondaryClass} mx-auto mb-4`} />
              <p className={`text-xl font-semibold ${textClass} mb-2`}>
                No hay gastos todavía
              </p>
              <p className={textSecondaryClass}>
                Añade tu primer gasto para comenzar
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className={`p-3 sm:p-4 rounded-xl ${
                    darkMode ? "bg-gray-700" : "bg-white"
                  } border ${
                    darkMode ? "border-gray-600" : "border-purple-100"
                  } hover:shadow-md transition-all`}
                >
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className={`font-semibold ${textClass} truncate`}>
                          {expense.name}
                        </p>
                        {expense.isRecurring && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 flex-shrink-0 ${
                              darkMode
                                ? "bg-blue-900/50 text-blue-400"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            <span className="hidden sm:inline">Recurrente</span>
                          </span>
                        )}
                      </div>
                      <p className={`text-xs sm:text-sm ${textSecondaryClass} truncate`}>
                        {expense.category} • {expense.subcategory}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`font-bold ${textClass} text-sm sm:text-base`}>
                        €{expense.amount.toFixed(2)}
                      </span>
                      <button
                        onClick={() => onEditExpense(expense)}
                        className={`p-1.5 sm:p-2 rounded-lg ${
                          darkMode
                            ? "hover:bg-purple-900/50"
                            : "hover:bg-purple-100"
                        } transition-all`}
                      >
                        <Pencil
                          className={`w-3 h-3 sm:w-4 sm:h-4 ${
                            darkMode ? "text-purple-400" : "text-purple-600"
                          }`}
                        />
                      </button>
                      <button
                        onClick={() =>
                          onRequestDelete({ type: "expense", id: expense.id })
                        }
                        className={`p-1.5 sm:p-2 rounded-lg ${
                          darkMode
                            ? "hover:bg-red-900/50"
                            : "hover:bg-red-100"
                        } transition-all`}
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    <span className={textSecondaryClass}>
                      {new Date(expense.date).toLocaleDateString("es-ES")}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full ${
                        darkMode ? "bg-gray-600" : "bg-purple-100"
                      } ${textSecondaryClass}`}
                    >
                      {expense.paymentMethod}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MainContent;
