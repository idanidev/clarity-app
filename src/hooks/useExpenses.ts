import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  DocumentData 
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Expense } from '../types';

interface UseExpensesReturn {
  expenses: Expense[];
  loading: boolean;
  error: Error | null;
}

export const useExpenses = (userId: string | undefined): UseExpensesReturn => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, 'expenses'),
        where('userId', '==', userId),
        orderBy('date', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as Expense[];
          
          setExpenses(data);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Error fetching expenses:', err);
          setError(err as Error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up expenses listener:', err);
      setError(err as Error);
      setLoading(false);
    }
  }, [userId]);

  return { expenses, loading, error };
};

