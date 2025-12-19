import React, { useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { AlertTriangle, ChevronDown, ChevronUp, X } from "@/components/icons";
import { formatCurrency } from "../../../utils/currency";
// @ts-ignore
import { getCategoryColor } from "../../../services/firestoreService";
import { Expense } from "../../../types";

interface Category {
    subcategories?: string[];
    color?: string;
    [key: string]: any;
}

interface CategoryTotal {
    category: string;
    total: number;
}

interface ExpensesChartProps {
    categoryTotals: CategoryTotal[];
    categories: { [key: string]: Category };
    totalExpenses: number;
    darkMode: boolean;
    textClass: string;
    textSecondaryClass: string;
    expandedCategories: Record<string, boolean>;
    onToggleCategory: (category: string) => void;
    expensesByCategory: { [category: string]: { [subcategory: string]: Expense[] } };
    filteredExpenses: Expense[];
    filterPeriodType: string;
    selectedMonth: string;
}

const ExpensesChart: React.FC<ExpensesChartProps> = React.memo(({
    categoryTotals,
    categories,
    totalExpenses,
    darkMode,
    textClass,
    textSecondaryClass,
    expandedCategories,
    onToggleCategory,
    expensesByCategory,
    filteredExpenses,
    filterPeriodType,
    selectedMonth,
}) => {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [clickedCategory, setClickedCategory] = useState<any>(null);

    const cardClass = darkMode ? "bg-gray-800/50" : "bg-white/70 backdrop-blur-md";

    if (categoryTotals.length === 0) {
        return (
            <div className={`${cardClass} rounded-2xl p-3 md:p-6 border shadow-lg`}>
                <div className="text-center py-8 md:py-12">
                    <AlertTriangle
                        className={`w-12 md:w-16 h-12 md:h-16 ${textSecondaryClass} mx-auto mb-3 md:mb-4`}
                    />
                    <p className={`text-sm md:text-base ${textSecondaryClass}`}>
                        No hay gastos en este período
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={`${cardClass} rounded-2xl p-3 md:p-6 border shadow-lg space-y-6 md:space-y-8`}>
            <div className="space-y-3 md:space-y-6">
                <div className="relative">
                    <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                            <defs>
                                {categoryTotals.map((_item, index) => (
                                    <filter
                                        key={`shadow-${index}`}
                                        id={`shadow-${index}`}
                                        x="-50%"
                                        y="-50%"
                                        width="200%"
                                        height="200%"
                                    >
                                        <feDropShadow
                                            dx="0"
                                            dy="2"
                                            stdDeviation="3"
                                            floodOpacity="0.2"
                                        />
                                    </filter>
                                ))}
                            </defs>
                            <Pie
                                data={categoryTotals
                                    .sort((a, b) => b.total - a.total)
                                    .map((item, index) => {
                                        const categoryData = categories[item.category];
                                        const color = getCategoryColor(categoryData);
                                        return {
                                            name: item.category,
                                            value: item.total,
                                            percentage: ((item.total / totalExpenses) * 100).toFixed(1),
                                            color: color,
                                            index,
                                        };
                                    })}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={false}
                                outerRadius={140}
                                innerRadius={80}
                                paddingAngle={3}
                                dataKey="value"
                                animationBegin={0}
                                animationDuration={800}
                                animationEasing="ease-out"
                                onClick={(data, index) => {
                                    if (activeIndex === index) {
                                        setActiveIndex(null);
                                        setClickedCategory(null);
                                    } else {
                                        setActiveIndex(index);
                                        setClickedCategory(data);
                                    }
                                }}
                            >
                                {categoryTotals.map((item, index) => {
                                    const categoryData = categories[item.category];
                                    const color = getCategoryColor(categoryData);
                                    return (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={color}
                                            stroke={
                                                activeIndex === index
                                                    ? darkMode ? "#ffffff" : "#000000"
                                                    : darkMode ? "#1f2937" : "#ffffff"
                                            }
                                            strokeWidth={activeIndex === index ? 5 : 3}
                                            filter={
                                                activeIndex === index
                                                    ? `url(#shadow-${index})`
                                                    : undefined
                                            }
                                            style={{
                                                cursor: "pointer",
                                                transition: "all 0.3s ease",
                                            }}
                                        />
                                    );
                                })}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>

                    {/* Total en el centro */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center">
                            <p className={`text-xs ${textSecondaryClass} mb-1`}>Total</p>
                            <p className={`text-3xl font-bold ${textClass} leading-tight`}>
                                {formatCurrency(totalExpenses)}
                            </p>
                        </div>
                    </div>

                    {/* Tooltip personalizado */}
                    {clickedCategory && (
                        <div
                            className="absolute z-50"
                            style={{
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                                marginTop: "-60px",
                            }}
                        >
                            <div
                                className={`p-4 rounded-xl border shadow-2xl ${darkMode
                                    ? "bg-gray-800 border-gray-700"
                                    : "bg-white border-purple-200"
                                    }`}
                                style={{
                                    boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
                                    minWidth: "180px",
                                }}
                            >
                                <p className={`text-lg font-bold mb-3 ${darkMode ? "text-white" : "text-purple-900"}`}>
                                    {clickedCategory.name}
                                </p>
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-5 h-5 rounded-full flex-shrink-0 border-2"
                                        style={{
                                            backgroundColor: clickedCategory.color,
                                            borderColor: darkMode ? "#ffffff" : "#000000",
                                        }}
                                    />
                                    <div className="flex items-baseline gap-2">
                                        <p className={`text-xl font-bold ${darkMode ? "text-white" : "text-purple-900"}`}>
                                            {clickedCategory.value ? formatCurrency(clickedCategory.value) : "€0.00"}
                                        </p>
                                        <p className={`text-sm ${darkMode ? "text-gray-200" : "text-gray-600"}`}>
                                            ({clickedCategory.percentage}%)
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveIndex(null);
                                        setClickedCategory(null);
                                    }}
                                    className={`absolute top-2 right-2 p-1 rounded-full ${darkMode
                                        ? "hover:bg-gray-700 text-gray-200"
                                        : "hover:bg-purple-100 text-gray-600"
                                        } transition-all`}
                                    aria-label="Cerrar"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Leyenda personalizada */}
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
                    {categoryTotals
                        .sort((a, b) => b.total - a.total)
                        .map((item, index) => {
                            const categoryData = categories[item.category];
                            const color = getCategoryColor(categoryData);
                            const percentage = ((item.total / totalExpenses) * 100).toFixed(1);
                            return (
                                <div
                                    key={index}
                                    className={`p-2 md:p-3 rounded-lg md:rounded-xl border ${darkMode
                                        ? "bg-gray-800/50 border-gray-700"
                                        : "bg-purple-50/50 border-purple-100"
                                        } transition-all hover:shadow-md`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 md:w-4 md:h-4 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: color }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-xs md:text-sm font-semibold ${textClass} truncate`}>
                                                {item.category}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <p className={`text-[10px] md:text-xs font-bold ${textClass}`}>
                                                    {formatCurrency(item.total)}
                                                </p>
                                                <p className={`text-[10px] md:text-xs ${textSecondaryClass}`}>
                                                    ({percentage}%)
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                </div>

                {/* Listado Detallado de Categorías */}
                <div className="space-y-2 md:space-y-3">
                    {Object.entries(expensesByCategory)
                        .sort(([, subsA], [, subsB]) => {
                            const totalA = Object.values(subsA).flat().reduce((sum, exp) => sum + exp.amount, 0);
                            const totalB = Object.values(subsB).flat().reduce((sum, exp) => sum + exp.amount, 0);
                            return totalB - totalA;
                        })
                        .map(([category, subcategories]) => {
                            const categoryTotal = Object.values(subcategories).flat().reduce((sum, exp) => sum + exp.amount, 0);
                            const percentage = (categoryTotal / totalExpenses) * 100;
                            const isExpanded = expandedCategories[category];
                            const categoryData = categories[category];
                            const categoryColor = getCategoryColor(categoryData);

                            return (
                                <div
                                    key={category}
                                    className={`${darkMode
                                        ? "bg-gray-900/60 border-gray-800/60"
                                        : "bg-white/50"
                                        } rounded-xl md:rounded-2xl border ${darkMode ? "border-gray-800/60" : "border-purple-100"} p-2.5 md:p-4 sm:p-5 transition-all`}
                                >
                                    <button
                                        onClick={() => onToggleCategory(category)}
                                        className="w-full flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-2 md:gap-3 sm:gap-4">
                                            <span
                                                className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: categoryColor }}
                                            ></span>
                                            <div className="text-left min-w-0 flex-1">
                                                <p className={`text-sm md:text-base font-semibold ${textClass} truncate`}>
                                                    {category}
                                                </p>
                                                <p className={`text-xs md:text-sm ${textSecondaryClass} opacity-80`}>
                                                    {percentage.toFixed(1)}% del total
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                                            <span className={`text-sm md:text-base font-semibold ${textClass}`}>
                                                {formatCurrency(categoryTotal)}
                                            </span>
                                            {isExpanded ? (
                                                <ChevronUp className={`w-4 h-4 md:w-5 md:h-5 ${textSecondaryClass}`} />
                                            ) : (
                                                <ChevronDown className={`w-4 h-4 md:w-5 md:h-5 ${textSecondaryClass}`} />
                                            )}
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div className="mt-2 md:mt-3 space-y-1.5 md:space-y-2 pl-3 md:pl-5">
                                            {Object.entries(subcategories)
                                                .sort(([, expsA], [, expsB]) => {
                                                    const totalA = expsA.reduce((sum, exp) => sum + exp.amount, 0);
                                                    const totalB = expsB.reduce((sum, exp) => sum + exp.amount, 0);
                                                    return totalB - totalA;
                                                })
                                                .map(([subcategory, exps]) => {
                                                    const spent = exps.reduce((sum, exp) => sum + exp.amount, 0);
                                                    const subPercentage = (spent / totalExpenses) * 100;

                                                    return (
                                                        <div
                                                            key={subcategory}
                                                            className={`${darkMode
                                                                ? "bg-gray-900/50 border border-gray-700/50"
                                                                : "bg-white/60"
                                                                } rounded-lg md:rounded-xl p-2 md:p-3`}
                                                        >
                                                            <div className="flex justify-between items-center mb-1.5 md:mb-2">
                                                                <p className={`text-sm md:text-base font-medium ${textClass} truncate`}>
                                                                    {subcategory}
                                                                </p>
                                                                <span className={`text-xs md:text-sm font-semibold flex-shrink-0 ml-2 ${textSecondaryClass}`}>
                                                                    {formatCurrency(spent)}
                                                                </span>
                                                            </div>
                                                            <div className={`h-1.5 md:h-2 rounded-full ${darkMode ? "bg-gray-800" : "bg-purple-100"} overflow-hidden`}>
                                                                <div
                                                                    className="h-full"
                                                                    style={{
                                                                        width: `${Math.min(subPercentage, 100)}%`,
                                                                        backgroundColor: categoryColor,
                                                                        opacity: 0.8,
                                                                    }}
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

            {/* Calendario Mensual */}
            <div className={`${darkMode ? "bg-gray-800/50" : "bg-white/50"} rounded-xl md:rounded-2xl border ${darkMode ? "border-gray-700" : "border-purple-200"} p-4 md:p-6`}>
                {(() => {
                    const today = new Date();
                    let displayYear, displayMonth;

                    if (filterPeriodType === "month" && selectedMonth) {
                        const [yearNum, monthNum] = selectedMonth.split("-").map(Number);
                        displayYear = yearNum;
                        displayMonth = monthNum - 1;
                    } else {
                        displayYear = today.getFullYear();
                        displayMonth = today.getMonth();
                    }

                    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
                    const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
                    const firstDayOfMonth = new Date(displayYear, displayMonth, 1).getDay();
                    const firstDay = (firstDayOfMonth + 6) % 7;

                    const expensesByDay: { [key: number]: number } = {};
                    filteredExpenses.forEach((expense) => {
                        const [expYear, expMonth, expDay] = expense.date.split("-").map(Number);
                        if (expYear === displayYear && expMonth === displayMonth + 1) {
                            if (!expensesByDay[expDay]) expensesByDay[expDay] = 0;
                            expensesByDay[expDay] += expense.amount;
                        }
                    });

                    const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
                    const maxExpense = Math.max(...Object.values(expensesByDay), 0);
                    const isCurrentMonth = displayYear === today.getFullYear() && displayMonth === today.getMonth();

                    return (
                        <>
                            <h3 className={`text-lg md:text-xl font-bold ${textClass} mb-4`}>
                                Calendario de Gastos - {monthNames[displayMonth]} {displayYear}
                            </h3>
                            <div className="space-y-2">
                                <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
                                    {weekDays.map((day) => (
                                        <div key={day} className={`text-center text-xs md:text-sm font-semibold ${textSecondaryClass}`}>
                                            {day}
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 gap-1 md:gap-2">
                                    {Array.from({ length: firstDay }).map((_, i) => (
                                        <div key={`empty-${i}`} className="aspect-square"></div>
                                    ))}
                                    {Array.from({ length: daysInMonth }, (_, i) => {
                                        const day = i + 1;
                                        const dayExpense = expensesByDay[day] || 0;
                                        const isToday = isCurrentMonth && day === today.getDate();
                                        const intensity = maxExpense > 0 ? Math.min((dayExpense / maxExpense) * 100, 100) : 0;

                                        return (
                                            <div
                                                key={day}
                                                className={`aspect-square rounded-lg md:rounded-xl flex flex-col items-center justify-center p-1 transition-all ${isToday ? (darkMode ? "ring-2 ring-purple-500" : "ring-2 ring-purple-600") : ""} 
                                                ${dayExpense > 0
                                                        ? (darkMode ? "bg-purple-600/30 border border-purple-500/50" : "bg-purple-100 border border-purple-300")
                                                        : (darkMode ? "bg-gray-700/30 border border-gray-600/30" : "bg-gray-100/50 border border-gray-200")}`}
                                                style={{
                                                    backgroundColor: dayExpense > 0
                                                        ? (darkMode ? `rgba(147, 51, 234, ${0.2 + intensity / 200})` : `rgba(196, 181, 253, ${0.3 + intensity / 300})`)
                                                        : undefined
                                                }}
                                                title={dayExpense > 0 ? `€${dayExpense.toFixed(2)}` : ""}
                                            >
                                                <span className={`text-xs md:text-sm font-medium ${isToday ? "font-bold" : ""} ${textClass}`}>
                                                    {day}
                                                </span>
                                                {dayExpense > 0 && (
                                                    <span className={`text-[9px] md:text-xs font-semibold mt-0.5 ${darkMode ? "text-purple-300" : "text-purple-700"}`}>
                                                        -{dayExpense.toFixed(0)}€
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    );
                })()}
            </div>

            {/* Gráfico Semanal */}
            <div className={`${darkMode ? "bg-gray-800/50" : "bg-white/50"} rounded-xl md:rounded-2xl border ${darkMode ? "border-gray-700" : "border-purple-200"} p-4 md:p-6`}>
                <h3 className={`text-lg md:text-xl font-bold ${textClass} mb-4`}>
                    Gastos de la Semana
                </h3>
                {(() => {
                    const today = new Date();
                    const currentDay = today.getDay();
                    const daysFromMonday = (currentDay + 6) % 7;
                    const monday = new Date(today);
                    monday.setDate(today.getDate() - daysFromMonday);
                    monday.setHours(0, 0, 0, 0);

                    const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
                    const weekData = weekDays.map((dayName, index) => {
                        const dayDate = new Date(monday);
                        dayDate.setDate(monday.getDate() + index);
                        const year = dayDate.getFullYear();
                        const month = String(dayDate.getMonth() + 1).padStart(2, "0");
                        const day = String(dayDate.getDate()).padStart(2, "0");
                        const dayStr = `${year}-${month}-${day}`;

                        const dayExpenses = filteredExpenses.filter((exp) => exp.date === dayStr);
                        const total = dayExpenses.reduce((sum, exp) => sum + exp.amount, 0);

                        return {
                            day: dayName,
                            amount: total,
                        };
                    });

                    const maxAmount = Math.max(...weekData.map((d) => d.amount), 1);

                    return (
                        <div className="space-y-4">
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={weekData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#374151" : "#e5e7eb"} opacity={0.3} />
                                    <XAxis
                                        dataKey="day"
                                        tick={{ fill: darkMode ? "#9ca3af" : "#6b7280", fontSize: 12 }}
                                        stroke={darkMode ? "#4b5563" : "#d1d5db"}
                                    />
                                    <YAxis
                                        tick={{ fill: darkMode ? "#9ca3af" : "#6b7280", fontSize: 12 }}
                                        stroke={darkMode ? "#4b5563" : "#d1d5db"}
                                        tickFormatter={(value) => `€${value}`}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: darkMode ? "#1f2937" : "#ffffff",
                                            border: darkMode ? "1px solid #374151" : "1px solid #e5e7eb",
                                            borderRadius: "8px",
                                        }}
                                        formatter={(value: number) => [`€${value.toFixed(2)}`, "Gasto"]}
                                        labelFormatter={(label) => `Día: ${label}`}
                                    />
                                    <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                                        {weekData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.amount > 0
                                                    ? (darkMode
                                                        ? `rgba(147, 51, 234, ${0.4 + (entry.amount / maxAmount) * 0.6})`
                                                        : `rgba(139, 92, 246, ${0.5 + (entry.amount / maxAmount) * 0.5})`)
                                                    : (darkMode ? "#374151" : "#e5e7eb")}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                            <div className={`flex items-center justify-between pt-2 border-t ${darkMode ? "border-gray-600" : "border-gray-300"}`}>
                                <span className={`text-sm font-medium ${textSecondaryClass}`}>
                                    Total de la semana:
                                </span>
                                <span className={`text-lg font-bold ${textClass}`}>
                                    {formatCurrency(weekData.reduce((sum, d) => sum + d.amount, 0))}
                                </span>
                            </div>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    // Custom comparison function - only re-render if these props change
    return (
        prevProps.categoryTotals === nextProps.categoryTotals &&
        prevProps.totalExpenses === nextProps.totalExpenses &&
        prevProps.darkMode === nextProps.darkMode &&
        prevProps.expandedCategories === nextProps.expandedCategories &&
        prevProps.filteredExpenses === nextProps.filteredExpenses &&
        prevProps.filterPeriodType === nextProps.filterPeriodType &&
        prevProps.selectedMonth === nextProps.selectedMonth
    );
});

ExpensesChart.displayName = 'ExpensesChart';

export default ExpensesChart;
