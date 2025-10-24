import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";

// ==================== EXPENSES ====================

export const fetchExpenses = async (userId) => {
  try {
    const expensesRef = collection(db, "users", userId, "expenses");
    const q = query(expensesRef, orderBy("date", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate?.() || new Date(doc.data().date),
    }));
  } catch (error) {
    console.error("Error fetching expenses:", error);
    throw error;
  }
};

export const addExpense = async (userId, expenseData) => {
  try {
    const expensesRef = collection(db, "users", userId, "expenses");
    const newDocRef = doc(expensesRef);

    const expense = {
      ...expenseData,
      date: Timestamp.fromDate(new Date(expenseData.date)),
      createdAt: Timestamp.now(),
    };

    await setDoc(newDocRef, expense);
    return { id: newDocRef.id, ...expense };
  } catch (error) {
    console.error("Error adding expense:", error);
    throw error;
  }
};

export const updateExpense = async (userId, expenseId, expenseData) => {
  try {
    const expenseRef = doc(db, "users", userId, "expenses", expenseId);

    const expense = {
      ...expenseData,
      date:
        expenseData.date instanceof Date
          ? Timestamp.fromDate(expenseData.date)
          : expenseData.date,
      updatedAt: Timestamp.now(),
    };

    await updateDoc(expenseRef, expense);
    return { id: expenseId, ...expense };
  } catch (error) {
    console.error("Error updating expense:", error);
    throw error;
  }
};

export const deleteExpense = async (userId, expenseId) => {
  try {
    const expenseRef = doc(db, "users", userId, "expenses", expenseId);
    await deleteDoc(expenseRef);
    return expenseId;
  } catch (error) {
    console.error("Error deleting expense:", error);
    throw error;
  }
};

// ==================== CATEGORIES ====================

export const fetchCategories = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      return userDoc.data().categories || {};
    }
    return {};
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
};

export const saveCategories = async (userId, categories) => {
  try {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, { categories }, { merge: true });
    return categories;
  } catch (error) {
    console.error("Error saving categories:", error);
    throw error;
  }
};

// ==================== BUDGETS ====================

export const fetchBudgets = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      return userDoc.data().budgets || {};
    }
    return {};
  } catch (error) {
    console.error("Error fetching budgets:", error);
    throw error;
  }
};

export const saveBudgets = async (userId, budgets) => {
  try {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, { budgets }, { merge: true });
    return budgets;
  } catch (error) {
    console.error("Error saving budgets:", error);
    throw error;
  }
};

// ==================== RECURRING EXPENSES ====================

export const fetchRecurringExpenses = async (userId) => {
  try {
    const recurringRef = collection(db, "users", userId, "recurringExpenses");
    const snapshot = await getDocs(recurringRef);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching recurring expenses:", error);
    throw error;
  }
};

export const addRecurringExpense = async (userId, recurringData) => {
  try {
    const recurringRef = collection(db, "users", userId, "recurringExpenses");
    const newDocRef = doc(recurringRef);

    const recurring = {
      ...recurringData,
      createdAt: Timestamp.now(),
    };

    await setDoc(newDocRef, recurring);
    return { id: newDocRef.id, ...recurring };
  } catch (error) {
    console.error("Error adding recurring expense:", error);
    throw error;
  }
};

export const updateRecurringExpense = async (
  userId,
  recurringId,
  recurringData
) => {
  try {
    const recurringRef = doc(
      db,
      "users",
      userId,
      "recurringExpenses",
      recurringId
    );

    const recurring = {
      ...recurringData,
      updatedAt: Timestamp.now(),
    };

    await updateDoc(recurringRef, recurring);
    return { id: recurringId, ...recurring };
  } catch (error) {
    console.error("Error updating recurring expense:", error);
    throw error;
  }
};

export const deleteRecurringExpense = async (userId, recurringId) => {
  try {
    const recurringRef = doc(
      db,
      "users",
      userId,
      "recurringExpenses",
      recurringId
    );
    await deleteDoc(recurringRef);
    return recurringId;
  } catch (error) {
    console.error("Error deleting recurring expense:", error);
    throw error;
  }
};

// ==================== USER SETTINGS ====================

export const fetchUserSettings = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      return userDoc.data().settings || {};
    }
    return {};
  } catch (error) {
    console.error("Error fetching user settings:", error);
    throw error;
  }
};

export const saveUserSettings = async (userId, settings) => {
  try {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, { settings }, { merge: true });
    return settings;
  } catch (error) {
    console.error("Error saving user settings:", error);
    throw error;
  }
};

export const saveTheme = async (userId, theme) => {
  try {
    const userRef = doc(db, "users", userId);
    await setDoc(
      userRef,
      {
        settings: { theme },
      },
      { merge: true }
    );
    return theme;
  } catch (error) {
    console.error("Error saving theme:", error);
    throw error;
  }
};
