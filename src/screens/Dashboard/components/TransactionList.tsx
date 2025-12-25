import { ChevronDown, ChevronUp, Search, Wallet } from "@/components/icons";
import { Expense } from "../../../types";
import ExpenseCard from "./ExpenseCard";
import { formatCurrency } from "../../../utils/currency"; // Check path
// @ts-ignore
import { getCategoryColor } from "../../../services/firestoreService";
import { useHaptics } from "../../../hooks/useHaptics";
import { memo } from "react";

interface TransactionListProps {
    expensesByCategory: { [category: string]: { [subcategory: string]: Expense[] } };
    categories: any;
    expandedCategories: { [category: string]: boolean };
    onToggleCategory: (category: string) => void;
    expandedSubcategories: Record<string, boolean>;
    setExpandedSubcategories: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    searchQuery: string;
    darkMode: boolean;
    textClass: string;
    textSecondaryClass: string;
    onEditExpense: (expense: Expense) => void;
    onDeleteExpense: (expense: Expense) => void;
    categoryColors: { [key: string]: string };
    isMobile: boolean;

}

const TransactionList = memo(({
    expensesByCategory,
    categories,
    expandedCategories,
    onToggleCategory,
    expandedSubcategories,
    setExpandedSubcategories,
    searchQuery,
    darkMode,
    textClass,
    textSecondaryClass,
    onEditExpense,
    onDeleteExpense,
    categoryColors,
    isMobile
}: TransactionListProps) => {
    const { lightImpact } = useHaptics();

    // Calculate if there are any results to show
    const hasExpenses = Object.keys(expensesByCategory).length > 0;

    if (!hasExpenses && !searchQuery) {
        return (
            <div className="text-center py-16">
                <Wallet className={`w-16 h-16 mx-auto ${textSecondaryClass} mb-4`} />
                <h3 className={`text-xl font-medium mb-2 ${textClass}`}>No hay gastos</h3>
                <p className={`${textSecondaryClass} mb-6`}>Añade tu primer gasto para comenzar</p>
            </div>
        );
    }

    // If we have a search query but no results
    if (!hasExpenses && searchQuery) {
        return (
            <div className="text-center py-12">
                <Search className={`w-12 h-12 mx-auto ${textSecondaryClass} mb-4 opacity-50`} />
                <h3 className={`text-lg font-medium mb-2 ${textClass}`}>No se encontraron resultados</h3>
                <p className={`${textSecondaryClass} text-sm`}>Intenta con otros términos de búsqueda</p>
            </div>
        );
    }

    return (
        <div className="space-y-1.5 sm:space-y-6">
            {Object.entries(expensesByCategory).map(([category, subcategories]) => {


                const isExpanded = expandedCategories[category];
                const categoryColor = categoryColors[category] || getCategoryColor(categories[category]) || "#8B5CF6";

                // Calculate filtered count and total (in case searchQuery is active, expensesByCategory should already be filtered)
                const allExpenses = Object.values(subcategories).flat();
                const filteredCount = allExpenses.length;
                const filteredTotal = allExpenses.reduce((sum, exp) => sum + exp.amount, 0);

                return (
                    <div key={category} className="mb-2 sm:mb-3">
                        <button
                            onClick={() => {
                                lightImpact();
                                onToggleCategory(category);
                            }}
                            className={`w-full rounded-xl sm:rounded-2xl ${darkMode
                                ? "bg-gray-800/60 hover:bg-gray-800 border border-gray-700/50"
                                : "bg-white hover:bg-purple-50/50 border border-purple-200/50 shadow-sm"
                                } px-3 py-2.5 sm:px-4 sm:py-3.5 flex items-center justify-between gap-2 transition-all hover:shadow-md`}
                            style={{
                                borderLeftWidth: "6px",
                                borderLeftColor: categoryColor,
                            }}
                        >
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                {isExpanded ? (
                                    <ChevronUp className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${textSecondaryClass}`} />
                                ) : (
                                    <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${textSecondaryClass}`} />
                                )}
                                <div
                                    className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0 shadow-sm"
                                    style={{ backgroundColor: categoryColor }}
                                />
                                <div className="flex-1 min-w-0 flex items-center gap-2">
                                    <p className={`text-xs sm:text-sm font-bold truncate ${textClass}`}>{category}</p>
                                    <span className={`text-xs ${textSecondaryClass} whitespace-nowrap`}>
                                        {filteredCount} {filteredCount === 1 ? "gasto" : "gastos"}
                                    </span>
                                </div>
                                <div className="flex flex-col items-end flex-shrink-0">
                                    <span className={`text-sm sm:text-base font-bold ${textClass}`}>
                                        {formatCurrency(filteredTotal)}
                                    </span>
                                </div>
                            </div>
                        </button>

                        {isExpanded && (
                            <div
                                className="mt-2 sm:mt-3 ml-2 sm:ml-4 space-y-1.5 sm:space-y-2 transition-all duration-300 border-l-4 pl-3 sm:pl-4"
                                style={{ borderColor: `${categoryColor}A0` }}
                            >
                                {Object.entries(subcategories).map(([subcategory, exps]) => {
                                    const subTotal = exps.reduce((sum, exp) => sum + exp.amount, 0);
                                    const subCount = exps.length;
                                    const subKey = category + "::" + (subcategory || "__none__");
                                    const isSubExpanded = expandedSubcategories[subKey] ?? true;

                                    return (
                                        <div key={subcategory} className="space-y-1.5 sm:space-y-2">
                                            {/* Subcategory Header */}
                                            <div
                                                className={`flex items-center justify-between rounded-xl px-2 py-1.5 sm:px-3 sm:py-2 cursor-pointer ${darkMode
                                                    ? "bg-gray-900/80 border border-gray-700/60"
                                                    : "bg-white/90 border border-purple-100/80"
                                                    }`}
                                                onClick={() => {
                                                    lightImpact();
                                                    setExpandedSubcategories((prev) => ({
                                                        ...prev,
                                                        [subKey]: !isSubExpanded,
                                                    }));
                                                }}
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    {isSubExpanded ? (
                                                        <ChevronUp className={`w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 ${textSecondaryClass}`} />
                                                    ) : (
                                                        <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 ${textSecondaryClass}`} />
                                                    )}
                                                    <span className={`text-xs sm:text-sm font-semibold truncate ${textClass} ml-1`}>
                                                        {subcategory || "Sin subcategoría"}
                                                    </span>
                                                    <span className={`text-[11px] sm:text-xs ${textSecondaryClass}`}>
                                                        {subCount} {subCount === 1 ? "gasto" : "gastos"}
                                                    </span>
                                                </div>
                                                <span className={`text-xs sm:text-sm font-semibold ${darkMode ? "text-gray-100" : "text-gray-900"}`}>
                                                    {formatCurrency(subTotal)}
                                                </span>
                                            </div>

                                            {/* Expense List */}
                                            {isSubExpanded && (
                                                <div className="space-y-1 sm:space-y-1.5">
                                                    {exps.map((expense) => (
                                                        <div
                                                            key={expense.id}
                                                            onClick={(e) => e.stopPropagation()}
                                                            onTouchStart={(e) => e.stopPropagation()}
                                                            onTouchEnd={(e) => e.stopPropagation()}
                                                        >
                                                            <ExpenseCard
                                                                expense={{ ...expense, category: category }}
                                                                onEdit={onEditExpense}
                                                                onDelete={onDeleteExpense}
                                                                darkMode={darkMode}
                                                                isMobile={isMobile}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
});

TransactionList.displayName = 'TransactionList';

export default TransactionList;
