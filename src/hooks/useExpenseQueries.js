import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  addExpense as addExpenseDB,
  addRecurringExpense as addRecurringDB,
  deleteExpense as deleteExpenseDB,
  deleteRecurringExpense as deleteRecurringDB,
  fetchBudgets,
  fetchCategories,
  fetchExpenses,
  fetchRecurringExpenses,
  saveBudgets,
  saveCategories,
  saveTheme,
  updateExpense as updateExpenseDB,
  updateRecurringExpense as updateRecurringDB,
} from "../services/firestoreService";
import { useExpenseStore } from "../store/expenseStore";

export const useExpenses = (userId) => {
  const setExpenses = useExpenseStore((state) => state.setExpenses);

  return useQuery({
    queryKey: ["expenses", userId],
    queryFn: async () => {
      const expenses = await fetchExpenses(userId);
      setExpenses(expenses);
      return expenses;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useAddExpense = (userId) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addExpense = useExpenseStore((state) => state.addExpense);

  return useMutation({
    mutationFn: (expenseData) => addExpenseDB(userId, expenseData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["expenses", userId] });
      addExpense(data);
      toast.success(t("expenseAdded"));
    },
    onError: () => {
      toast.error(t("errorOccurred"));
    },
  });
};

export const useUpdateExpense = (userId) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const updateExpense = useExpenseStore((state) => state.updateExpense);

  return useMutation({
    mutationFn: ({ expenseId, expenseData }) =>
      updateExpenseDB(userId, expenseId, expenseData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["expenses", userId] });
      updateExpense(data.id, data);
      toast.success(t("expenseUpdated"));
    },
    onError: () => {
      toast.error(t("errorOccurred"));
    },
  });
};

export const useDeleteExpense = (userId) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const deleteExpense = useExpenseStore((state) => state.deleteExpense);

  return useMutation({
    mutationFn: (expenseId) => deleteExpenseDB(userId, expenseId),
    onSuccess: (_, expenseId) => {
      queryClient.invalidateQueries({ queryKey: ["expenses", userId] });
      deleteExpense(expenseId);
      toast.success(t("expenseDeleted"));
    },
    onError: () => {
      toast.error(t("errorOccurred"));
    },
  });
};

export const useRecurringExpenses = (userId) => {
  const setRecurringExpenses = useExpenseStore(
    (state) => state.setRecurringExpenses
  );

  return useQuery({
    queryKey: ["recurringExpenses", userId],
    queryFn: async () => {
      const expenses = await fetchRecurringExpenses(userId);
      setRecurringExpenses(expenses);
      return expenses;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
};

export const useAddRecurringExpense = (userId) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addRecurringExpense = useExpenseStore(
    (state) => state.addRecurringExpense
  );

  return useMutation({
    mutationFn: (recurringData) => addRecurringDB(userId, recurringData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["recurringExpenses", userId],
      });
      addRecurringExpense(data);
      toast.success(t("expenseAdded"));
    },
    onError: () => {
      toast.error(t("errorOccurred"));
    },
  });
};

export const useUpdateRecurringExpense = (userId) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const updateRecurringExpense = useExpenseStore(
    (state) => state.updateRecurringExpense
  );

  return useMutation({
    mutationFn: ({ recurringId, recurringData }) =>
      updateRecurringDB(userId, recurringId, recurringData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["recurringExpenses", userId],
      });
      updateRecurringExpense(data.id, data);
      toast.success(t("expenseUpdated"));
    },
    onError: () => {
      toast.error(t("errorOccurred"));
    },
  });
};

export const useDeleteRecurringExpense = (userId) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const deleteRecurringExpense = useExpenseStore(
    (state) => state.deleteRecurringExpense
  );

  return useMutation({
    mutationFn: (recurringId) => deleteRecurringDB(userId, recurringId),
    onSuccess: (_, recurringId) => {
      queryClient.invalidateQueries({
        queryKey: ["recurringExpenses", userId],
      });
      deleteRecurringExpense(recurringId);
      toast.success(t("expenseDeleted"));
    },
    onError: () => {
      toast.error(t("errorOccurred"));
    },
  });
};

export const useCategories = (userId) => {
  const setCategories = useExpenseStore((state) => state.setCategories);

  return useQuery({
    queryKey: ["categories", userId],
    queryFn: async () => {
      const categories = await fetchCategories(userId);
      setCategories(categories);
      return categories;
    },
    enabled: !!userId,
  });
};

export const useSaveCategories = (userId) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const setCategories = useExpenseStore((state) => state.setCategories);

  return useMutation({
    mutationFn: (categories) => saveCategories(userId, categories),
    onSuccess: (_, categories) => {
      queryClient.invalidateQueries({ queryKey: ["categories", userId] });
      setCategories(categories);
      toast.success(t("categoryAdded"));
    },
    onError: () => {
      toast.error(t("errorOccurred"));
    },
  });
};

export const useBudgets = (userId) => {
  const setBudgets = useExpenseStore((state) => state.setBudgets);

  return useQuery({
    queryKey: ["budgets", userId],
    queryFn: async () => {
      const budgets = await fetchBudgets(userId);
      setBudgets(budgets);
      return budgets;
    },
    enabled: !!userId,
  });
};

export const useSaveBudgets = (userId) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const setBudgets = useExpenseStore((state) => state.setBudgets);

  return useMutation({
    mutationFn: (budgets) => saveBudgets(userId, budgets),
    onSuccess: (_, budgets) => {
      queryClient.invalidateQueries({ queryKey: ["budgets", userId] });
      setBudgets(budgets);
      toast.success(t("budgetCreated"));
    },
    onError: () => {
      toast.error(t("errorOccurred"));
    },
  });
};

export const useSaveTheme = (userId) => {
  const queryClient = useQueryClient();
  const setDarkMode = useExpenseStore((state) => state.setDarkMode);

  return useMutation({
    mutationFn: (theme) => saveTheme(userId, theme),
    onSuccess: (_, theme) => {
      queryClient.invalidateQueries({ queryKey: ["theme", userId] });
      setDarkMode(theme === "dark");
    },
  });
};
