// src/hooks/useExpensesData.ts
// Hook consolidado para gestión de datos de gastos
// Reduce re-renders y consolida lógica

import { useMemo, useCallback } from 'react';

export interface Expense {
  id: string;
  name: string;
  amount: number;
  category: string;
  subcategory: string;
  date: string;
  paymentMethod: string;
  isRecurring: boolean;
  recurringId: string | null;
  createdAt: any;
  updatedAt?: any;
}

export interface CategoryTotal {
  category: string;
  total: number;
}

interface UseExpensesDataProps {
  expenses: Expense[];
  filterPeriodType: 'month' | 'year' | 'all';
  selectedMonth: string;
  selectedYear: string;
  selectedCategory: string;
}

export const useExpensesData = ({
  expenses,
  filterPeriodType,
  selectedMonth,
  selectedYear,
  selectedCategory,
}: UseExpensesDataProps) => {
  // ============================================
  // FILTRADO DE GASTOS (Memoizado)
  // ============================================
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      // Filtro de categoría
      const matchesCategory =
        selectedCategory === 'all' || expense.category === selectedCategory;

      if (!matchesCategory) return false;

      // Filtro de período
      switch (filterPeriodType) {
        case 'all':
          return true;
        case 'year':
          return expense.date.startsWith(selectedYear);
        case 'month':
        default:
          return expense.date.startsWith(selectedMonth);
      }
    });
  }, [expenses, filterPeriodType, selectedMonth, selectedYear, selectedCategory]);

  // ============================================
  // TOTAL DE GASTOS (Memoizado)
  // ============================================
  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [filteredExpenses]);

  // ============================================
  // GASTOS POR CATEGORÍA (Memoizado)
  // ============================================
  const expensesByCategory = useMemo(() => {
    return filteredExpenses.reduce(
      (acc, expense) => {
        if (!acc[expense.category]) {
          acc[expense.category] = {};
        }
        if (!acc[expense.category][expense.subcategory]) {
          acc[expense.category][expense.subcategory] = [];
        }
        acc[expense.category][expense.subcategory].push(expense);
        return acc;
      },
      {} as Record<string, Record<string, Expense[]>>
    );
  }, [filteredExpenses]);

  // ============================================
  // TOTALES POR CATEGORÍA (Memoizado)
  // ============================================
  const categoryTotals = useMemo(() => {
    return Object.entries(expensesByCategory).map(([category, subcategories]) => {
      const total = Object.values(subcategories)
        .flat()
        .reduce((sum, exp) => sum + exp.amount, 0);
      return { category, total };
    });
  }, [expensesByCategory]);

  // ============================================
  // TOTALES DEL MES ACTUAL (Para presupuestos)
  // ============================================
  const categoryTotalsForBudgets = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const totals: Record<string, number> = {};
    
    expenses.forEach((expense) => {
      // Solo contar gastos del mes actual para presupuestos
      if (expense.date.startsWith(currentMonth)) {
        totals[expense.category] = (totals[expense.category] || 0) + expense.amount;
      }
    });
    
    return Object.entries(totals).map(([category, total]) => ({
      category,
      total,
    }));
  }, [expenses]);

  // ============================================
  // GASTOS RECIENTES (Memoizado)
  // ============================================
  const recentExpenses = useMemo(() => {
    return [...expenses]
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || a.date);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || b.date);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 10);
  }, [expenses]);

  // ============================================
  // ESTADÍSTICAS ADICIONALES (Memoizado)
  // ============================================
  const stats = useMemo(() => {
    const totalCount = filteredExpenses.length;
    const avgExpense = totalCount > 0 ? totalExpenses / totalCount : 0;
    const maxExpense = filteredExpenses.length > 0
      ? Math.max(...filteredExpenses.map((e) => e.amount))
      : 0;
    const minExpense = filteredExpenses.length > 0
      ? Math.min(...filteredExpenses.map((e) => e.amount))
      : 0;

    return {
      totalCount,
      avgExpense,
      maxExpense,
      minExpense,
    };
  }, [filteredExpenses, totalExpenses]);

  return {
    filteredExpenses,
    totalExpenses,
    expensesByCategory,
    categoryTotals,
    categoryTotalsForBudgets,
    recentExpenses,
    stats,
  };
};

