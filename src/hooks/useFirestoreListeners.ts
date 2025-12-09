// src/hooks/useFirestoreListeners.ts
// Hook consolidado para listeners de Firestore
// Evita listeners duplicados y reduce coste de lectura

import { useEffect, useRef, useState } from 'react';
import { subscribeToExpenses, subscribeToRecurringExpenses } from '../services/firestoreService';

interface Expense {
  id: string;
  [key: string]: any;
}

interface RecurringExpense {
  id: string;
  [key: string]: any;
}

interface UseFirestoreListenersProps {
  userId: string | null;
  enabled?: boolean;
}

export const useFirestoreListeners = ({
  userId,
  enabled = true,
}: UseFirestoreListenersProps) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const unsubscribeExpensesRef = useRef<(() => void) | null>(null);
  const unsubscribeRecurringRef = useRef<(() => void) | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!userId || !enabled) {
      setExpenses([]);
      setRecurringExpenses([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Limpiar listeners anteriores
    if (unsubscribeExpensesRef.current) {
      unsubscribeExpensesRef.current();
      unsubscribeExpensesRef.current = null;
    }
    if (unsubscribeRecurringRef.current) {
      unsubscribeRecurringRef.current();
      unsubscribeRecurringRef.current = null;
    }

    // Suscribirse a gastos
    try {
      unsubscribeExpensesRef.current = subscribeToExpenses(userId, (expensesData) => {
        if (isMountedRef.current) {
          setExpenses(expensesData);
          setLoading(false);
        }
      });
    } catch (err) {
      console.error('Error subscribing to expenses:', err);
      setError(err as Error);
      setLoading(false);
    }

    // Suscribirse a gastos recurrentes
    try {
      unsubscribeRecurringRef.current = subscribeToRecurringExpenses(
        userId,
        (recurringData) => {
          if (isMountedRef.current) {
            setRecurringExpenses(recurringData);
          }
        }
      );
    } catch (err) {
      console.error('Error subscribing to recurring expenses:', err);
      // No actualizar loading aquí porque expenses ya lo hizo
    }

    return () => {
      if (unsubscribeExpensesRef.current) {
        unsubscribeExpensesRef.current();
        unsubscribeExpensesRef.current = null;
      }
      if (unsubscribeRecurringRef.current) {
        unsubscribeRecurringRef.current();
        unsubscribeRecurringRef.current = null;
      }
    };
  }, [userId, enabled]);

  return {
    expenses,
    recurringExpenses,
    loading,
    error,
  };
};

