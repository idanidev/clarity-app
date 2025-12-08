import { useState, useEffect, useMemo } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import type { Budgets, Budget, Expense } from '../types';

interface UseBudgetsReturn {
  budgets: Budgets;
  budgetsWithSpent: Budget[];
  loading: boolean;
  error: Error | null;
}

export const useBudgets = (
  userId: string | undefined,
  expenses: Expense[],
  currentMonth: string
): UseBudgetsReturn => {
  const [budgets, setBudgets] = useState<Budgets>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const userDocRef = doc(db, 'users', userId);

      const unsubscribe = onSnapshot(
        userDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setBudgets(data.budgets || {});
          }
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Error fetching budgets:', err);
          setError(err as Error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up budgets listener:', err);
      setError(err as Error);
      setLoading(false);
    }
  }, [userId]);

  const budgetsWithSpent = useMemo(() => {
    const monthlyExpenses = expenses.filter(
      expense => expense.date.startsWith(currentMonth)
    );

    return Object.entries(budgets).map(([category, amount]) => {
      const spent = monthlyExpenses
        .filter(expense => expense.category === category)
        .reduce((sum, expense) => sum + expense.amount, 0);

      const percentage = amount > 0 ? (spent / amount) * 100 : 0;

      return {
        category,
        amount,
        spent,
        percentage,
      };
    });
  }, [budgets, expenses, currentMonth]);

  return { budgets, budgetsWithSpent, loading, error };
};

