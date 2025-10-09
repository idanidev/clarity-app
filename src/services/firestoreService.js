// src/services/firestoreService.js
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    setDoc,
    updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";

// ==================== EXPENSES ====================

export const addExpense = async (userId, expenseData) => {
  try {
    const expensesRef = collection(db, "users", userId, "expenses");
    const docRef = await addDoc(expensesRef, {
      ...expenseData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return { id: docRef.id, ...expenseData };
  } catch (error) {
    console.error("Error adding expense:", error);
    throw error;
  }
};

export const updateExpense = async (userId, expenseId, expenseData) => {
  try {
    const expenseRef = doc(db, "users", userId, "expenses", expenseId);
    await updateDoc(expenseRef, {
      ...expenseData,
      updatedAt: new Date().toISOString(),
    });
    return { id: expenseId, ...expenseData };
  } catch (error) {
    console.error("Error updating expense:", error);
    throw error;
  }
};

export const deleteExpense = async (userId, expenseId) => {
  try {
    const expenseRef = doc(db, "users", userId, "expenses", expenseId);
    await deleteDoc(expenseRef);
  } catch (error) {
    console.error("Error deleting expense:", error);
    throw error;
  }
};

export const getExpenses = async (userId) => {
  try {
    const expensesRef = collection(db, "users", userId, "expenses");
    const q = query(expensesRef, orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting expenses:", error);
    throw error;
  }
};

export const subscribeToExpenses = (userId, callback) => {
  const expensesRef = collection(db, "users", userId, "expenses");
  const q = query(expensesRef, orderBy("date", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const expenses = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(expenses);
    },
    (error) => {
      console.error("Error in expenses subscription:", error);
    }
  );
};

// ==================== CATEGORIES ====================

export const saveCategories = async (userId, categories) => {
  try {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      categories,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error saving categories:", error);
    throw error;
  }
};

export const getUserCategories = async (userId) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      return userDoc.data().categories || null;
    }
    return null;
  } catch (error) {
    console.error("Error getting categories:", error);
    throw error;
  }
};

export const getCategories = async (userId) => {
  return getUserCategories(userId);
};

// ==================== BUDGETS ====================

export const saveBudgets = async (userId, budgets) => {
  try {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      budgets,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error saving budgets:", error);
    throw error;
  }
};

export const getUserBudgets = async (userId) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      return userDoc.data().budgets || null;
    }
    return null;
  } catch (error) {
    console.error("Error getting budgets:", error);
    throw error;
  }
};

export const getBudgets = async (userId) => {
  return getUserBudgets(userId);
};

// ==================== USER INITIALIZATION ====================

export const initializeUser = async (userId, userData) => {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);
    const defaultCategories = {
      Alimentacion: ["Supermercado", "Restaurantes", "Cafeterias"],
      Transporte: ["Combustible", "Transporte publico", "Taxi"],
      Vivienda: ["Alquiler", "Hipoteca", "Suministros"],
      Ocio: ["Streaming", "Deportes", "Hobbies"],
      Salud: ["Medico", "Farmacia", "Gimnasio"],
      Compras: ["Ropa", "Electronica", "Otros"],
      Educacion: ["Cursos", "Libros", "Material"],
    };

    if (userDoc.exists()) {
      const updateData = {
        ...userData,
        updatedAt: new Date().toISOString(),
      };

      const currentData = userDoc.data();
      if (!currentData.categories) {
        updateData.categories = defaultCategories;
      }
      if (!currentData.budgets) {
        updateData.budgets = {};
      }

      await updateDoc(userDocRef, updateData);
      return;
    }

    await setDoc(userDocRef, {
      ...userData,
      categories: defaultCategories,
      budgets: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error initializing user:", error);
    throw error;
  }
};
