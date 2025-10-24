import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useExpenseStore = create(
  persist(
    (set, get) => ({
      // State
      expenses: [],
      categories: {},
      budgets: {},
      recurringExpenses: [],
      darkMode: false,
      selectedMonth: new Date().toISOString().slice(0, 7),
      selectedCategory: 'all',

      // Actions
      setExpenses: (expenses) => set({ expenses }),
      
      addExpense: (expense) => set((state) => ({
        expenses: [...state.expenses, expense]
      })),
      
      updateExpense: (id, updates) => set((state) => ({
        expenses: state.expenses.map((exp) =>
          exp.id === id ? { ...exp, ...updates } : exp
        )
      })),
      
      deleteExpense: (id) => set((state) => ({
        expenses: state.expenses.filter((exp) => exp.id !== id)
      })),

      setCategories: (categories) => set({ categories }),
      
      addCategory: (category, subcategories = []) => set((state) => ({
        categories: { ...state.categories, [category]: subcategories }
      })),
      
      deleteCategory: (category) => set((state) => {
        const newCategories = { ...state.categories };
        delete newCategories[category];
        return { categories: newCategories };
      }),
      
      addSubcategory: (category, subcategory) => set((state) => ({
        categories: {
          ...state.categories,
          [category]: [...(state.categories[category] || []), subcategory]
        }
      })),
      
      deleteSubcategory: (category, subcategory) => set((state) => ({
        categories: {
          ...state.categories,
          [category]: state.categories[category].filter((sub) => sub !== subcategory)
        }
      })),

      setBudgets: (budgets) => set({ budgets }),
      
      addBudget: (category, amount) => set((state) => ({
        budgets: { ...state.budgets, [category]: amount }
      })),
      
      deleteBudget: (category) => set((state) => {
        const newBudgets = { ...state.budgets };
        delete newBudgets[category];
        return { budgets: newBudgets };
      }),

      setRecurringExpenses: (recurringExpenses) => set({ recurringExpenses }),
      
      addRecurringExpense: (expense) => set((state) => ({
        recurringExpenses: [...state.recurringExpenses, expense]
      })),
      
      updateRecurringExpense: (id, updates) => set((state) => ({
        recurringExpenses: state.recurringExpenses.map((exp) =>
          exp.id === id ? { ...exp, ...updates } : exp
        )
      })),
      
      deleteRecurringExpense: (id) => set((state) => ({
        recurringExpenses: state.recurringExpenses.filter((exp) => exp.id !== id)
      })),

      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      setDarkMode: (darkMode) => set({ darkMode }),
      
      setSelectedMonth: (month) => set({ selectedMonth: month }),
      setSelectedCategory: (category) => set({ selectedCategory: category }),

      // Computed values
      getFilteredExpenses: () => {
        const { expenses, selectedMonth, selectedCategory } = get();
        return expenses.filter((expense) => {
          const matchesMonth = expense.date.startsWith(selectedMonth);
          const matchesCategory =
            selectedCategory === 'all' || expense.category === selectedCategory;
          return matchesMonth && matchesCategory;
        });
      },

      getTotalExpenses: () => {
        const filteredExpenses = get().getFilteredExpenses();
        return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      },

      getExpensesByCategory: () => {
        const filteredExpenses = get().getFilteredExpenses();
        return filteredExpenses.reduce((acc, expense) => {
          if (!acc[expense.category]) {
            acc[expense.category] = {};
          }
          if (!acc[expense.category][expense.subcategory]) {
            acc[expense.category][expense.subcategory] = [];
          }
          acc[expense.category][expense.subcategory].push(expense);
          return acc;
        }, {});
      },

      getCategoryTotals: () => {
        const expensesByCategory = get().getExpensesByCategory();
        return Object.entries(expensesByCategory).map(([category, subcategories]) => {
          const total = Object.values(subcategories)
            .flat()
            .reduce((sum, exp) => sum + exp.amount, 0);
          return { category, total };
        });
      },

      getOverBudgetCategories: () => {
        const { budgets } = get();
        const categoryTotals = get().getCategoryTotals();
        return Object.entries(budgets)
          .filter(([category, budget]) => {
            const categoryTotal =
              categoryTotals.find((ct) => ct.category === category)?.total || 0;
            return categoryTotal > budget;
          })
          .map(([category]) => category);
      },

      getRecentExpenses: (limit = 10) => {
        const { expenses } = get();
        return [...expenses]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, limit);
      }
    }),
    {
      name: 'clarity-storage',
      partialize: (state) => ({
        darkMode: state.darkMode,
        selectedMonth: state.selectedMonth,
        selectedCategory: state.selectedCategory
      })
    }
  )
);
