import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import type { Categories } from '../types';

interface UseCategoriesReturn {
  categories: Categories;
  loading: boolean;
  error: Error | null;
}

export const useCategories = (userId: string | undefined): UseCategoriesReturn => {
  const [categories, setCategories] = useState<Categories>({});
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
            setCategories(data.categories || {});
          }
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Error fetching categories:', err);
          setError(err as Error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up categories listener:', err);
      setError(err as Error);
      setLoading(false);
    }
  }, [userId]);

  return { categories, loading, error };
};

